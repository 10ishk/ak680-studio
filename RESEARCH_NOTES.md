# Research Notes

## Target Device

- Model: AJAZZ AK680 V2
- Device ID: `3141:32956:AJAZZ AK680 V2`
- VID: `3141`
- PID: `32956`

## Known Profile Sections

Observed exported profile data may include:

- `deviceInfo`
- `keyList`
- `gameModeInfo`
- `ledEffect`
- `customLedData`
- `macroDataList`
- `magneticAxisRT`
- `magneticAxisRTConfig`
- `profileName`

The supplied sample export wraps most profile data in a top-level `profile` object and includes a top-level `deviceId`.

## Reference Material

`SAPNXTDOOR/AJAZZ-HUB` may be useful as public research context only. AK680 Studio is not copying that architecture and is intentionally using a native Tauri/Rust direction.

## Unknowns

- HID enumeration is implemented through the Rust `hidapi` crate and uses device list metadata only.
- OS permissions, driver state, USB mode, and whether the keyboard is connected in wired mode may affect detection.
- WP2 treats vendor ID `3141` and product ID `32956` as the target match for AJAZZ AK680 V2 detection.
- Safe displayed metadata is limited to VID, PID, manufacturer string, product string, serial number if available, path if available, and match status.
- Native HID command framing for safe hardware writes is unknown.
- Verification behavior after a hardware write is unknown.
- Backup and restore semantics for device state are unknown.
- Firmware flashing and calibration protocols are unknown and out of scope.

## Future Research Tasks

- Document the read protocol before any hardware interaction is attempted.
- Identify a safe backup format before any write feature is proposed.
- Design a Red Team plan for the smallest possible future hardware write.
- Require maintainer approval before adding hardware write code.

Work Package 1 performs local JSON inspection only. Work Package 2 adds read-only HID enumeration only. Hardware writes remain out of scope.
