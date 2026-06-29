# Changelog

## Unreleased - Work Package 2

- Added read-only HID device enumeration through the Rust backend.
- Added AK680 V2 target matching for VID `3141` and PID `32956`.
- Updated the Device screen with a refresh detection action, detected/not-detected/error states, and safe HID metadata display.
- Updated Diagnostics with the last HID detection status, enumerated device count, and error reporting.
- Added Rust tests for target VID/PID matching logic.

Known limitations:

- Detection depends on OS HID permissions, driver state, and whether the keyboard is connected in a mode visible to HID enumeration.
- No hardware writes, HID feature report sends, keyboard configuration writes, firmware flashing, calibration, or save/apply/sync-to-device actions are included.

## 0.1.0 - Work Package 1

- Added the open-source project foundation for AK680 Studio.
- Added Tauri v2, React, TypeScript, and Tailwind scaffolding.
- Added read-only screens for Dashboard, Device, Profile Import, Profile Inspector, Keyboard Layout, Lighting, Rapid Trigger, Macros, and Diagnostics.
- Added AJAZZ AK680 V2 profile validation and local-only profile inspection.
- Added `fixtures/ak680-profile.sample.json` as the sample profile fixture.
- Passed Red Team source/docs QA for Work Package 1. Red Team could not run a local build because their environment had a DNS limitation.

Known limitations:

- No live hardware detection.
- No hardware writes of any kind.
- No firmware flashing, calibration, cloud sync, packaging, or release installer.
