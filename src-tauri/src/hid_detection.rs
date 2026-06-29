use hidapi::HidApi;
use serde::Serialize;

pub const TARGET_VENDOR_ID: u16 = 3141;
pub const TARGET_PRODUCT_ID: u16 = 32956;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HidDeviceMetadata {
    pub vendor_id: u16,
    pub product_id: u16,
    pub manufacturer: Option<String>,
    pub product: Option<String>,
    pub serial_number: Option<String>,
    pub path: Option<String>,
    pub usage_page: Option<u16>,
    pub usage: Option<u16>,
    pub interface_number: Option<i32>,
    pub release_number: Option<u16>,
    pub matched_target: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HidDetectionResult {
    pub devices: Vec<HidDeviceMetadata>,
    pub target_detected: bool,
    pub target_vendor_id: u16,
    pub target_product_id: u16,
}

pub fn matches_target_device(vendor_id: u16, product_id: u16) -> bool {
    vendor_id == TARGET_VENDOR_ID && product_id == TARGET_PRODUCT_ID
}

pub fn enumerate_hid_devices() -> Result<HidDetectionResult, String> {
    let api = HidApi::new().map_err(|error| format!("HID enumeration failed: {error}"))?;
    let devices: Vec<HidDeviceMetadata> = api
        .device_list()
        .map(|device| {
            let vendor_id = device.vendor_id();
            let product_id = device.product_id();

            HidDeviceMetadata {
                vendor_id,
                product_id,
                manufacturer: device.manufacturer_string().map(ToOwned::to_owned),
                product: device.product_string().map(ToOwned::to_owned),
                serial_number: device.serial_number().map(ToOwned::to_owned),
                path: Some(device.path().to_string_lossy().into_owned()),
                usage_page: Some(device.usage_page()),
                usage: Some(device.usage()),
                interface_number: Some(device.interface_number()),
                release_number: Some(device.release_number()),
                matched_target: matches_target_device(vendor_id, product_id),
            }
        })
        .collect();

    let target_detected = devices.iter().any(|device| device.matched_target);

    Ok(HidDetectionResult {
        devices,
        target_detected,
        target_vendor_id: TARGET_VENDOR_ID,
        target_product_id: TARGET_PRODUCT_ID,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn target_vid_and_pid_match() {
        assert!(matches_target_device(3141, 32956));
    }

    #[test]
    fn wrong_vid_does_not_match() {
        assert!(!matches_target_device(9999, 32956));
    }

    #[test]
    fn wrong_pid_does_not_match() {
        assert!(!matches_target_device(3141, 9999));
    }

    #[test]
    fn wrong_vid_and_pid_do_not_match() {
        assert!(!matches_target_device(9999, 9999));
    }

    #[test]
    #[ignore]
    fn print_current_hid_detection_for_manual_verification() {
        match enumerate_hid_devices() {
            Ok(result) => {
                println!("target_detected={}", result.target_detected);
                println!("enumerated_devices={}", result.devices.len());
            }
            Err(error) => {
                println!("hid_enumeration_error={error}");
            }
        }
    }
}
