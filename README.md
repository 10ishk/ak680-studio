# AK680 Studio

AK680 Studio is an unofficial, open-source native desktop public alpha for inspecting AJAZZ AK680 V2 profile exports, detecting the target keyboard with read-only HID metadata, running one approved controlled device-info read/query, managing local saved profile backups, editing imported profile JSON locally, and previewing future write safety plans without writing to the keyboard.

This project is not affiliated with, endorsed by, or maintained by AJAZZ. The official vendor tooling remains the supported configuration path until any native hardware-write behavior is researched, documented, reviewed, and explicitly approved in a future work package.

## Public Alpha Status

AK680 Studio is local-only and does not write to keyboard hardware.

- Profile imports are parsed locally.
- Saved profiles and backups stay on this machine.
- Local editor changes affect exported or saved local profile JSON only.
- Dry-run write safety plans are previews only and send no packets.
- Controlled Read Experiment can run exactly one WP12-approved device-info read/query after manual confirmation.
- Hardware smoke-test checklist is optional, manual, and records observations only.
- Read Protocol Evidence Pack organizes future read-only settings evidence as non-executable local records only.
- Read-Only Settings Foundation provides a local snapshot viewer, conservative compare UI, and disabled future write gate.
- First Write Evidence Plan organizes future first setting-write evidence as non-executable local records only.
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
- Controlled Read Experiment under Protocol Research with manual gating, target path/interface selection, the single approved `AA 10 30` request, response display, and local status export.
- Hardware Smoke Test checklist and local observation template export for release-safety validation.
- Read Protocol Evidence Pack export with validation, completeness scoring, and non-executable candidate classifications.
- Read-Only Settings Foundation with the existing WP13 read as the only approved command, local snapshot export, conservative compare categories, and disabled future write gate.
- First Write Evidence Plan with risk/reversibility scoring, backup/rollback/read-back evidence requirements, disabled write-readiness checklist, and local example export.
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

The Protocol Research screen includes one controlled device-info read/query reviewed by the WP12 evidence process and implemented in WP13.

Approved command only:

```text
AA 10 30 00 00 00 01 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```

Execution constraints:

- AK680 V2 detection by VID `3141` and PID `32956`
- Exact selected matching HID path/interface
- Usage page `65384` and usage `97` where metadata is available
- Report ID `0`
- Request length `64` bytes
- Explicit user confirmation immediately before execution
- One manual action sends one request
- No retries
- One known read/query only, never a command list
- No automatic execution on app launch or screen open
- No fuzzing, brute forcing, command scanning, background polling, or continuous monitoring
- Local JSON export of the result/status

Responses are shown as status, response length, hex bytes, minimal prefix parse, and observed VID/PID-like bytes only when present. AK680 Studio does not infer firmware version, settings state, calibration state, layout state, memory state, or profile state from the response.

This is not write support. It does not change keyboard settings, apply profiles, sync profiles, save to device, flash firmware, calibrate hardware, or upload data remotely. No other official-driver connect commands are implemented.

## Hardware Smoke Test / Release Safety

WP14 adds a manual hardware smoke-test checklist for release-safety validation. The checklist is optional and does not run automatically. It does not add a second command, change the existing WP13 command, or unlock protocol execution.

Smoke-test notes are observations only:

- The only command-capable path remains the WP13 `AA 10 30` controlled device-info read/query.
- Report ID remains `0`; request length remains `64` bytes.
- Target gates remain AK680 V2 VID `3141`, PID `32956`, exact selected path/interface, and usage page `65384` / usage `97` where metadata is available.
- One confirmed manual action sends at most one request.
- No retries, polling, scanning, fuzzing, raw command console, arbitrary payload input, or packet editing is implemented.
- No writes, apply, sync, save-to-device, setting writes, firmware flashing, or calibration is implemented.
- A physical response must not be treated as proof of firmware version, settings state, calibration state, layout state, memory state, profile state, or write capability.

The Protocol Research screen can export a local smoke-test template JSON so a tester can record status, response length, response hex prefix, observed VID/PID-like bytes when present, and plain notes without changing the keyboard.

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

Ready for Red Team review does not mean ready to run. Dossier evidence does not enable additional command execution; any future query beyond the WP13-approved `AA 10 30` read still requires a separate work package and Red Team plan. The local example dossier export contains placeholders only, no guessed packet bytes, and no GPL-derived implementation material.

## Read Protocol Evidence Pack

WP15 adds local evidence and dossier models for possible future read-only settings support. This is evidence-only; it does not implement settings reads and does not approve any new HID command.

Evidence packs may organize observations for future areas such as device-info follow-up, lighting state, keymap/profile state, rapid trigger/actuation state, SOCD/game-mode state, or another clearly observed read-only candidate area. Records are local JSON data and include source type, source date/time, target device identity, OS/environment, report direction, report ID, request/response lengths, observed bytes when available, timing context, read/write uncertainty, reproducibility notes, safety notes, GPL/source-cleanliness notes, fixture references, and reviewer notes.

Candidate read dossiers use only these non-execution statuses:

- `insufficient`
- `candidate-only`
- `ready-for-future-Red-Team-review`

Completeness scoring and ready-for-future-Red-Team-review status do not enable execution, approve a command, or imply settings-read support. Future execution requires a separate work package and Red Team plan.

See [WP15_READ_PROTOCOL_EVIDENCE_GUIDE.md](WP15_READ_PROTOCOL_EVIDENCE_GUIDE.md) and [fixtures/wp15-read-protocol-evidence.example.json](fixtures/wp15-read-protocol-evidence.example.json).

## Read-Only Settings Foundation

WP16 adds the local foundation for future settings work while keeping hardware interaction read-only. The approved command pack contains exactly one command: the existing WP13 `AA 10 30` controlled device-info read/query. WP15 evidence did not qualify any additional read commands for WP16.

The snapshot viewer and compare UI are local/read-only:

- Snapshot export is local JSON only and does not trigger additional reads.
- Known parsed fields, unknown fields, raw bytes, parser warnings, and confidence are separated.
- Snapshot data may be incomplete.
- Unsupported profile areas are labeled unsupported by the current read-only command pack.
- Compare results cannot be applied, synced, saved to device, or written back.

The future write gate remains disabled and requires a separate work package and Red Team plan. See [WP16_READ_ONLY_SETTINGS_FOUNDATION.md](WP16_READ_ONLY_SETTINGS_FOUNDATION.md).

## First Write Evidence Plan

WP17 adds a local evidence pack for a possible future first controlled setting write. It is evidence-only and does not implement, approve, enable, or execute any write command.

Candidate write dossiers use only these non-execution statuses:

- `insufficient-evidence`
- `rejected-too-risky`
- `candidate-only`
- `ready-for-future-Red-Team-review`

Risk scoring is conservative: `1` means very low observed risk and `5` means unacceptable or unknown risk. Reversibility scoring is also conservative: `1` means unknown or undocumented recovery and `5` means documented, repeatable, and verifiable rollback. Missing backup, rollback, read-back, physical verification, GPL/source-cleanliness, or exact evidence keeps a candidate non-executable.

The disabled write-readiness checklist is planning guidance only. Backup evidence, rollback evidence, read-back evidence, physical verification evidence, candidate completeness, and `ready-for-future-Red-Team-review` status do not unlock write support. Future execution requires a separate work package and Red Team plan.

See [WP17_FIRST_WRITE_EVIDENCE_PLAN.md](WP17_FIRST_WRITE_EVIDENCE_PLAN.md) and [fixtures/wp17-first-write-evidence.example.json](fixtures/wp17-first-write-evidence.example.json).

## Protocol Research

The Protocol Research screen is a read-only, experimental toolkit for future AK680 V2 protocol work.

It can:

- Show all detected AK680 V2 HID interfaces matching VID `3141` and PID `32956`.
- Display safe HID metadata: VID, PID, path, manufacturer, product, serial if available, usage page, usage, interface number, and release number.
- Cautiously mark a likely research interface only when exactly one matching interface is available from read-only metadata.
- Run the single WP13-approved controlled device-info read/query only after explicit user confirmation and target-interface gates.
- Show a manual hardware smoke-test checklist and export a local observation template.
- Review and export local WP15 read-protocol evidence packs as non-executable data.
- View/export local WP16 read-only snapshots and conservative snapshot/profile comparisons.
- Review/export local WP17 first-write evidence packs as non-executable planning data.
- Export a local JSON diagnostics snapshot with timestamp, app version, matching HID metadata, imported profile summary, active local profile summary, protocol assumptions, and safety status.

Protocol assumptions:

- USB/wired mode is likely required for useful HID enumeration.
- Bluetooth configuration is not supported.
- AK680 V2 is treated as proprietary HID, not QMK/VIA.
- Future writes and any additional commands require a separate work package and Red Team plan.
- GPL-3.0 repositories may be studied for behavior only; do not copy code.

The Protocol Research screen does not send unknown HID command packets, write keyboard configuration, or change keyboard settings. The only command-capable path is the approved `AA 10 30` device-info read/query. WP15 evidence validation, WP16 snapshot/viewer/compare/export, WP17 first-write evidence validation/classification/export, import shape checks, and export are local data operations and do not touch HID devices.

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
