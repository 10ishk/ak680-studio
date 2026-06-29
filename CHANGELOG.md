# Changelog

## Unreleased - Work Package 3

- Added a local profile manager backed by browser `localStorage`.
- Added local save/list/select-active/rename/delete/export behavior for valid AK680 V2 profiles.
- Added source filename and created/imported/updated timestamp display for saved local profiles.
- Added read-only high-level comparison between two saved local profiles.
- Added Diagnostics local profile storage status.
- Added pure helper tests for profile metadata, rename/delete behavior, comparison, missing optional sections, magnetic-axis counting, and empty storage parsing.
- Passed Red Team source/docs QA for Work Package 3. Red Team did not independently run local build/test commands.

Known limitations:

- Local profile persistence depends on Tauri webview browser storage and can be cleared if local app storage is reset.
- Export writes a JSON backup file locally; it does not write to keyboard hardware.
- No hardware writes, HID writes, keyboard configuration reads/writes, apply/sync/save-to-device behavior, editors, cloud sync, or user accounts are included.

## Unreleased - Work Package 2

- Added read-only HID device enumeration through the Rust backend.
- Added AK680 V2 target matching for VID `3141` and PID `32956`.
- Updated the Device screen with a refresh detection action, detected/not-detected/error states, and safe HID metadata display.
- Updated Diagnostics with the last HID detection status, enumerated device count, and error reporting.
- Added Rust tests for target VID/PID matching logic.
- Passed Red Team source/docs QA for Work Package 2. Red Team did not independently run local build/test commands.

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
