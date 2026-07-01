# AK680 Studio

AK680 Studio is an unofficial, open-source native desktop public alpha for inspecting AJAZZ AK680 V2 profile exports, detecting the target keyboard with read-only HID metadata, running one approved controlled device-info read/query, managing local saved profile backups, editing imported profile JSON locally, previewing future write safety plans, and writing AK680 V2 global lighting through the gated WP22 packet family after manual confirmation.

This project is not affiliated with, endorsed by, or maintained by AJAZZ. The official vendor tooling remains the supported configuration path until any native hardware-write behavior is researched, documented, reviewed, and explicitly approved in a future work package.

## Public Alpha Status

AK680 Studio is local-only and has no general keyboard write support. The current hardware-write path is the WP22 functional global lighting pack for AK680 V2 only, manually gated and limited to the approved `AA 23 10` packet family.

- Profile imports are parsed locally.
- Saved profiles and backups stay on this machine.
- Local editor changes affect exported or saved local profile JSON only.
- Dry-run write safety plans are previews only and send no packets.
- Controlled Read Experiment can run exactly one WP12-approved device-info read/query after manual confirmation.
- Hardware smoke-test checklist is optional, manual, and records observations only.
- Read Protocol Evidence Pack organizes future read-only settings evidence as non-executable local records only.
- Read-Only Settings Foundation provides a local snapshot viewer, conservative compare UI, and disabled future write gate.
- First Write Evidence Plan organizes future first setting-write evidence as non-executable local records only.
- First Write Candidate Selection reviews WP17 evidence and records Outcome A with no selected write candidate.
- Official Profile Model parses the AJAZZ AK680 V2 exported profile format locally.
- Lighting Write Candidate Dry-Run Planner previews a local non-executable future lighting-write candidate.
- WP21 Experimental One-Shot Lighting Write can attempt exactly one fixed lighting packet after manual confirmation.
- Functional Lighting Pack writes global AK680 V2 lighting through the approved packet family after manual confirmation.
- Protocol Evidence Guide and Candidate Query Dossier collect evidence only and do not enable command execution.
- HID detection enumerates safe metadata only.
- No general hardware writes are implemented beyond the WP22 functional AK680 V2 global lighting packet family.
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
- First Write Candidate Selection with Outcome A, candidate rejection rationale, threshold checks, and local example export.
- Official Profile Model summaries for device/profile data, key layout, SOCD assignments, active RT keys, lighting, game mode, custom LED slots, macros, and DKS section presence.
- Lighting Write Candidate Dry-Run Planner with AK680 V2 target metadata, report metadata, sanitized 64-byte preview bytes, warnings, disabled execution state, and a future WP21 checklist.
- WP21 Experimental One-Shot Lighting Write with one fixed packet, backend target/interface gates, manual checkbox plus final confirmation, result display, and local sanitized evidence export.
- Functional Lighting Pack with RGB color, brightness, speed, direction, color mode/effect, generated packet preview, backend gates, and local evidence export.
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

WP14 added a manual hardware smoke-test checklist for release-safety validation. The checklist is optional and does not run automatically. It did not add a second command, change the existing WP13 command, or unlock protocol execution.

Smoke-test notes are observations only:

- The WP14 smoke-test path remains tied to the WP13 `AA 10 30` controlled device-info read/query.
- WP13 report ID remains `0`; request length remains `64` bytes.
- WP13 target gates remain AK680 V2 VID `3141`, PID `32956`, exact selected path/interface, and usage page `65384` / usage `97` where metadata is available.
- One confirmed WP13 manual action sends at most one request.
- No retries, polling, scanning, fuzzing, raw command console, arbitrary payload input, or packet editing is implemented for the smoke-test path.
- General writes, apply, sync, save-to-device, setting writes, firmware flashing, and calibration remain unimplemented beyond the separate WP22 functional AK680 V2 global lighting packet family.
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

## First Write Candidate Selection

WP18 reviews WP17 first-write evidence and records one of two non-execution outcomes:

- Outcome A: no candidate selected.
- Outcome B: exactly one candidate selected for future work-package review only.

The current WP18 review chooses Outcome A. The WP17 placeholder evidence does not include exact request bytes, report ID, request length, clear visual-only or single-setting mutation scope, low enough risk, high enough reversibility, complete backup evidence, complete rollback evidence, or complete read-back/physical verification evidence. The keymap candidate is rejected as too risky and not first-write appropriate.

Outcome B would require risk score `1` or `2`, reversibility score `4` or `5`, hardware-risk classification `visual-only-low-risk` or `single-setting-low-risk`, visual-only or single-setting mutation scope, backup evidence, rollback evidence, read-back or physical verification evidence, GPL/source-cleanliness confirmation, exact request bytes, report ID, request length, and a separate future work package with Red Team review.

Candidate selection records are non-executable. Candidate selection does not approve writing, implement write support, enable write support, or bypass the disabled future write gate. Backup, rollback, read-back, and physical verification evidence remain planning data only.

See [WP18_FIRST_WRITE_CANDIDATE_SELECTION.md](WP18_FIRST_WRITE_CANDIDATE_SELECTION.md) and [fixtures/wp18-first-write-candidate-selection.example.json](fixtures/wp18-first-write-candidate-selection.example.json).

## Official Profile Model

WP19 integrates the official AJAZZ AK680 V2 exported profile JSON format as local profile data. The model parses and summarizes:

- `deviceId`
- `profileName`
- `deviceInfo`
- `keyList`
- `gameModeInfo`
- `ledEffect`
- `customLedData`
- `macroDataList`
- `magneticAxisRT`
- `magneticAxisRTConfig`
- `magneticAxisDKS`

SOCD assignments are detected only from imported profile keys where `userKey.page === "SOCD"`. Active RT/actuation keys are detected from non-default `magneticAxisRT` and `magneticAxisRTConfig` entries, then mapped to `keyList.value` where possible. Unmapped indexes stay labeled as unmapped.

The official profile model is local-only. It does not read live keyboard settings, write lighting, write RT/actuation, write SOCD, write keymaps, write macros, apply profiles, sync, save to device, or add any new HID command.

## Lighting Write Candidate Dry-Run Planner

WP20 adds a local-only dry-run planner for a possible future first controlled global/static lighting write candidate. It uses the imported official profile `ledEffect` as source data and displays:

- AK680 V2 target metadata: VID `3141`, PID `32956`, usage page `65384`, usage `97`
- Report metadata: report ID `0`, 64-byte report length
- Source lighting fields from the local profile
- Sanitized, non-executable preview bytes with RGB indexes documented
- Warnings for missing or out-of-range lighting fields
- Disabled execution state
- A future WP21 manual safety checklist

The preview format is `sanitized-global-static-lighting-preview-v1`. It is not an approved vendor command and must not be treated as executable HID protocol. The planner does not touch HID devices, does not add a Tauri write command, does not change WP13/WP16 read-only gates, and does not implement lighting writes, apply/sync/save-to-device behavior, retries, polling, scanning, fuzzing, packet editing, raw command console, arbitrary payload input, or command registry execution.

Future real lighting-write work requires a separate work package and Red Team plan. See [fixtures/wp20-lighting-dry-run.example.json](fixtures/wp20-lighting-dry-run.example.json) for a sanitized example export shape.

## WP21 Experimental One-Shot Lighting Write

WP21 adds the first controlled real hardware-write experiment. It is narrow by design: exactly one fixed static/global lighting packet can be attempted, only for AK680 V2 VID `3141`, PID `32956`, usage page `65384`, usage `97`, report ID `0`, and 64 bytes.

Allowed packet:

```text
AA 23 10 00 00 00 01 00 01 FF 00 00 FF 00 00 00
00 05 03 00 00 00 AA 55 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```

The backend owns the packet constant and independently enforces:

- Non-empty exact selected HID path/interface
- Current HID metadata contains the selected path
- VID/PID exactly `3141 / 32956`
- usagePage/usage exactly `65384 / 97`
- Keyboard interface `usagePage 1 / usage 6` blocked
- Consumer-control interface `usagePage 12 / usage 1` blocked
- Report ID `0`, 64-byte packet length, and exact packet bytes

The UI shows the exact bytes, selected interface, target metadata, and warnings before the attempt. The user must check the WP21 confirmation box and then accept a final confirmation dialog. Canceling, opening the screen, selecting an interface, importing profiles, validation, and export send nothing.

WP21 is not full lighting support, profile write support, apply/sync/save-to-device behavior, RGB editing-to-device, a packet editor, a raw command console, arbitrary payload entry, command registry execution, or rollback support. One user action can attempt at most one HID write; there are no retries, polling, probing, hidden follow-up packets, automatic repeated writes, or automatic rollback packets. Evidence export is local JSON and redacts HID paths and serial numbers.

## Functional Lighting Pack

WP22 turns the proven WP21 path into a practical global lighting feature for AK680 V2 only. It remains scoped to the observed `AA 23 10` global lighting packet family with report ID `0`, 64-byte reports, VID `3141`, PID `32956`, usage page `65384`, and usage `97`.

User-controlled fields are limited to:

- Red
- Green
- Blue
- Brightness
- Speed
- Direction
- Color mode/effect

Only packet byte indexes `8`, `9`, `10`, `11`, `12`, `17`, and `18` can vary. The command prefix, markers, report ID, packet length, target gates, and all other bytes are fixed and validated. The backend rejects wrong VID/PID, wrong usagePage/usage, keyboard interface `usagePage 1 / usage 6`, consumer-control interface `usagePage 12 / usage 1`, empty selected paths, missing selected paths, non-64-byte packets, unsupported command-family changes, and out-of-range lighting values.

The Lighting page shows the generated packet before writing and requires a manual checkbox plus final confirmation popup. One user action attempts at most one write. There is no retry, polling, probing, hidden follow-up packet, automatic rollback, raw command console, arbitrary payload input, packet editor, command registry execution, apply/sync/save-to-device behavior, or unrelated RT/SOCD/keymap/macro/profile/firmware/calibration write.

Evidence export is local JSON and redacts HID paths and serial numbers.

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
- Review/export local WP18 first-write candidate-selection records as non-executable planning data.
- Export a local JSON diagnostics snapshot with timestamp, app version, matching HID metadata, imported profile summary, active local profile summary, protocol assumptions, and safety status.

Protocol assumptions:

- USB/wired mode is likely required for useful HID enumeration.
- Bluetooth configuration is not supported.
- AK680 V2 is treated as proprietary HID, not QMK/VIA.
- Future writes and any additional commands require a separate work package and Red Team plan.
- GPL-3.0 repositories may be studied for behavior only; do not copy code.

The Protocol Research screen does not send unknown HID command packets, write keyboard configuration, or change keyboard settings. The only command-capable path is the approved `AA 10 30` device-info read/query. WP15 evidence validation, WP16 snapshot/viewer/compare/export, WP17 first-write evidence validation/classification/export, WP18 candidate-selection review/export, import shape checks, and export are local data operations and do not touch HID devices.

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

Report unsafe hardware-control behavior, accidental write paths, or security issues promptly. The only expected hardware-write path in the current public alpha is the manually confirmed WP22 functional AK680 V2 global lighting packet family.

## Not Supported Yet

- General hardware writes beyond the WP22 functional AK680 V2 global lighting packet family
- HID write/send commands beyond the WP22 functional AK680 V2 global lighting packet family
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
- General RGB writes beyond the WP22 global lighting packet family
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
