mod hid_detection;

#[tauri::command]
fn list_hid_devices() -> Result<hid_detection::HidDetectionResult, String> {
    hid_detection::enumerate_hid_devices()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![list_hid_devices])
        .run(tauri::generate_context!())
        .expect("error while running AK680 Studio");
}
