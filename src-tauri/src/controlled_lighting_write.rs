use crate::hid_detection::matches_target_device;
use hidapi::{DeviceInfo, HidApi};
use serde::{Deserialize, Serialize};
use std::ffi::CString;

pub const WP21_LIGHTING_WRITE_REPORT_ID: u8 = 0;
pub const WP21_LIGHTING_WRITE_PACKET_LENGTH: usize = 64;
pub const WP21_LIGHTING_WRITE_USAGE_PAGE: u16 = 65384;
pub const WP21_LIGHTING_WRITE_USAGE: u16 = 97;

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

pub fn create_hidapi_output_report() -> Vec<u8> {
    let mut output_report = Vec::with_capacity(WP21_LIGHTING_WRITE_PACKET_LENGTH + 1);
    output_report.push(WP21_LIGHTING_WRITE_REPORT_ID);
    output_report.extend_from_slice(&WP21_LIGHTING_WRITE_PACKET);
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
    ControlledLightingWriteResult {
        status: ControlledLightingWriteStatus::Success,
        message: "WP21 controlled lighting write completed once. Physically verify keyboard lighting manually."
            .to_owned(),
        report_id: WP21_LIGHTING_WRITE_REPORT_ID,
        packet_length: WP21_LIGHTING_WRITE_PACKET_LENGTH,
        attempted_packet: WP21_LIGHTING_WRITE_PACKET.to_vec(),
        write_attempt_count: 1,
        retry_count: 0,
        follow_up_packet_count: 0,
    }
}

fn blocked_result(message: String) -> ControlledLightingWriteResult {
    ControlledLightingWriteResult {
        status: ControlledLightingWriteStatus::Blocked,
        message,
        report_id: WP21_LIGHTING_WRITE_REPORT_ID,
        packet_length: WP21_LIGHTING_WRITE_PACKET_LENGTH,
        attempted_packet: WP21_LIGHTING_WRITE_PACKET.to_vec(),
        write_attempt_count: 0,
        retry_count: 0,
        follow_up_packet_count: 0,
    }
}

fn failure_result(message: String, write_attempt_count: u8) -> ControlledLightingWriteResult {
    ControlledLightingWriteResult {
        status: ControlledLightingWriteStatus::Failure,
        message,
        report_id: WP21_LIGHTING_WRITE_REPORT_ID,
        packet_length: WP21_LIGHTING_WRITE_PACKET_LENGTH,
        attempted_packet: WP21_LIGHTING_WRITE_PACKET.to_vec(),
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
}
