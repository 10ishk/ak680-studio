# AK680 Studio

AK680 Studio is an unofficial, open-source native desktop public alpha for inspecting AJAZZ AK680 V2 profile exports, detecting the target keyboard with read-only HID metadata, managing local saved profile backups, editing imported profile JSON locally, and previewing future write safety plans without touching the keyboard.

This project is not affiliated with, endorsed by, or maintained by AJAZZ. The official vendor tooling remains the supported configuration path until any native hardware-write behavior is researched, documented, reviewed, and explicitly approved in a future work package.

## Public Alpha Status

AK680 Studio is local-only and read-only with respect to keyboard hardware.

- Profile imports are parsed locally.
- Saved profiles and backups stay on this machine.
- Local editor changes affect exported or saved local profile JSON only.
- Dry-run write safety plans are previews only and send no packets.
- Controlled Read Experiment remains disabled because an exact safe device-info query is not justified yet.
- Protocol Evidence Guide and Candidate Query Dossier collect evidence only and do not enable command execution.
- HID detection enumerates safe metadata only.
- No hardware writes are implemented.
- No apply, sync, save-to-device, firmware flashing, calibration, cloud sync, user account, remote upload, or database feature is included.
- This is not a complete keyboard control suite yet.

## Current Features

- Tauri v2 native desktop shell.
- React, TypeScript, and Tailwind UI.
- AK680 V2 profile JSON import and validation.
- Read-only profile inspector.
- Keyboard layout view rendered from `keyList`.
- Read-only lighting, rapid trigger, SOCD, and macro summaries.
- Read-only Rust HID enumeration with target matching for VID `3141` and PID `32956`.
- Local saved profile manager backed by browser `localStorage`.
- Active local profile selection, rename, delete with confirmation, and individual JSON export.
- Full local profile library backup export/import with schema validation.
- Merge and confirmed replace restore modes.
- Duplicate profile ID handling and corrupt/incompatible storage recovery.
- Local Editor for cloned imported or saved profile data, including safe local-only keymap assignment names, RT/actuation values, SOCD/game-mode fields, and lighting fields.
- Edited-vs-original summaries, validation, edited JSON export, save-as-new local profile, confirmed update of existing saved local profiles, and discard/reset edits.
- Exact macro data preservation when using the Local Editor.
- Write Safety / Dry-Run Planner for abstract original-vs-edited operation summaries.
- Device compatibility and safety checklist with backup-before-write future gate.
- Local dry-run plan export as JSON.
- Controlled Read Experiment harness under Protocol Research with manual gating, target path/interface selection, WP10 disabled execution state, missing-evidence reporting, and local status export.
- Protocol Evidence Guide and Candidate Query Dossier template with local example dossier JSON export.
- Protocol Research screen for safe HID metadata inspection and local diagnostics snapshot export.
- Diagnostics and About screens with public-alpha safety status.

## Local Editor

The Local Editor is for profile JSON data only. It starts from a valid imported profile or a saved local profile, deep-clones the source, and keeps the original unchanged until you explicitly export edited JSON, save a new local profile, or confirm an update to an existing saved local profile.

The editor supports local-only changes for:

- Profile display/name data
- Key assignment names inside `keyList`
- First editable `magneticAxisRT` RT/actuation record where present
- Selected `gameModeInfo` SOCD/game-mode fields where present
- Selected `ledEffect` lighting fields where present

Missing optional sections are preserved gracefully. `macroDataList` is not edited and must remain exactly preserved for validation to pass.

The Local Editor does not apply profiles to the keyboard, sync profiles to the keyboard, save anything to device memory, send HID packets, or read/write keyboard configuration through command packets.

## Write Safety / Dry-Run Planner

The Write Safety screen is a dry-run planner for future hardware-write work. It uses the active WP7 Local Editor session as input, compares the original/source profile to the edited local profile, and shows abstract operation summaries by category:

- Keymap changes
- RT/actuation changes
- SOCD/game-mode changes
- Lighting changes
- Macro preservation status

The planner includes a compatibility and safety checklist for AK680 V2 VID/PID detection, likely HID interface inference when safely available from read-only metadata, profile identity, edited profile validation, backup-before-write requirements, hardware write support status, and explicit no-packets-sent status.

Dry-run export creates a local JSON planning file with timestamp, profile summaries, validation status, abstract operations, checklist, protocol assumptions, and a no-packets-sent statement.

The planner does not generate real HID packets, command frames, report payloads, endpoint instructions, or executable hardware commands. Backup status is a future safety gate only; it does not unlock writing in WP8. Apply/write/sync/save-to-device execution is absent or disabled and marked not implemented.

## Controlled Read Experiment

The Protocol Research screen includes a Controlled Read Experiment harness for future manual opt-in HID read/query research.

Current WP10 outcome: Outcome B, still disabled. Current project research notes do not document the exact HID report type, report ID, request bytes or command framing, expected response length/format, or evidence proving a device-info query is read/query-only and not a keyboard setting write.

AK680 Studio therefore does not implement a Rust controlled-read command, does not expose a Tauri controlled-read invoke, does not send any HID report, and does not fabricate response bytes. The UI, Diagnostics, and exported status JSON report this disabled state honestly. WP11 adds a Protocol Evidence Guide and Candidate Query Dossier workflow to organize future evidence without enabling execution.

The harness still models the required future safety gates:

- AK680 V2 detection by VID `3141` and PID `32956`
- Exact selected matching HID path/interface
- Explicit user confirmation before any future implemented attempt
- One known read/query only, never a command list
- No automatic execution on app launch or screen open
- No fuzzing, brute forcing, command scanning, background polling, or continuous monitoring
- Local JSON export of the disabled/status result
- Missing-evidence reporting for the disabled device-info query gate

This is not write support. It does not change keyboard settings, apply profiles, sync profiles, save to device, flash firmware, calibrate hardware, or upload data remotely.

## Protocol Evidence Guide

The Protocol Evidence Guide under Protocol Research lists the evidence required before a future device-info read query can even be proposed:

- Exact report type
- Report ID if applicable
- Request bytes or command framing
- Expected response length and shape
- Target interface/path constraints
- Read-only justification
- Non-write rationale
- Evidence source
- GPL cleanliness statement

The Candidate Query Dossier template includes candidate name, evidence source type, report type, report ID, request bytes/framing, expected response, target interface/path notes, read-only justification, non-write rationale, risk assessment, GPL/source cleanliness notes, reviewer notes, and status. Allowed statuses are only `draft`, `needs evidence`, `rejected`, and `ready for Red Team review`.

Ready for Red Team review does not mean ready to run. Dossier evidence does not enable command execution in WP11; any future query implementation still requires a separate work package and Red Team plan. The local example dossier export contains placeholders only, no guessed packet bytes, and no GPL-derived implementation material.

## Protocol Research

The Protocol Research screen is a read-only, experimental toolkit for future AK680 V2 protocol work.

It can:

- Show all detected AK680 V2 HID interfaces matching VID `3141` and PID `32956`.
- Display safe HID metadata: VID, PID, path, manufacturer, product, serial if available, usage page, usage, interface number, and release number.
- Cautiously mark a likely research interface only when exactly one matching interface is available from read-only metadata.
- Export a local JSON diagnostics snapshot with timestamp, app version, matching HID metadata, imported profile summary, active local profile summary, protocol assumptions, and safety status.

Protocol assumptions:

- USB/wired mode is likely required for useful HID enumeration.
- Bluetooth configuration is not supported.
- AK680 V2 is treated as proprietary HID, not QMK/VIA.
- Future writes require a separate work package and Red Team plan.
- GPL-3.0 repositories may be studied for behavior only; do not copy code.

The Protocol Research screen does not send unknown HID command packets, read keyboard configuration through command packets, write keyboard configuration, or change keyboard settings.

## Screenshots

Screenshots are not committed yet. Before adding screenshots:

1. Run `npm run tauri dev`.
2. Capture Dashboard, Device, Profiles, Diagnostics, and About screens.
3. Save images under `docs/screenshots/`.
4. Update this section with relative Markdown image links.

Do not include private profile data, serial numbers, or local file paths in screenshots.

## Tech Stack

- Tauri v2
- Rust backend with read-only HID enumeration
- React
- TypeScript
- Tailwind CSS
- Local-only browser state, localStorage profile persistence, and local profile editing
- Local-only dry-run planning and export

## Setup

Install prerequisites:

- Node.js and npm
- Rust and Cargo
- Tauri system dependencies for your operating system

Install project dependencies:

```bash
npm install
```

Run the native desktop app locally:

```bash
npm run tauri dev
```

## Checks

Frontend:

```bash
npm run lint
npm run build
npm test -- --run
npm audit --audit-level=moderate
```

Rust:

```bash
cd src-tauri
cargo fmt --check
cargo check
cargo test
```

Native build validation:

```bash
npm run tauri build
```

GitHub Actions CI is not committed yet because the current GitHub authentication available to Codex cannot push workflow files without the `workflow` OAuth scope. Until CI is added by a maintainer with that scope, run the checks above locally. Future CI should remain check-only and must not publish release binaries or upload installer artifacts.

## Reporting Issues

Use the GitHub issue templates:

- Bug report
- Feature request
- Device detection report

For device detection reports, share only metadata you are comfortable posting publicly. Serial numbers and HID paths may be sensitive.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, checks, pull request expectations, and safe hardware/protocol contribution guidance.

Hardware-write or protocol work requires documented research, explicit maintainer approval, and Red Team safety review before implementation.

## Security and Hardware Safety

See [SECURITY.md](SECURITY.md) for responsible disclosure and hardware-safety reporting guidance.

Report unsafe hardware-control behavior, accidental write paths, or security issues promptly. The current public alpha is not expected to write to keyboard hardware.

## Not Supported Yet

- Hardware writes
- HID write/send commands
- Unknown HID command packets
- Fuzzing, brute forcing, command scanning, background polling, or continuous monitoring
- Keyboard configuration reads/writes
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Device-side key remapping editor/write path
- Device-side RGB editor/write path
- Device-side rapid trigger editor/write path
- Device-side SOCD editor/write path
- Macro editor
- Keymap writes
- RGB writes
- Rapid trigger writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration
- Cloud login, sync, upload, or database features
- User accounts
- Installer/release packaging
- Release binary publishing
- Electron or embedded AJAZZ website wrappers

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).

Earlier versions of this project may have been distributed under MIT. Starting from this WP5 license update, current and future versions are licensed under Apache-2.0.

GPL-3.0 research repositories must not be copied into AK680 Studio. GPL-3.0 repositories may be used only for behavioral or protocol research unless the whole project is explicitly relicensed later.
