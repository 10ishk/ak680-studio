use crate::hid_detection::matches_target_device;
use hidapi::{DeviceInfo, HidApi};
use serde::{Deserialize, Serialize};
use std::ffi::CString;

pub const WP21_LIGHTING_WRITE_REPORT_ID: u8 = 0;
pub const WP21_LIGHTING_WRITE_PACKET_LENGTH: usize = 64;
pub const WP21_LIGHTING_WRITE_USAGE_PAGE: u16 = 65384;
pub const WP21_LIGHTING_WRITE_USAGE: u16 = 97;
pub const FUNCTIONAL_LIGHTING_VARIABLE_INDEXES: [usize; 7] = [8, 9, 10, 11, 12, 17, 18];

pub const WP21_LIGHTING_WRITE_PACKET: [u8; WP21_LIGHTING_WRITE_PACKET_LENGTH] = [
    0xAA, 0x23, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0xFF, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00,
    0x00, 0x05, 0x03, 0x00, 0x00, 0x00, 0xAA, 0x55, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlledLightingWriteRequest {
    pub selected_path: String,
    pub vendor_id: u16,
    pub product_id: u16,
    pub usage_page: Option<u16>,
    pub usage: Option<u16>,
    pub manual_confirmation: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FunctionalLightingWriteRequest {
    pub selected_path: String,
    pub vendor_id: u16,
    pub product_id: u16,
    pub usage_page: Option<u16>,
    pub usage: Option<u16>,
    pub manual_confirmation: bool,
    pub red: u16,
    pub green: u16,
    pub blue: u16,
    pub brightness: u16,
    pub speed: u16,
    pub direction: u16,
    pub color_mode: u16,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlledLightingWriteResult {
    pub status: ControlledLightingWriteStatus,
    pub message: String,
    pub report_id: u8,
    pub packet_length: usize,
    pub attempted_packet: Vec<u8>,
    pub write_attempt_count: u8,
    pub retry_count: u8,
    pub follow_up_packet_count: u8,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ControlledLightingWriteStatus {
    Success,
    Blocked,
    Failure,
}

pub fn run_controlled_lighting_write(
    request: ControlledLightingWriteRequest,
) -> ControlledLightingWriteResult {
    if let Err(message) = validate_request_metadata(&request) {
        return blocked_result(message);
    }

    if let Err(message) = validate_packet_constant(&WP21_LIGHTING_WRITE_PACKET) {
        return blocked_result(message);
    }

    let api = match HidApi::new() {
        Ok(api) => api,
        Err(error) => return failure_result(format!("HID API initialization failed: {error}"), 0),
    };

    let Some(device_info) = find_selected_device(&api, &request.selected_path) else {
        return blocked_result("Selected path was not found in current HID metadata.".to_owned());
    };

    if let Err(message) = validate_selected_device(device_info, &request) {
        return blocked_result(message);
    }

    let path = match CString::new(request.selected_path) {
        Ok(path) => path,
        Err(_) => return blocked_result("Selected path contains an invalid null byte.".to_owned()),
    };

    let device = match api.open_path(&path) {
        Ok(device) => device,
        Err(error) => {
            return failure_result(format!("Opening selected HID path failed: {error}"), 0)
        }
    };

    let output_report = create_hidapi_output_report();
    match device.write(&output_report) {
        Ok(written) if written == output_report.len() => success_result(),
        Ok(written) => failure_result(
            format!(
                "Controlled lighting write wrote {written} bytes, expected {}.",
                output_report.len()
            ),
            1,
        ),
        Err(error) => failure_result(format!("Controlled lighting write failed: {error}"), 1),
    }
}

pub fn run_functional_lighting_write(
    request: FunctionalLightingWriteRequest,
) -> ControlledLightingWriteResult {
    if let Err(message) = validate_functional_request_metadata(&request) {
        return blocked_result_with_packet(message, WP21_LIGHTING_WRITE_PACKET.to_vec());
    }

    let packet = match build_functional_lighting_packet(&request) {
        Ok(packet) => packet,
        Err(message) => {
            return blocked_result_with_packet(message, WP21_LIGHTING_WRITE_PACKET.to_vec())
        }
    };

    if let Err(message) = validate_global_lighting_packet_family(&packet) {
        return blocked_result_with_packet(message, packet.to_vec());
    }

    let api = match HidApi::new() {
        Ok(api) => api,
        Err(error) => {
            return failure_result_with_packet(
                format!("HID API initialization failed: {error}"),
                0,
                packet.to_vec(),
            )
        }
    };

    let Some(device_info) = find_selected_device(&api, &request.selected_path) else {
        return blocked_result_with_packet(
            "Selected path was not found in current HID metadata.".to_owned(),
            packet.to_vec(),
        );
    };

    if let Err(message) = validate_functional_selected_device(device_info, &request) {
        return blocked_result_with_packet(message, packet.to_vec());
    }

    let path = match CString::new(request.selected_path) {
        Ok(path) => path,
        Err(_) => {
            return blocked_result_with_packet(
                "Selected path contains an invalid null byte.".to_owned(),
                packet.to_vec(),
            )
        }
    };

    let device = match api.open_path(&path) {
        Ok(device) => device,
        Err(error) => {
            return failure_result_with_packet(
                format!("Opening selected HID path failed: {error}"),
                0,
                packet.to_vec(),
            )
        }
    };

    let output_report = create_hidapi_output_report_for_packet(&packet);
    match device.write(&output_report) {
        Ok(written) if written == output_report.len() => success_result_with_packet(
            "WP22 functional lighting write completed once. Physically verify keyboard lighting manually.".to_owned(),
            packet.to_vec(),
        ),
        Ok(written) => failure_result_with_packet(
            format!(
                "Functional lighting write wrote {written} bytes, expected {}.",
                output_report.len()
            ),
            1,
            packet.to_vec(),
        ),
        Err(error) => {
            failure_result_with_packet(format!("Functional lighting write failed: {error}"), 1, packet.to_vec())
        }
    }
}

pub fn create_hidapi_output_report() -> Vec<u8> {
    create_hidapi_output_report_for_packet(&WP21_LIGHTING_WRITE_PACKET)
}

pub fn create_hidapi_output_report_for_packet(
    packet: &[u8; WP21_LIGHTING_WRITE_PACKET_LENGTH],
) -> Vec<u8> {
    let mut output_report = Vec::with_capacity(WP21_LIGHTING_WRITE_PACKET_LENGTH + 1);
    output_report.push(WP21_LIGHTING_WRITE_REPORT_ID);
    output_report.extend_from_slice(packet);
    output_report
}

pub fn validate_request_metadata(request: &ControlledLightingWriteRequest) -> Result<(), String> {
    if !request.manual_confirmation {
        return Err(
            "Manual confirmation is required immediately before the WP21 lighting write."
                .to_owned(),
        );
    }

    if request.selected_path.trim().is_empty() {
        return Err("Exact selected HID path/interface is required.".to_owned());
    }

    if !matches_target_device(request.vendor_id, request.product_id) {
        return Err("Selected metadata does not match AK680 V2 VID 3141/PID 32956.".to_owned());
    }

    validate_usage_metadata(request.usage_page, request.usage)
}

pub fn validate_packet_constant(packet: &[u8]) -> Result<(), String> {
    if WP21_LIGHTING_WRITE_REPORT_ID != 0 {
        return Err("WP21 report ID must remain 0.".to_owned());
    }

    if packet.len() != WP21_LIGHTING_WRITE_PACKET_LENGTH {
        return Err("WP21 lighting packet must remain exactly 64 bytes.".to_owned());
    }

    if packet != WP21_LIGHTING_WRITE_PACKET {
        return Err("WP21 lighting packet bytes do not match the approved constant.".to_owned());
    }

    Ok(())
}

pub fn build_functional_lighting_packet(
    request: &FunctionalLightingWriteRequest,
) -> Result<[u8; WP21_LIGHTING_WRITE_PACKET_LENGTH], String> {
    let mut packet = WP21_LIGHTING_WRITE_PACKET;
    packet[8] = byte_field(request.color_mode, "colorMode")?;
    packet[9] = byte_field(request.red, "red")?;
    packet[10] = byte_field(request.green, "green")?;
    packet[11] = byte_field(request.blue, "blue")?;
    packet[12] = byte_field(request.brightness, "brightness")?;
    packet[17] = byte_field(request.speed, "speed")?;
    packet[18] = byte_field(request.direction, "direction")?;
    validate_global_lighting_packet_family(&packet)?;
    Ok(packet)
}

pub fn validate_global_lighting_packet_family(packet: &[u8]) -> Result<(), String> {
    if WP21_LIGHTING_WRITE_REPORT_ID != 0 {
        return Err("Lighting report ID must remain 0.".to_owned());
    }

    if packet.len() != WP21_LIGHTING_WRITE_PACKET_LENGTH {
        return Err("Lighting packet must remain exactly 64 bytes.".to_owned());
    }

    if packet[0..3] != [0xAA, 0x23, 0x10] {
        return Err("Lighting command prefix must remain AA 23 10.".to_owned());
    }

    if packet[22] != 0xAA || packet[23] != 0x55 {
        return Err(
            "Lighting packet marker bytes must remain AA 55 at indexes 22 and 23.".to_owned(),
        );
    }

    for (index, byte) in packet.iter().enumerate() {
        if !FUNCTIONAL_LIGHTING_VARIABLE_INDEXES.contains(&index)
            && *byte != WP21_LIGHTING_WRITE_PACKET[index]
        {
            return Err(format!(
                "Lighting packet byte index {index} is not allowed to vary in WP22."
            ));
        }
    }

    Ok(())
}

pub fn validate_functional_request_metadata(
    request: &FunctionalLightingWriteRequest,
) -> Result<(), String> {
    if !request.manual_confirmation {
        return Err(
            "Manual confirmation is required immediately before the WP22 lighting write."
                .to_owned(),
        );
    }

    if request.selected_path.trim().is_empty() {
        return Err("Exact selected HID path/interface is required.".to_owned());
    }

    if !matches_target_device(request.vendor_id, request.product_id) {
        return Err("Selected metadata does not match AK680 V2 VID 3141/PID 32956.".to_owned());
    }

    byte_field(request.red, "red")?;
    byte_field(request.green, "green")?;
    byte_field(request.blue, "blue")?;
    byte_field(request.brightness, "brightness")?;
    byte_field(request.speed, "speed")?;
    byte_field(request.direction, "direction")?;
    byte_field(request.color_mode, "colorMode")?;

    validate_usage_metadata(request.usage_page, request.usage)
}

fn find_selected_device<'a>(api: &'a HidApi, selected_path: &str) -> Option<&'a DeviceInfo> {
    api.device_list()
        .find(|device| device.path().to_string_lossy() == selected_path)
}

fn validate_selected_device(
    device: &DeviceInfo,
    request: &ControlledLightingWriteRequest,
) -> Result<(), String> {
    if !matches_target_device(device.vendor_id(), device.product_id()) {
        return Err("Selected HID path is not AK680 V2 VID 3141/PID 32956.".to_owned());
    }

    if device.vendor_id() != request.vendor_id || device.product_id() != request.product_id {
        return Err(
            "Selected HID path metadata does not match the requested interface metadata."
                .to_owned(),
        );
    }

    let usage_page = device.usage_page();
    let usage = device.usage();

    if request.usage_page != Some(usage_page) || request.usage != Some(usage) {
        return Err(
            "Selected HID path usage metadata does not match the requested interface metadata."
                .to_owned(),
        );
    }

    validate_usage_metadata(Some(usage_page), Some(usage))
}

fn validate_functional_selected_device(
    device: &DeviceInfo,
    request: &FunctionalLightingWriteRequest,
) -> Result<(), String> {
    if !matches_target_device(device.vendor_id(), device.product_id()) {
        return Err("Selected HID path is not AK680 V2 VID 3141/PID 32956.".to_owned());
    }

    if device.vendor_id() != request.vendor_id || device.product_id() != request.product_id {
        return Err(
            "Selected HID path metadata does not match the requested interface metadata."
                .to_owned(),
        );
    }

    let usage_page = device.usage_page();
    let usage = device.usage();

    if request.usage_page != Some(usage_page) || request.usage != Some(usage) {
        return Err(
            "Selected HID path usage metadata does not match the requested interface metadata."
                .to_owned(),
        );
    }

    validate_usage_metadata(Some(usage_page), Some(usage))
}

fn byte_field(value: u16, field: &str) -> Result<u8, String> {
    u8::try_from(value).map_err(|_| format!("Lighting field {field} must be in 0..255."))
}

pub fn validate_usage_metadata(usage_page: Option<u16>, usage: Option<u16>) -> Result<(), String> {
    if matches!(usage_page, Some(1)) && matches!(usage, Some(6)) {
        return Err("Keyboard interface usagePage 1/usage 6 is blocked.".to_owned());
    }

    if matches!(usage_page, Some(12)) && matches!(usage, Some(1)) {
        return Err("Consumer-control interface usagePage 12/usage 1 is blocked.".to_owned());
    }

    if usage_page != Some(WP21_LIGHTING_WRITE_USAGE_PAGE) {
        return Err("Selected interface usagePage is not the approved 65384.".to_owned());
    }

    if usage != Some(WP21_LIGHTING_WRITE_USAGE) {
        return Err("Selected interface usage is not the approved 97.".to_owned());
    }

    Ok(())
}

fn success_result() -> ControlledLightingWriteResult {
    success_result_with_packet(
        "WP21 controlled lighting write completed once. Physically verify keyboard lighting manually.".to_owned(),
        WP21_LIGHTING_WRITE_PACKET.to_vec(),
    )
}

fn success_result_with_packet(
    message: String,
    attempted_packet: Vec<u8>,
) -> ControlledLightingWriteResult {
    ControlledLightingWriteResult {
        status: ControlledLightingWriteStatus::Success,
        message,
        report_id: WP21_LIGHTING_WRITE_REPORT_ID,
        packet_length: WP21_LIGHTING_WRITE_PACKET_LENGTH,
        attempted_packet,
        write_attempt_count: 1,
        retry_count: 0,
        follow_up_packet_count: 0,
    }
}

fn blocked_result(message: String) -> ControlledLightingWriteResult {
    blocked_result_with_packet(message, WP21_LIGHTING_WRITE_PACKET.to_vec())
}

fn blocked_result_with_packet(
    message: String,
    attempted_packet: Vec<u8>,
) -> ControlledLightingWriteResult {
    ControlledLightingWriteResult {
        status: ControlledLightingWriteStatus::Blocked,
        message,
        report_id: WP21_LIGHTING_WRITE_REPORT_ID,
        packet_length: WP21_LIGHTING_WRITE_PACKET_LENGTH,
        attempted_packet,
        write_attempt_count: 0,
        retry_count: 0,
        follow_up_packet_count: 0,
    }
}

fn failure_result(message: String, write_attempt_count: u8) -> ControlledLightingWriteResult {
    failure_result_with_packet(
        message,
        write_attempt_count,
        WP21_LIGHTING_WRITE_PACKET.to_vec(),
    )
}

fn failure_result_with_packet(
    message: String,
    write_attempt_count: u8,
    attempted_packet: Vec<u8>,
) -> ControlledLightingWriteResult {
    ControlledLightingWriteResult {
        status: ControlledLightingWriteStatus::Failure,
        message,
        report_id: WP21_LIGHTING_WRITE_REPORT_ID,
        packet_length: WP21_LIGHTING_WRITE_PACKET_LENGTH,
        attempted_packet,
        write_attempt_count,
        retry_count: 0,
        follow_up_packet_count: 0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hid_detection::{TARGET_PRODUCT_ID, TARGET_VENDOR_ID};

    fn valid_request() -> ControlledLightingWriteRequest {
        ControlledLightingWriteRequest {
            selected_path: "hid-path".to_owned(),
            vendor_id: TARGET_VENDOR_ID,
            product_id: TARGET_PRODUCT_ID,
            usage_page: Some(WP21_LIGHTING_WRITE_USAGE_PAGE),
            usage: Some(WP21_LIGHTING_WRITE_USAGE),
            manual_confirmation: true,
        }
    }

    fn valid_functional_request() -> FunctionalLightingWriteRequest {
        FunctionalLightingWriteRequest {
            selected_path: "hid-path".to_owned(),
            vendor_id: TARGET_VENDOR_ID,
            product_id: TARGET_PRODUCT_ID,
            usage_page: Some(WP21_LIGHTING_WRITE_USAGE_PAGE),
            usage: Some(WP21_LIGHTING_WRITE_USAGE),
            manual_confirmation: true,
            red: 12,
            green: 34,
            blue: 56,
            brightness: 7,
            speed: 8,
            direction: 9,
            color_mode: 2,
        }
    }

    #[test]
    fn approved_lighting_packet_bytes_are_exact() {
        assert_eq!(WP21_LIGHTING_WRITE_REPORT_ID, 0);
        assert_eq!(WP21_LIGHTING_WRITE_PACKET.len(), 64);
        assert_eq!(
            WP21_LIGHTING_WRITE_PACKET,
            [
                0xAA, 0x23, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0xFF, 0x00, 0x00, 0xFF, 0x00,
                0x00, 0x00, 0x00, 0x05, 0x03, 0x00, 0x00, 0x00, 0xAA, 0x55, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]
        );
    }

    #[test]
    fn hidapi_output_report_prepends_report_id_zero() {
        let output_report = create_hidapi_output_report();

        assert_eq!(output_report.len(), 65);
        assert_eq!(output_report[0], WP21_LIGHTING_WRITE_REPORT_ID);
        assert_eq!(&output_report[1..], WP21_LIGHTING_WRITE_PACKET);
    }

    #[test]
    fn validates_packet_constant() {
        assert!(validate_packet_constant(&WP21_LIGHTING_WRITE_PACKET).is_ok());
        assert!(validate_packet_constant(&WP21_LIGHTING_WRITE_PACKET[..63]).is_err());

        let mut changed_packet = WP21_LIGHTING_WRITE_PACKET;
        changed_packet[9] = 0x00;
        assert!(validate_packet_constant(&changed_packet).is_err());
    }

    #[test]
    fn validates_target_metadata_and_manual_confirmation() {
        assert!(validate_request_metadata(&valid_request()).is_ok());

        assert!(validate_request_metadata(&ControlledLightingWriteRequest {
            manual_confirmation: false,
            ..valid_request()
        })
        .is_err());
        assert!(validate_request_metadata(&ControlledLightingWriteRequest {
            selected_path: "".to_owned(),
            ..valid_request()
        })
        .is_err());
        assert!(validate_request_metadata(&ControlledLightingWriteRequest {
            vendor_id: 9999,
            ..valid_request()
        })
        .is_err());
        assert!(validate_request_metadata(&ControlledLightingWriteRequest {
            product_id: 9999,
            ..valid_request()
        })
        .is_err());
    }

    #[test]
    fn validates_usage_metadata_and_blocks_wrong_interfaces() {
        assert!(validate_usage_metadata(
            Some(WP21_LIGHTING_WRITE_USAGE_PAGE),
            Some(WP21_LIGHTING_WRITE_USAGE)
        )
        .is_ok());
        assert!(validate_usage_metadata(Some(1), Some(6)).is_err());
        assert!(validate_usage_metadata(Some(12), Some(1)).is_err());
        assert!(validate_usage_metadata(Some(1), Some(WP21_LIGHTING_WRITE_USAGE)).is_err());
        assert!(validate_usage_metadata(Some(WP21_LIGHTING_WRITE_USAGE_PAGE), Some(1)).is_err());
        assert!(validate_usage_metadata(None, Some(WP21_LIGHTING_WRITE_USAGE)).is_err());
        assert!(validate_usage_metadata(Some(WP21_LIGHTING_WRITE_USAGE_PAGE), None).is_err());
    }

    #[test]
    fn result_shapes_remain_one_shot_without_retry_or_follow_up() {
        let success = success_result();
        assert_eq!(success.write_attempt_count, 1);
        assert_eq!(success.retry_count, 0);
        assert_eq!(success.follow_up_packet_count, 0);

        let blocked = blocked_result("blocked".to_owned());
        assert_eq!(blocked.write_attempt_count, 0);
        assert_eq!(blocked.retry_count, 0);
        assert_eq!(blocked.follow_up_packet_count, 0);

        let failure = failure_result("failed".to_owned(), 1);
        assert_eq!(failure.write_attempt_count, 1);
        assert_eq!(failure.retry_count, 0);
        assert_eq!(failure.follow_up_packet_count, 0);
    }

    #[test]
    fn functional_packet_builder_varies_only_approved_indexes() {
        let packet = build_functional_lighting_packet(&valid_functional_request()).unwrap();

        assert_eq!(packet.len(), 64);
        assert_eq!(packet[0..3], [0xAA, 0x23, 0x10]);
        assert_eq!(packet[8], 2);
        assert_eq!(packet[9], 12);
        assert_eq!(packet[10], 34);
        assert_eq!(packet[11], 56);
        assert_eq!(packet[12], 7);
        assert_eq!(packet[17], 8);
        assert_eq!(packet[18], 9);

        for (index, byte) in packet.iter().enumerate() {
            if !FUNCTIONAL_LIGHTING_VARIABLE_INDEXES.contains(&index) {
                assert_eq!(*byte, WP21_LIGHTING_WRITE_PACKET[index], "index {index}");
            }
        }
    }

    #[test]
    fn functional_packet_rejects_out_of_range_values() {
        assert!(
            build_functional_lighting_packet(&FunctionalLightingWriteRequest {
                red: 256,
                ..valid_functional_request()
            })
            .is_err()
        );

        assert!(
            validate_functional_request_metadata(&FunctionalLightingWriteRequest {
                brightness: 999,
                ..valid_functional_request()
            })
            .is_err()
        );
    }

    #[test]
    fn functional_packet_family_blocks_prefix_and_non_allowed_mutations() {
        let mut packet = build_functional_lighting_packet(&valid_functional_request()).unwrap();
        assert!(validate_global_lighting_packet_family(&packet).is_ok());

        packet[0] = 0xAB;
        assert!(validate_global_lighting_packet_family(&packet).is_err());

        let mut packet = build_functional_lighting_packet(&valid_functional_request()).unwrap();
        packet[13] = 1;
        assert!(validate_global_lighting_packet_family(&packet).is_err());
    }

    #[test]
    fn functional_request_gates_match_target_and_usage_requirements() {
        assert!(validate_functional_request_metadata(&valid_functional_request()).is_ok());

        assert!(
            validate_functional_request_metadata(&FunctionalLightingWriteRequest {
                manual_confirmation: false,
                ..valid_functional_request()
            })
            .is_err()
        );
        assert!(
            validate_functional_request_metadata(&FunctionalLightingWriteRequest {
                selected_path: "".to_owned(),
                ..valid_functional_request()
            })
            .is_err()
        );
        assert!(
            validate_functional_request_metadata(&FunctionalLightingWriteRequest {
                vendor_id: 9999,
                ..valid_functional_request()
            })
            .is_err()
        );
        assert!(
            validate_functional_request_metadata(&FunctionalLightingWriteRequest {
                usage_page: Some(1),
                usage: Some(6),
                ..valid_functional_request()
            })
            .is_err()
        );
        assert!(
            validate_functional_request_metadata(&FunctionalLightingWriteRequest {
                usage_page: Some(12),
                usage: Some(1),
                ..valid_functional_request()
            })
            .is_err()
        );
    }
}
