use crate::hid_detection::matches_target_device;
use hidapi::{DeviceInfo, HidApi};
use serde::{Deserialize, Serialize};
use std::ffi::CString;

pub const APPROVED_REPORT_ID: u8 = 0;
pub const APPROVED_REQUEST_LENGTH: usize = 64;
pub const APPROVED_USAGE_PAGE: u16 = 65384;
pub const APPROVED_USAGE: u16 = 97;
const READ_TIMEOUT_MS: i32 = 500;

pub const APPROVED_DEVICE_INFO_REQUEST: [u8; APPROVED_REQUEST_LENGTH] = [
    0xAA, 0x10, 0x30, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlledDeviceInfoReadRequest {
    pub selected_path: String,
    pub vendor_id: u16,
    pub product_id: u16,
    pub usage_page: Option<u16>,
    pub usage: Option<u16>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlledDeviceInfoReadResult {
    pub status: ControlledDeviceInfoReadStatus,
    pub message: String,
    pub report_id: u8,
    pub request_length: usize,
    pub response_length: usize,
    pub response_bytes: Vec<u8>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ControlledDeviceInfoReadStatus {
    Success,
    Blocked,
    Timeout,
    Error,
}

pub fn run_controlled_device_info_read(
    request: ControlledDeviceInfoReadRequest,
) -> ControlledDeviceInfoReadResult {
    match validate_request_metadata(&request) {
        Ok(()) => {}
        Err(message) => return blocked_result(message),
    }

    let api = match HidApi::new() {
        Ok(api) => api,
        Err(error) => return error_result(format!("HID API initialization failed: {error}")),
    };

    let Some(device_info) = find_selected_device(&api, &request.selected_path) else {
        return blocked_result("Selected path was not found in current HID metadata.".to_owned());
    };

    if let Err(message) = validate_device_info(device_info) {
        return blocked_result(message);
    }

    let path = match CString::new(request.selected_path) {
        Ok(path) => path,
        Err(_) => return blocked_result("Selected path contains an invalid null byte.".to_owned()),
    };

    let device = match api.open_path(&path) {
        Ok(device) => device,
        Err(error) => return error_result(format!("Opening selected HID path failed: {error}")),
    };

    let output_report = create_hidapi_output_report();
    match device.write(&output_report) {
        Ok(written) if written == output_report.len() => {}
        Ok(written) => {
            return error_result(format!(
                "Controlled read wrote {written} bytes, expected {}.",
                output_report.len()
            ));
        }
        Err(error) => {
            return error_result(format!("Controlled read output report failed: {error}"))
        }
    }

    let mut response = [0_u8; APPROVED_REQUEST_LENGTH];
    match device.read_timeout(&mut response, READ_TIMEOUT_MS) {
        Ok(0) => timeout_result(),
        Ok(length) => success_result(response[..length].to_vec()),
        Err(error) => error_result(format!("Controlled read response failed: {error}")),
    }
}

pub fn create_hidapi_output_report() -> Vec<u8> {
    let mut output_report = Vec::with_capacity(APPROVED_REQUEST_LENGTH + 1);
    output_report.push(APPROVED_REPORT_ID);
    output_report.extend_from_slice(&APPROVED_DEVICE_INFO_REQUEST);
    output_report
}

pub fn validate_request_metadata(request: &ControlledDeviceInfoReadRequest) -> Result<(), String> {
    if request.selected_path.trim().is_empty() {
        return Err("Exact selected HID path/interface is required.".to_owned());
    }

    if !matches_target_device(request.vendor_id, request.product_id) {
        return Err("Selected metadata does not match AK680 V2 VID 3141/PID 32956.".to_owned());
    }

    validate_usage_metadata(request.usage_page, request.usage)
}

fn find_selected_device<'a>(api: &'a HidApi, selected_path: &str) -> Option<&'a DeviceInfo> {
    api.device_list()
        .find(|device| device.path().to_string_lossy() == selected_path)
}

fn validate_device_info(device: &DeviceInfo) -> Result<(), String> {
    if !matches_target_device(device.vendor_id(), device.product_id()) {
        return Err("Selected HID path is not AK680 V2 VID 3141/PID 32956.".to_owned());
    }

    validate_usage_metadata(Some(device.usage_page()), Some(device.usage()))
}

fn validate_usage_metadata(usage_page: Option<u16>, usage: Option<u16>) -> Result<(), String> {
    if matches!(usage_page, Some(1)) && matches!(usage, Some(6)) {
        return Err("Keyboard interface usagePage 1/usage 6 is blocked.".to_owned());
    }

    if matches!(usage_page, Some(12)) && matches!(usage, Some(1)) {
        return Err("Consumer-control interface usagePage 12/usage 1 is blocked.".to_owned());
    }

    if matches!(usage_page, Some(value) if value != APPROVED_USAGE_PAGE) {
        return Err("Selected interface usagePage is not the approved 65384.".to_owned());
    }

    if matches!(usage, Some(value) if value != APPROVED_USAGE) {
        return Err("Selected interface usage is not the approved 97.".to_owned());
    }

    Ok(())
}

fn success_result(response_bytes: Vec<u8>) -> ControlledDeviceInfoReadResult {
    ControlledDeviceInfoReadResult {
        status: ControlledDeviceInfoReadStatus::Success,
        message: "Controlled device-info read completed once.".to_owned(),
        report_id: APPROVED_REPORT_ID,
        request_length: APPROVED_REQUEST_LENGTH,
        response_length: response_bytes.len(),
        response_bytes,
    }
}

fn blocked_result(message: String) -> ControlledDeviceInfoReadResult {
    ControlledDeviceInfoReadResult {
        status: ControlledDeviceInfoReadStatus::Blocked,
        message,
        report_id: APPROVED_REPORT_ID,
        request_length: APPROVED_REQUEST_LENGTH,
        response_length: 0,
        response_bytes: Vec::new(),
    }
}

fn timeout_result() -> ControlledDeviceInfoReadResult {
    ControlledDeviceInfoReadResult {
        status: ControlledDeviceInfoReadStatus::Timeout,
        message: "Controlled device-info read timed out after one attempt.".to_owned(),
        report_id: APPROVED_REPORT_ID,
        request_length: APPROVED_REQUEST_LENGTH,
        response_length: 0,
        response_bytes: Vec::new(),
    }
}

fn error_result(message: String) -> ControlledDeviceInfoReadResult {
    ControlledDeviceInfoReadResult {
        status: ControlledDeviceInfoReadStatus::Error,
        message,
        report_id: APPROVED_REPORT_ID,
        request_length: APPROVED_REQUEST_LENGTH,
        response_length: 0,
        response_bytes: Vec::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hid_detection::{TARGET_PRODUCT_ID, TARGET_VENDOR_ID};

    fn valid_request() -> ControlledDeviceInfoReadRequest {
        ControlledDeviceInfoReadRequest {
            selected_path: "hid-path".to_owned(),
            vendor_id: TARGET_VENDOR_ID,
            product_id: TARGET_PRODUCT_ID,
            usage_page: Some(APPROVED_USAGE_PAGE),
            usage: Some(APPROVED_USAGE),
        }
    }

    #[test]
    fn approved_request_bytes_are_exact() {
        assert_eq!(APPROVED_REPORT_ID, 0);
        assert_eq!(APPROVED_DEVICE_INFO_REQUEST.len(), 64);
        assert_eq!(
            APPROVED_DEVICE_INFO_REQUEST,
            [
                0xAA, 0x10, 0x30, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
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
        assert_eq!(output_report[0], APPROVED_REPORT_ID);
        assert_eq!(&output_report[1..], APPROVED_DEVICE_INFO_REQUEST);
    }

    #[test]
    fn validates_target_metadata() {
        assert!(validate_request_metadata(&valid_request()).is_ok());

        assert!(validate_request_metadata(&ControlledDeviceInfoReadRequest {
            vendor_id: 9999,
            ..valid_request()
        })
        .is_err());
        assert!(validate_request_metadata(&ControlledDeviceInfoReadRequest {
            product_id: 9999,
            ..valid_request()
        })
        .is_err());
        assert!(validate_request_metadata(&ControlledDeviceInfoReadRequest {
            selected_path: "".to_owned(),
            ..valid_request()
        })
        .is_err());
    }

    #[test]
    fn validates_usage_metadata() {
        assert!(validate_usage_metadata(Some(APPROVED_USAGE_PAGE), Some(APPROVED_USAGE)).is_ok());
        assert!(validate_usage_metadata(Some(1), Some(6)).is_err());
        assert!(validate_usage_metadata(Some(12), Some(1)).is_err());
        assert!(validate_usage_metadata(Some(1), Some(APPROVED_USAGE)).is_err());
        assert!(validate_usage_metadata(Some(APPROVED_USAGE_PAGE), Some(1)).is_err());
    }
}
