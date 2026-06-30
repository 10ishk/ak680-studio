# PROJECT_PLAYBOOK.md

# AK680 Studio — Project Playbook

## 1. Project Identity

**Project name:** AK680 Studio  
**Repository name:** `ak680-studio`  
**Project type:** Open-source native desktop app  
**Target device:** AJAZZ AK680 V2  
**License:** Apache-2.0
**Status:** Work Package 13 single controlled device-info read/query

AK680 Studio is an unofficial, open-source, lightweight native desktop app for inspecting and eventually configuring the AJAZZ AK680 V2 keyboard.

This project is not affiliated with, endorsed by, or maintained by AJAZZ. The official web driver remains the vendor-provided configuration path until native write support is researched and tested safely.

---

## 2. Product Goal

Build a modern native desktop control center for the AJAZZ AK680 V2 that can eventually replace the browser-based driver experience.

The long-term app should support:

- Device detection
- Profile import/export
- Keyboard layout visualization
- Keymap editing
- Lighting/RGB controls
- Rapid trigger and magnetic-axis settings
- SOCD inspection/editing
- Macro inspection/editing
- Local backups before device writes
- Safe, documented hardware operations

Work Packages 1, 2, 3, 4, 5, and 6 are intentionally read-only and do not configure the physical keyboard. Work Package 7 adds local profile JSON editing only and still does not configure the physical keyboard. Work Package 8 adds dry-run write safety planning only and cannot execute hardware writes or generate real HID packets. Work Package 9 adds a controlled read experiment harness only. Work Package 10 keeps the device-info read/query disabled under Outcome B because exact safe-query evidence is missing. Work Package 11 adds protocol evidence guide and dossier tooling only. Work Package 13 implements exactly one WP12-approved controlled device-info read/query and remains not a write package.

---

## 3. Open-Source Principles

This project should be built as a serious open-source project, not only as a portfolio demo.

Codex must maintain:

- Clear README documentation
- Clear setup instructions
- Safety warnings around hardware control
- A project roadmap
- A changelog
- Research notes
- Conventional commit messages
- Clean repository structure
- No secrets committed
- No copied proprietary vendor code or assets
- No dependency on private/local machine paths

Recommended open-source files:

- `README.md`
- `PROJECT_PLAYBOOK.md`
- `RESEARCH_NOTES.md`
- `CHANGELOG.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `RED_TEAM_WP1_TEST_PLAN.md`

Optional later:

- Additional GitHub Actions jobs beyond check-only CI
- Screenshot assets under `docs/screenshots/`

---

## 4. Technical Direction

The app must be a true native desktop app.

Use:

- Tauri v2
- Rust backend
- React + TypeScript frontend
- Tailwind CSS
- shadcn/ui if practical and not overcomplicated
- Local-only state in Work Package 1
- JSON fixtures for profile testing

Do not use:

- Electron
- Embedded AJAZZ website
- WebHID wrapper architecture
- Cloud/database services in Work Package 1

The existing `SAPNXTDOOR/AJAZZ-HUB` repository is a reference only. It should not be copied as the app architecture because this project is pursuing a native Tauri/Rust direction.

GPL-3.0 research repositories must not be copied into AK680 Studio. They may be used only for behavioral or protocol research unless the whole project is explicitly relicensed later.

---

## 5. Known Target Device Details

Target keyboard:

- Model: `AJAZZ AK680 V2`
- Device ID: `3141:32956:AJAZZ AK680 V2`
- VID: `3141`
- PID: `32956`

Known exported profile sections:

- `deviceInfo`
- `keyList`
- `gameModeInfo`
- `ledEffect`
- `customLedData`
- `macroDataList`
- `magneticAxisRT`
- `magneticAxisRTConfig`
- `profileName`

Known example profile name:

- `Valorant (1)`

Work Package 1 should use this exported profile shape for read-only import, validation, and visualization.

---

## 6. Safety Rules

Hardware safety is mandatory.

For Work Package 1, Codex must not implement:

- Hardware write commands
- HID write/send commands
- Save-to-device actions
- Apply-to-device actions
- Key remapping writes
- RGB writes
- Rapid trigger writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration
- Background device sync

The UI must clearly state that Work Package 1 is read-only.

For Work Package 2, Codex may implement HID enumeration only. WP2 must not implement hardware writes, HID write/send commands, feature report sends, keyboard configuration read/write commands, save-to-device actions, apply-to-device actions, sync-to-device actions, firmware flashing, calibration, or background device sync.

The UI must clearly state that Work Package 2 detection is read-only.

For Work Package 3, Codex may implement local profile persistence, local export, active local profile selection, local rename/delete behavior, and read-only high-level comparison only. WP3 must not implement hardware writes, HID writes, keyboard configuration reads/writes, apply-to-keyboard actions, sync-to-keyboard actions, save-to-device behavior, key remapping editors, RGB editors, rapid trigger editors, SOCD editors, macro editors, firmware flashing, calibration, cloud sync, user accounts, Electron, or embedded AJAZZ website behavior.

The UI must clearly state that profile management is local-only.

For Work Package 4, Codex may implement local profile storage schema versioning, full saved-profile library backup export/import, merge restore, confirmed replace restore, duplicate profile ID handling, active profile preservation/reset behavior, corrupt or incompatible local storage recovery, clearer storage health diagnostics, and improved local import/export messages only. WP4 must not implement hardware writes, HID writes, keyboard configuration reads/writes, apply-to-keyboard actions, sync-to-keyboard actions, save-to-device behavior, key remapping editors, RGB editors, rapid trigger editors, SOCD editors, macro editors, firmware flashing, calibration, cloud sync, user accounts, remote upload, database services, installer/release packaging, Electron, or embedded AJAZZ website behavior.

For Work Package 5, Codex may implement public alpha repo polish, in-app alpha/read-only messaging, an About screen or section, GitHub issue templates, a pull request template, check-only GitHub Actions CI, contribution guidance, security guidance, screenshot instructions, and copy/empty-state polish only. WP5 must not implement hardware writes, HID writes, keyboard configuration reads/writes, apply-to-keyboard actions, sync-to-keyboard actions, save-to-device behavior, key remapping editors, RGB editors, rapid trigger editors, SOCD editors, macro editors, firmware flashing, calibration, cloud sync, user accounts, remote upload, database services, installer/release packaging, release binary publishing, Electron, or embedded AJAZZ website behavior.

For Work Package 6, Codex may implement a read-only Advanced / Protocol Research screen, safe HID metadata display, cautious likely research interface labeling based only on enumeration metadata, protocol assumptions, local diagnostics snapshot export, Diagnostics protocol research status, and practical pure helper tests only. WP6 must not implement hardware writes, HID writes, `device.write`, `send_feature_report`, `set_report`, output reports, unknown HID command packets, keyboard configuration reads requiring command packets, keyboard configuration writes, apply-to-keyboard actions, sync-to-keyboard actions, save-to-device behavior, key remapping editors, RGB editors, rapid trigger editors, SOCD editors, macro editors, firmware flashing, calibration, cloud sync, user accounts, remote upload, database services, release publishing, Electron, embedded AJAZZ website behavior, or copied GPL-3.0 source code/comments/structures/constants/packet code.

For Work Package 7, Codex may implement a local-only editor for imported or saved AK680 V2 profile JSON. WP7 may deep-clone a profile for editing, locally edit safe profile data such as key assignment names, RT/actuation values, SOCD/game-mode fields, and lighting fields, show edited-vs-original summaries, validate before local export/save/update, export edited JSON, save as a new local profile, update an existing saved local profile after confirmation, and discard/reset local edits. WP7 must preserve `macroDataList` exactly unless a later package explicitly implements macro editing. WP7 must not implement hardware writes, HID writes, `device.write`, `send_feature_report`, `set_report`, output reports, unknown HID command packets, keyboard configuration reads requiring command packets, keyboard configuration writes, apply-to-keyboard actions, sync-to-keyboard actions, save-to-device behavior, real keymap/RGB/RT/SOCD/macro writes, firmware flashing, calibration, cloud sync, user accounts, remote upload, database services, release publishing, Electron, embedded AJAZZ website behavior, or copied GPL-3.0 source code/comments/structures/constants/packet code.

For Work Package 8, Codex may implement a Write Safety / Dry-Run Planner screen or section that uses a valid WP7 edited local profile as input, compares original/source vs edited profile data, shows abstract operation summaries by category, represents backup-before-write as a future safety gate, shows a device compatibility/safety checklist, exports a local dry-run planning file, and displays blocked execution status for future hardware-write actions. WP8 must not implement hardware writes, HID writes, `device.write`, `send_feature_report`, `set_report`, output reports, real HID packets, unknown HID command packets, keyboard configuration reads/writes, apply-to-keyboard actions, sync-to-keyboard actions, save-to-device behavior, real keymap/RGB/RT/SOCD/macro writes, firmware flashing, calibration, cloud sync, user accounts, remote upload, database services, release publishing, Electron, embedded AJAZZ website behavior, or copied GPL-3.0 source code/comments/structures/constants/packet code.

For Work Package 9, Codex may implement a gated Controlled Read Experiment section under Protocol Research / Advanced. If an exact safe query is not justified from current project research notes, Codex must implement a disabled UI/safety harness only. WP9 may require AK680 V2 VID/PID detection, exact selected matching path/interface, warning copy, explicit confirmation modeling, disabled/not-implemented status, structured status/result display, local JSON status export, Diagnostics status, and tests for gating/result/export logic. WP9 must not implement keyboard setting writes, profile apply/sync/save-to-device behavior, key remap/RGB/RT/SOCD/macro writes, firmware flashing, calibration, unknown HID commands, fuzzing, brute forcing, command scanning, multiple command experiments, background polling, continuous monitoring, automatic command execution, cloud sync, user accounts, remote upload, database services, release publishing, Electron, embedded AJAZZ website behavior, or copied GPL-3.0 source code/comments/structures/constants/packet framing/implementation material.

For Work Package 10, Codex may implement exactly one evidence-gated device-info read/query only if the exact query is already justified in `RESEARCH_NOTES.md` without guessing and without copying GPL-3.0 source code, comments, constants, structures, or packet implementation. If that evidence is missing, WP10 must choose Outcome B and keep execution disabled/not implemented. WP10 Outcome B may improve research notes, safety copy, Diagnostics, local export shape, and tests only. WP10 must not add Rust controlled-read commands, Tauri controlled-read invokes, HID report sends, fake response bytes, keyboard setting writes, profile apply/sync/save-to-device behavior, key remap/RGB/RT/SOCD/macro writes, firmware flashing, calibration, unknown or guessed HID commands, fuzzing, brute forcing, command scanning, multiple command experiments, background polling, continuous monitoring, automatic command execution, arbitrary command entry, raw command consoles, cloud sync, user accounts, remote upload, database services, release publishing, Electron, embedded AJAZZ website behavior, or copied GPL-3.0 material.

For Work Package 11, Codex may add protocol evidence collection guide and Candidate Query Dossier tooling only. WP11 may list required evidence, validate dossier completeness, export a blank/example local dossier, update Controlled Read copy to point to the evidence guide, update Diagnostics with evidence status, and update docs/tests. WP11 must not add HID command execution, device-info query execution, HID report sends, keyboard setting writes, profile apply/sync/save-to-device behavior, key remap/RGB/RT/SOCD/macro writes, firmware flashing, calibration, unknown or guessed HID commands, fuzzing, brute forcing, command scanning, multiple command experiments, background polling, continuous monitoring, automatic command execution, arbitrary command entry, raw command consoles, cloud sync, user accounts, remote upload, database services, release publishing, Electron, embedded AJAZZ website behavior, or copied GPL-3.0 source code/comments/constants/structures/packet implementation.

For Work Package 13, Codex may implement exactly one controlled device-info read/query using the existing Controlled Read Experiment harness. The only approved command is `AA 10 30` with report ID `0` and exactly 64 request bytes, run once per explicit user confirmation against AK680 V2 VID/PID `3141/32956`, exact selected HID path/interface, and usagePage `65384` / usage `97` where metadata is available. WP13 must not add any command other than `AA 10 30`, including `AA 11 38`, `AA 12 38`, `AA 13 10`, `AA 14 38`, any other official-driver connect command, setting writes, profile apply/sync/save-to-device behavior, keymap/RGB/RT/SOCD/macro writes, firmware flashing, calibration, unknown or guessed HID commands, retries, fuzzing, brute forcing, command scanning, multiple command experiments, background polling, continuous monitoring, automatic command execution, arbitrary command entry, raw command consoles, cloud sync, user accounts, remote upload, database services, release publishing, Electron, embedded AJAZZ website behavior, or copied GPL-3.0 source code/comments/constants/structures/packet implementation.

For Work Package 14, Codex may add Hardware Smoke Test and release-safety polish only. WP14 may add UI/docs/Diagnostics wording, a manual smoke-test checklist, a local observation template export, and tests that pin the existing WP13 scope. WP14 must not add any new HID command, change the WP13 `AA 10 30` request bytes, report ID `0`, request length `64`, AK680 V2 VID/PID gate, usagePage `65384` / usage `97` gate, selected path/interface gate, timeout behavior, or one-shot manual behavior. WP14 must not add retries, polling, automatic execution, arbitrary command entry, raw command consoles, packet editing, writes, apply/sync/save-to-device behavior, setting writes, firmware flashing, calibration, unsupported response inference, or copied GPL-3.0 material.

For Work Package 15, Codex may add read-protocol evidence and candidate dossier pack support only. WP15 may define local evidence record models, candidate read dossier models, validation, completeness scoring, non-executable classifications, local JSON export examples, UI review sections, Diagnostics wording, docs, fixtures, and tests. WP15 must remain evidence-only and must not add, approve, enable, or imply support for any new HID command, executable lighting/keymap/profile/RT/SOCD/game-mode read, settings-read support, write support, raw command console, arbitrary command entry, packet editing, command registry execution, retries, polling, scanning, fuzzing, probing, automatic execution, writes, apply/sync/save-to-device behavior, setting writes, unsupported inference, or copied GPL-3.0 material. Candidate statuses are limited to `insufficient`, `candidate-only`, and `ready-for-future-Red-Team-review`, and none may enable execution.

For Work Package 16, Codex may add a read-only settings foundation pack. WP16 may define an approved read-only command pack, local read-only snapshot model, snapshot viewer, conservative snapshot/profile compare UI, local snapshot export, and disabled future write gate. WP16 approves exactly the existing WP13 `AA 10 30` controlled device-info read unless WP15 evidence fully qualifies additional commands; the current implementation must not promote insufficient WP15 candidates. WP16 must not add writes, apply/sync/save-to-device behavior, setting writes, full profile apply, macro/keymap/lighting/RT/SOCD writes, firmware flashing, calibration control, arbitrary command entry, raw command consoles, packet editing, command registry execution, retries, polling, scanning, fuzzing, brute force, probing, automatic execution, unsupported inference, broad settings-read claims, write-support claims, or copied GPL-3.0 material.

For Work Package 17, Codex may add a First Controlled Setting Write Evidence Plan only. WP17 may define inert local evidence models, candidate write dossier models, validation, conservative risk scoring, reversibility scoring, hardware-risk classification, backup/rollback/read-back/physical verification evidence requirements, suspicious executable-field rejection, disabled write-readiness checklist data, Protocol Research and Diagnostics review sections, local JSON example export, docs, fixtures, and tests. WP17 must not implement, approve, enable, or execute any write command. WP17 must not change the existing WP13/WP16 `wp13-device-info-read` command behavior or gates, add any HID command, add writes, apply/sync/save-to-device behavior, setting writes, keymap/lighting/RT/SOCD/macro/profile writes, firmware flashing, calibration, raw command consoles, arbitrary command entry, packet editing, command registry execution, retries, polling, scanning, fuzzing, brute force, probing, automatic execution, hidden follow-up commands, unsupported inference, write-support claims, or copied GPL-3.0 material.

For Work Package 18, Codex may add First Controlled Setting Write Candidate Selection only. WP18 may review WP17 first-write evidence/candidate records, record Outcome A with zero selected candidates or Outcome B with exactly one candidate selected for future work-package review, validate that no more than one candidate is selected, enforce risk/reversibility/backup/rollback/read-back/physical-verification/GPL/source-cleanliness thresholds, export local inert selection records, update Protocol Research and Diagnostics wording, update docs/fixtures/tests, and keep the future write gate disabled. WP18 must not implement, approve, enable, or execute any write command; add write paths, apply/sync/save-to-device behavior, setting/keymap/lighting/RT/SOCD/macro/profile/firmware/calibration writes, raw command consoles, arbitrary command entry, packet editing, command registry execution, retries, polling, scanning, fuzzing, brute force, probing, automatic execution, hidden follow-up commands, write-support claims, first-write-ready claims, WP13/WP16 boundary changes, or copied GPL-3.0 material.

Any future hardware-write package must include:

1. Documented command/protocol research
2. Backup-before-write behavior
3. Smallest possible first write
4. Verification after write
5. Red Team test plan before implementation
6. Explicit maintainer approval

---

## 7. Work Package 1 Scope

### Goal

Create the native AK680 Studio desktop app foundation with a polished UI shell and read-only profile inspector using imported AJAZZ AK680 V2 profile JSON.

### In Scope

- Tauri v2 app scaffold
- Rust backend scaffold
- React + TypeScript frontend
- Tailwind CSS styling
- Sidebar navigation
- Dashboard screen
- Device screen with mock/read-only detection placeholder
- Profile Import screen
- Profile validation
- Profile Inspector screen
- Keyboard Layout screen
- Lighting read-only screen
- Rapid Trigger read-only screen
- Macros read-only screen
- Diagnostics screen
- Local-only app state
- `fixtures/ak680-profile.sample.json`
- Documentation and open-source project files

### Out of Scope

- Real hardware writes
- Real HID write/send commands
- Real key remapping writes
- RGB writes
- Rapid trigger writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration
- Electron wrapper
- Embedded AJAZZ website
- Cloud features
- Installer/release packaging
- Multi-keyboard support

---

## 7a. Work Package 2 Scope

### Goal

Add real read-only HID device detection for the AJAZZ AK680 V2 while preserving all accepted Work Package 1 behavior.

### Target Identity

- VID: `3141`
- PID: `32956`
- Device/profile identity: `3141:32956:AJAZZ AK680 V2`

### In Scope

- Rust backend HID enumeration only
- Tauri command returning safe HID metadata
- Device screen refresh/detect action
- Detected, not-detected, and error states
- Read-only metadata display
- Diagnostics HID detection status
- Practical tests for VID/PID matching logic
- Documentation updates

### Out of Scope

- Hardware writes
- HID write/send commands
- Feature report sends
- Keyboard configuration read/write commands
- Key remapping writes
- RGB writes
- Rapid trigger writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration
- Save/apply/sync-to-device UI
- Background device sync
- Electron wrapper
- Embedded AJAZZ website
- Cloud sync

---

## 7b. Work Package 3 Scope

### Goal

Add a local profile manager with local-only persistence, backup/export, active profile selection, rename/delete behavior, and read-only high-level profile comparison while preserving all accepted Work Package 1 and Work Package 2 behavior.

### In Scope

- Save imported valid AK680 V2 profiles locally
- List saved local profiles
- Select an active local profile
- Rename saved profile display names
- Delete saved profiles with confirmation
- Export saved profiles as JSON
- Persist saved profiles across app reload/restart using local-only storage
- Show local profile ID, display name, original profile name, device ID, source filename, created/imported timestamp, and updated timestamp
- Read-only high-level comparison between two saved profiles
- Diagnostics local profile storage status
- Documentation updates

### Comparison Scope

Comparison may summarize:

- Profile name
- Device identity
- `keyList` length and `userKey` count
- `gameModeInfo`
- `ledEffect`
- `macroDataList` count
- `magneticAxisRT` active count
- `magneticAxisRTConfig.currentModeName`

### Out of Scope

- Hardware writes
- HID writes
- Keyboard configuration reads/writes
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Key remapping editor
- RGB editor
- Rapid trigger editor
- SOCD editor
- Macro editor
- Firmware flashing
- Calibration
- Cloud sync
- User accounts
- Remote upload
- Database services
- Installer/release packaging
- Electron wrapper
- Embedded AJAZZ website

---

## 7c. Work Package 4 Scope

### Goal

Add backup hardening and import/export UX polish for local saved profiles while preserving all accepted Work Package 1, Work Package 2, and Work Package 3 behavior.

### In Scope

- Local profile storage schema versioning
- Full saved-profile library backup export as JSON
- Full saved-profile library backup import/restore
- Backup file shape validation before restore
- Merge restore mode
- Replace restore mode only after confirmation
- Safe duplicate profile ID handling
- Active profile selection preservation where safe
- Safe active profile reset when needed
- Graceful recovery from corrupt or incompatible local storage
- Clear storage health/status in Diagnostics
- Improved import/export success and error messages
- Practical tests for backup validation, merge/replace behavior, duplicate handling, and corrupt storage handling
- Documentation updates

### Out of Scope

- Hardware writes
- HID writes
- Keyboard configuration reads/writes
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Key remapping editor
- RGB editor
- Rapid trigger editor
- SOCD editor
- Macro editor
- Firmware flashing
- Calibration
- Cloud sync
- User accounts
- Remote upload
- Database services
- Installer/release packaging
- Electron wrapper
- Embedded AJAZZ website

---

## 7d. Work Package 5 Scope

### Goal

Prepare AK680 Studio for a clean public alpha while preserving all accepted Work Package 1, Work Package 2, Work Package 3, and Work Package 4 behavior.

### In Scope

- Public-facing README structure and repo polish
- In-app public alpha/read-only safety messaging
- About screen or About section
- Prominent safety notice covering unofficial status, local-only behavior, read-only HID detection, no hardware writes, and no AJAZZ affiliation
- Screenshot placeholders or screenshot instructions
- GitHub issue templates for bug reports, feature requests, and device detection reports
- Pull request template
- Basic check-only GitHub Actions CI for lint/build/test where practical, or a documented skip reason when workflow push permission is unavailable
- Contribution guidance for safe hardware/protocol work
- SECURITY.md hardware safety and responsible disclosure guidance
- UI copy and empty/error state polish where practical
- Apache-2.0 project license
- Documentation updates

### Out of Scope

- Hardware writes
- HID writes
- Keyboard configuration reads/writes
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Key remapping editor
- RGB editor
- Rapid trigger editor
- SOCD editor
- Macro editor
- Firmware flashing
- Calibration
- Cloud sync
- User accounts
- Remote upload
- Database services
- Installer/release packaging
- Release binary publishing
- Electron wrapper
- Embedded AJAZZ website

---

## 7e. Work Package 6 Scope

### Goal

Add a read-only protocol research toolkit for safely inspecting AK680 V2 HID/device metadata and exporting local diagnostics snapshots while preserving all accepted Work Package 1 through Work Package 5 behavior.

### In Scope

- Advanced / Protocol Research screen or section
- Display all detected matching AK680 V2 HID interfaces/paths
- Safe HID metadata display: VID, PID, path, manufacturer, product, serial if available, usage page, usage, interface number, and release number where available
- Cautious likely target research interface labeling only when safely inferred without probing
- Research Mode warning covering read-only, experimental, no setting changes, no keyboard configuration writes, and no unknown HID command packets
- Protocol assumptions in app and Diagnostics
- Local protocol diagnostics snapshot export as JSON
- Snapshot content with timestamp, app version/commit if available, matching HID metadata, imported profile summary, active saved profile summary, assumptions, and safety status
- Diagnostics protocol research status
- Practical tests for pure matching, formatting, inference, and snapshot logic
- Documentation updates

### Protocol Assumptions

- Target VID/PID is `3141/32956`
- USB/wired mode is likely required
- Bluetooth configuration is not supported
- AK680 V2 is treated as proprietary HID, not QMK/VIA
- Future writes require a separate work package and Red Team plan
- GPL-3.0 repositories may be studied for behavior only; do not copy code

### Out of Scope

- Hardware writes
- HID writes
- `device.write`
- `send_feature_report`
- `set_report`
- Output report behavior
- Unknown HID command packets
- Keyboard configuration reads requiring command packets
- Keyboard configuration writes
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Key remapping editor
- RGB editor
- Rapid trigger editor
- SOCD editor
- Macro editor
- Firmware flashing
- Calibration
- Cloud sync
- User accounts
- Remote upload
- Database services
- Release publishing
- Electron wrapper
- Embedded AJAZZ website
- Copied GPL-3.0 source code, comments, structures, constants, or packet code

---

## 7f. Work Package 7 Scope

### Goal

Add a local-only settings editor suite for imported or saved AK680 V2 profile data while preserving all accepted Work Package 1 through Work Package 6 behavior.

### In Scope

- Local Editor / Edit Profile screen or mode
- Start editing from a valid imported profile or saved local profile
- Deep-cloned editable local copy that preserves the original until explicit export/save/update
- Local-only warning that the keyboard is not changed
- Safe local keymap assignment-name editing
- Safe local RT/actuation editing where profile sections exist
- Safe local SOCD/game-mode editing where profile sections exist
- Safe local lighting editing where profile sections exist
- Exact `macroDataList` preservation when macro editing is not implemented
- Edited-vs-original diff and summary
- Validation before export/save/update
- Edited profile JSON export
- Save edited profile as a new local profile
- Update existing local profile after confirmation
- Discard/reset local edits
- Diagnostics local editor status
- Practical pure logic tests
- Documentation updates

### Out of Scope

- Hardware writes
- HID writes
- `device.write`
- `send_feature_report`
- `set_report`
- Output report behavior
- Unknown HID command packets
- Keyboard configuration reads requiring command packets
- Keyboard configuration writes
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Real keymap/RGB/RT/SOCD/macro writes
- Macro editor
- Firmware flashing
- Calibration
- Cloud sync
- User accounts
- Remote upload
- Database services
- Release publishing
- Electron wrapper
- Embedded AJAZZ website
- Copied GPL-3.0 source code, comments, structures, constants, or packet code

---

## 7g. Work Package 8 Scope

### Goal

Add a Write Safety Layer and Dry-Run Planner that prepares for future hardware writes without sending anything to the keyboard while preserving all accepted Work Package 1 through Work Package 7 behavior.

### In Scope

- Write Safety / Dry-Run Planner screen or section
- Valid WP7 edited local profile as input
- Safe no-input and invalid-edited-profile states
- Original/source vs edited profile summaries
- Validation status display
- No-change state when no local edits exist
- Abstract operation summaries by category:
  - keymap changes
  - RT/actuation changes
  - SOCD/game-mode changes
  - lighting changes
  - macro preservation status
- Backup-before-write future safety gate
- Device compatibility/safety checklist:
  - AK680 V2 VID/PID match from read-only HID detection
  - likely HID interface if safely inferred from read-only metadata
  - profile identity validation
  - edited profile validation
  - backup requirement
  - hardware write support not implemented
  - no packets sent
- Local dry-run plan export as JSON or text
- Blocked execution state for future apply/write/sync/save-to-device UX
- Diagnostics dry-run planner status
- Practical pure logic tests
- Documentation updates

### Out of Scope

- Hardware writes
- HID writes
- `device.write`
- `send_feature_report`
- `set_report`
- Output report behavior
- Real HID packets
- Unknown HID command packets
- Keyboard configuration reads requiring command packets
- Keyboard configuration writes
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Real keymap/RGB/RT/SOCD/macro writes
- Firmware flashing
- Calibration
- Cloud sync
- User accounts
- Remote upload
- Database services
- Release publishing
- Electron wrapper
- Embedded AJAZZ website
- Copied GPL-3.0 source code, comments, structures, constants, or packet code

### Design Rules

- Dry-run planning must be explicit that no packets are sent.
- Operation summaries must remain abstract and must not become packet bytes, report payloads, endpoint instructions, or executable commands.
- Backup-before-write remains a future safety gate and does not unlock writing in WP8.
- The planner must not mutate WP7 editor state.

---

## 7h. Work Package 9 Scope

### Goal

Add the first Controlled Read Experiment area under Protocol Research / Advanced while preserving all accepted Work Package 1 through Work Package 8 behavior.

### Current Outcome

Command execution is disabled/not implemented because current project research notes do not justify an exact safe read/query command. WP9 therefore implements the UI/safety harness only.

### In Scope

- Controlled Read Experiment section under Protocol Research / Advanced
- Off/disabled by default
- AK680 V2 VID/PID `3141/32956` detection gate
- Exact selected matching HID path/interface gate
- Explicit confirmation requirement modeled for future implemented query
- Clear experimental read/query-only warnings
- Disabled/not-implemented command execution state
- At most one future known read/query experiment; no command list
- Safe result/status display: status, timestamp, response length, hex bytes where applicable, and message
- Local JSON export of controlled read status/result
- Diagnostics controlled read experiment status
- RESEARCH_NOTES.md documentation of disabled pending safe justification
- README.md, PROJECT_PLAYBOOK.md, and CHANGELOG.md updates
- Practical pure logic tests for gating, path selection, disabled result, hex formatting, and export shape

### Out of Scope

- Keyboard setting writes
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Key remap writes
- RGB writes
- RT/actuation writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration
- Unknown HID commands
- Fuzzing
- Brute forcing
- Command scanning
- Multiple command experiments
- Background polling
- Continuous monitoring
- Automatic command execution on app launch or screen open
- Command execution without explicit user action
- Command execution on wrong VID/PID
- Command execution without selected target interface/path
- Cloud sync
- User accounts
- Remote upload
- Database services
- Release publishing
- Electron wrapper
- Embedded AJAZZ website
- Copied GPL-3.0 source code, comments, structures, constants, packet framing, or implementation material

### Design Rules

- If a safe query cannot be justified, command execution must stay disabled.
- The harness must not fabricate response bytes.
- The harness must not add Rust or Tauri command execution paths.
- Future query work must remain one controlled read/query only, run once per explicit confirmed user action, with short timeout and structured success/error/timeout.

---

## 7i. Work Package 10 Scope

### Goal

Evaluate whether the WP9 harness can safely enable exactly one device-info read/query, then either implement that one query if already justified or keep it disabled when evidence is insufficient.

### Current Outcome

WP10 chooses Outcome B. Current project research notes do not document the exact HID report type, report ID, request bytes or command framing, expected response length/format, or proof that a device-info query is read/query-only and not a keyboard setting write.

### In Scope

- Preserve Work Package 1 through Work Package 9 behavior
- Keep command execution disabled/not implemented
- Document missing evidence in `RESEARCH_NOTES.md`
- Make UI, Diagnostics, and export status clearly report Outcome B
- Report no Rust controlled-read command, no Tauri controlled-read invoke, no HID report send, and no fake response bytes
- Keep AK680 V2 VID/PID and exact selected path/interface gates modeled for future work
- Add practical tests for disabled state, missing evidence, safety gates, and export shape
- Update README.md, PROJECT_PLAYBOOK.md, RESEARCH_NOTES.md, and CHANGELOG.md

### Out of Scope

- Keyboard setting writes
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Key remap writes
- RGB writes
- RT/actuation writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration
- Unknown or guessed HID commands
- Fuzzing
- Brute forcing
- Command scanning
- Multiple command experiments
- Background polling
- Continuous monitoring
- Automatic command execution on app launch or screen open
- Command execution without explicit user action
- Command execution on wrong VID/PID
- Command execution without selected target interface/path
- Arbitrary command entry
- Raw command consoles
- Cloud sync
- User accounts
- Remote upload
- Database services
- Release publishing
- Electron wrapper
- Embedded AJAZZ website
- Copied GPL-3.0 source code, comments, constants, structures, packet framing, or implementation material

### Design Rules

- Outcome B must include no command execution path.
- The disabled harness must not fabricate response bytes.
- Docs and UI must not imply that a device-info query exists.
- Future Outcome A work must first document one exact query and explain why it is read/query-only, then pass Red Team review.

---

## 7j. Work Package 11 Scope

### Goal

Add a Protocol Evidence Collection Guide and Candidate Query Dossier workflow so future work can justify a controlled device-info read query without guessing and without copying GPL-3.0 material.

### Current Outcome

WP11 is evidence-only. Dossier completeness can reach `ready for Red Team review`, but it cannot enable command execution in the app.

### In Scope

- Preserve Work Package 1 through Work Package 10 behavior
- Protocol Evidence Guide under Protocol Research / Advanced
- Required evidence list for exact report type, report ID if applicable, request bytes/framing, expected response length/shape, target interface/path constraints, read-only justification, non-write rationale, evidence source, and GPL cleanliness statement
- Candidate Query Dossier template
- Allowed statuses only: `draft`, `needs evidence`, `rejected`, `ready for Red Team review`
- Local blank/example dossier JSON or Markdown export
- Dossier validation and completeness logic
- Controlled Read Experiment copy that points to the evidence guide
- Diagnostics protocol evidence status
- RESEARCH_NOTES.md, README.md, PROJECT_PLAYBOOK.md, and CHANGELOG.md updates
- Practical tests for validation, export, completeness, and status logic

### Out of Scope

- HID command execution
- Device-info query execution
- HID report sends
- Keyboard setting writes
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Key remap writes
- RGB writes
- RT/actuation writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration
- Unknown or guessed HID commands
- Fuzzing
- Brute forcing
- Command scanning
- Multiple command experiments
- Background polling
- Continuous monitoring
- Automatic command execution on app launch or screen open
- Arbitrary command entry
- Raw command consoles
- Cloud sync
- User accounts
- Remote upload
- Database services
- Release publishing
- Electron wrapper
- Embedded AJAZZ website
- Copied GPL-3.0 source code, comments, constants, structures, packet framing, or implementation material

### Design Rules

- Dossier evidence does not enable command execution in WP11.
- Future query implementation requires a new work package and Red Team plan.
- Do not add Rust or Tauri command execution paths.
- Do not add HID report send paths.
- Placeholder fields must stay clearly non-executable.
- Exports must remain local-only.

---

## 7k. Work Package 13 Scope

### Goal

Implement exactly one controlled device-info read/query using the existing Controlled Read Experiment harness.

### WP12-Approved Command

- Method equivalent: HID output report / WebHID `sendReport`
- Report ID: `0`
- Request length: `64` bytes
- Request bytes:

```text
AA 10 30 00 00 00 01 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```

### In Scope

- Preserve Work Package 1 through Work Package 11 behavior
- Exactly one Rust backend function and one Tauri command for the controlled read
- AK680 V2 VID/PID `3141/32956` gate
- Exact selected matching HID path/interface gate
- Usage page `65384` and usage `97` gate where metadata is available
- Explicit user confirmation immediately before execution
- One run per confirmed user action
- Short timeout
- Structured success, blocked, canceled, timeout, and error results
- Safe response display: status, length, hex, minimal prefix parse, and observed VID/PID-like bytes only
- Local JSON result export
- Diagnostics status and safety boundaries
- README.md, PROJECT_PLAYBOOK.md, RESEARCH_NOTES.md, and CHANGELOG.md updates
- Tests for exact bytes, report ID, gates, results, export, and safety

### Out of Scope

- Any command other than exact `AA 10 30`
- `AA 11 38`
- `AA 12 38`
- `AA 13 10`
- `AA 14 38`
- Any other official-driver connect command
- Keyboard setting writes
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Key remap writes
- RGB writes
- RT/actuation writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration
- Unknown or guessed HID commands
- Retries
- Fuzzing
- Brute forcing
- Command scanning
- Multiple command experiments
- Background polling
- Continuous monitoring
- Automatic command execution on app launch or screen open
- Arbitrary command entry
- Raw command consoles
- Cloud sync
- User accounts
- Remote upload
- Database services
- Release publishing
- Electron wrapper
- Embedded AJAZZ website
- Copied GPL-3.0 source code, comments, constants, structures, packet framing, or implementation material

### Design Rules

- Exactly one controlled command may exist.
- The frontend must not pass arbitrary payload bytes to Rust.
- Backend must validate VID/PID and selected path before sending.
- Backend must reject keyboard and consumer-control interfaces where metadata is available.
- Response parsing must remain minimal and must not infer firmware, settings, calibration, layout, memory, or profile state.

---

## 7l. Work Package 14 Scope

### Goal

Add Hardware Smoke Test and release-safety polish without changing the WP13 controlled read behavior.

### In Scope

- Preserve Work Package 1 through Work Package 13 behavior
- Improve release-safety wording in UI, Diagnostics, Protocol Research, and docs
- Add a manual hardware smoke-test checklist
- Add a local smoke-test observation template export
- Clarify that physical AK680 V2 results are observations only
- Clarify that WP13 has exactly one controlled read/query
- Clarify that no additional protocol execution, writes, apply/sync/save-to-device, retries, polling, fuzzing, scanning, raw command console, arbitrary payload input, or packet editing exists
- Tests for safety wording and unchanged WP13 command scope
- README.md, PROJECT_PLAYBOOK.md, RESEARCH_NOTES.md, and CHANGELOG.md updates

### Out of Scope

- Any new HID command
- Changing the WP13 approved request bytes
- Changing report ID `0`
- Changing request length `64`
- Changing AK680 V2 VID/PID gating
- Changing usagePage `65384` / usage `97` gating
- Removing exact selected path/interface gating
- Retries
- Polling
- Automatic execution
- Arbitrary command entry
- Raw command consoles
- Packet editing
- Writes
- Apply, sync, or save-to-device behavior
- Setting writes
- Firmware flashing
- Calibration
- Inferring firmware version, settings state, calibration state, layout state, memory state, profile state, or write capability from smoke-test responses
- Copied GPL-3.0 source code, comments, constants, structures, packet builders, or implementation material

### Design Rules

- Smoke-test UI must be manual and observation-only.
- Smoke-test exports must be local JSON templates only.
- The existing WP13 controlled read code path must remain unchanged.

---

## 7m. Work Package 15 Scope

### Goal

Add Read Protocol Evidence and Candidate Dossier Pack support for possible future read-only settings research.

### In Scope

- Preserve Work Package 1 through Work Package 14 behavior
- Local evidence file/data model support
- Candidate read-command dossier data model support
- Evidence and dossier validation
- Evidence completeness scoring and non-executable status classification
- Local JSON evidence/dossier export examples
- Disabled candidate-read records as inert data only
- Protocol Research and Diagnostics review sections
- README.md, PROJECT_PLAYBOOK.md, RESEARCH_NOTES.md, CHANGELOG.md, guide, fixture, and tests

### Allowed Candidate Statuses

- `insufficient`
- `candidate-only`
- `ready-for-future-Red-Team-review`

These statuses are labels only. They do not approve commands, enable execution, or claim settings-read support.

### Out of Scope

- New executable HID commands
- Approval of any new HID command
- Executable lighting, keymap, profile, RT/actuation, SOCD, or game-mode reads
- Settings-read support claims
- Write support claims
- Raw command consoles
- Arbitrary command entry
- Packet editing
- Command registry execution
- Retries
- Polling
- Scanning
- Fuzzing
- Brute forcing or probing
- Automatic execution on app launch, screen open, evidence import, dossier validation, device connect, metadata refresh, or export
- Writes
- Apply, sync, or save-to-device behavior
- Setting writes
- Unsupported firmware/settings/calibration/layout/memory/profile/write-capability inference
- Copied GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material

### Design Rules

- Evidence validation must never access HID devices.
- Evidence import/export must stay local-only and inert.
- Candidate completeness must never become execution approval.
- The WP13 `AA 10 30` controlled read behavior must remain unchanged.

---

## 7n. Work Package 16 Scope

### Goal

Add a Read-Only Settings Foundation Pack with an approved command list, local snapshot model, viewer/compare UI, and disabled future write gate.

### Approved Command Decision

WP16 approves exactly one command: the existing WP13 controlled device-info read/query `AA 10 30`, report ID `0`, request length `64`, AK680 V2 VID `3141`, PID `32956`, usagePage `65384`, usage `97`, exact selected path/interface, manual confirmation, one-shot execution, short timeout, no retries, no polling, and no automatic execution.

No additional WP15 candidate dossier is strong enough to become executable in WP16.

### In Scope

- Preserve Work Package 1 through Work Package 15 behavior
- Hard-coded approved read-only command pack
- Local read-only snapshot model
- Snapshot viewer and local JSON snapshot export
- Conservative snapshot/profile comparison
- Known/unknown/raw/parser-warning/confidence response separation
- Disabled future write gate
- Diagnostics for approved command count, WP13 boundary, manual/no-retry/no-polling/no-auto status, snapshot/compare status, and future write gate status
- README.md, PROJECT_PLAYBOOK.md, RESEARCH_NOTES.md, CHANGELOG.md, guide, and tests

### Out of Scope

- Any command beyond the WP13 `AA 10 30` controlled read
- Hardware writes
- Apply, sync, or save-to-device behavior
- Setting writes
- Full profile apply
- Macro, keymap, RGB/lighting, rapid trigger/actuation, or SOCD/game-mode writes
- Firmware flashing
- Calibration write/control
- Arbitrary command entry
- Raw command consoles
- Packet editing
- Command registry execution
- Command scanning
- Fuzzing, brute force, or probing
- Polling
- Retries
- Automatic execution on app launch, screen open, device connect, metadata refresh, snapshot viewer open, compare UI open, editor open, backup/export, or import
- Execution on keyboard usagePage `1` / usage `6`
- Execution on consumer-control usagePage `12` / usage `1`
- Unsupported firmware/settings/calibration/layout/memory/profile/write-capability inference
- Write-support claims
- Broad settings-read support claims beyond the exact approved command
- Copied GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material

### Design Rules

- Snapshot/viewer/compare/export must not trigger hidden HID access.
- Unknown fields must remain unknown.
- Unsupported fields must be marked unsupported or not comparable, not writable differences.
- Future write gate must remain disabled and require a separate work package and Red Team plan.

---

## 7o. Work Package 17 Scope

### Goal

Add a First Controlled Setting Write Evidence Plan without implementing, approving, enabling, or executing write behavior.

### In Scope

- Preserve Work Package 1 through Work Package 16 behavior
- Local first-write evidence record model
- Candidate first-write dossier model
- Candidate statuses limited to `insufficient-evidence`, `rejected-too-risky`, `candidate-only`, and `ready-for-future-Red-Team-review`
- Conservative risk scoring from `1` very low to `5` unacceptable
- Conservative reversibility scoring from `1` unknown to `5` documented and verifiable
- Hardware-risk classification
- Backup, rollback, read-back, and physical verification evidence requirements
- Suspicious executable-field rejection
- Disabled write-readiness checklist
- Protocol Research and Diagnostics review sections
- Local JSON fixture/export shape
- README.md, PROJECT_PLAYBOOK.md, RESEARCH_NOTES.md, CHANGELOG.md, guide, fixture, and tests

### Out of Scope

- Any new HID command
- Any write command implementation, approval, enablement, or execution
- Changes to the WP13/WP16 `wp13-device-info-read` request bytes, report ID, request length, VID/PID gate, usagePage/usage gate, selected path/interface gate, manual confirmation, one-shot behavior, timeout, no-retry behavior, no-polling behavior, or no-automatic-execution behavior
- Writes
- Apply, sync, or save-to-device behavior
- Setting writes
- Profile apply
- Macro, keymap, lighting, rapid trigger/actuation, or SOCD/game-mode writes
- Firmware flashing, DFU, bootloader operations, factory reset, or calibration
- Arbitrary command entry
- Raw command consoles
- Packet editing
- Command registry execution
- Retries
- Polling
- Scanning
- Fuzzing
- Brute force or probing
- Automatic execution on app launch, screen open, evidence import, dossier validation, device connect, metadata refresh, snapshot viewer open, compare UI open, editor open, backup/export, or import
- Hidden follow-up commands
- Unsupported firmware/settings/calibration/layout/memory/profile/write-capability inference
- Write-support claims
- Copied GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material

### Design Rules

- Evidence validation must never access HID devices.
- Evidence import/export must stay local-only and inert.
- Candidate status, score, completeness, backup evidence, rollback evidence, read-back evidence, and physical verification evidence must never become execution approval.
- The future write gate must remain disabled and require a separate work package and Red Team plan.
- The WP13 `AA 10 30` controlled read behavior must remain unchanged.

---

## 7p. Work Package 18 Scope

### Goal

Add First Controlled Setting Write Candidate Selection without implementing, approving, enabling, or executing write behavior.

### Outcome Decision

WP18 selects Outcome A for the current WP17 evidence pack: no candidate is selected for future implementation. The available WP17 visual lighting placeholder lacks exact request bytes, report ID, request length, clear mutation scope, low-risk classification, sufficient reversibility, complete backup evidence, complete rollback evidence, and complete read-back or physical verification evidence. The keymap candidate is rejected as too risky and not first-write appropriate.

### In Scope

- Preserve Work Package 1 through Work Package 17 behavior
- Candidate-selection model and data types
- Outcome A and Outcome B result models
- Selection statuses limited to `not-selected`, `rejected-insufficient-evidence`, `rejected-too-risky`, `rejected-not-first-write-appropriate`, and `selected-for-future-WP-review`
- Validation that zero or one candidate can be selected
- Validation that selected candidates remain non-executable
- Review logic for WP17 evidence and candidate dossiers
- Risk score threshold checks: Outcome B requires `1` or `2`
- Reversibility score threshold checks: Outcome B requires `4` or `5`
- Hardware-risk checks: Outcome B requires `visual-only-low-risk` or `single-setting-low-risk`
- Mutation-scope checks: Outcome B requires visual-only or single-setting scope
- Backup and rollback condition checks
- Read-back or physical verification condition checks
- GPL/source-cleanliness checks
- Candidate rejection rationale
- Future implementation constraints for any future Outcome B
- Protocol Research and Diagnostics candidate-selection status
- Local-only selection record export
- README.md, PROJECT_PLAYBOOK.md, RESEARCH_NOTES.md, CHANGELOG.md, guide, fixture, and tests

### Out of Scope

- Any write command implementation, approval, enablement, or execution
- Any new HID command
- Any change to the WP13/WP16 read-only `wp13-device-info-read` behavior or gates
- Apply, sync, or save-to-device behavior
- Setting writes
- Lighting writes
- Keymap writes
- Rapid trigger, SOCD, macro, profile, firmware, calibration, DFU, bootloader, factory reset, or full-profile apply behavior
- Arbitrary command entry
- Raw command consoles
- Packet editing
- Command registry execution
- Retries
- Polling
- Scanning
- Fuzzing
- Brute force or probing
- Automatic execution on app launch, device connect, screen open, import, export, validation, backup, rollback planning, read-back planning, compare, editor open, or diagnostics open
- Hidden follow-up commands
- Claims that write support exists
- Claims that candidate selection is implementation approval
- Claims that a selected candidate is executable now
- Treating backup, rollback, read-back, or physical verification evidence as execution approval
- Selecting more than one future write candidate
- Copied GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material

### Design Rules

- Candidate selection records must remain local-only and inert.
- Candidate selection validation and export must not access HID devices.
- Outcome B, if ever produced by evidence, must select exactly one candidate for future review only.
- The future write gate must remain disabled and require a separate work package and Red Team plan.
- The WP13/WP16 `AA 10 30` controlled read behavior must remain unchanged.

---

## 8. Required Screens

The current app must include these screens:

1. Dashboard
2. Device
3. Profile Import
4. Profile Inspector
5. Keyboard Layout
6. Lighting
7. Rapid Trigger
8. Macros
9. Diagnostics
10. Profiles
11. Protocol Research
12. Local Editor
13. Write Safety / Dry-Run Planner
14. Controlled Read Experiment section under Protocol Research
15. Hardware Smoke Test checklist section under Protocol Research
16. Read Protocol Evidence Pack section under Protocol Research
17. Read-Only Settings Foundation section under Protocol Research
18. First Write Evidence Plan section under Protocol Research
19. First Write Candidate Selection section under Protocol Research

All screens must remain free of keyboard hardware writes. The only command-capable exception is the WP13-approved `AA 10 30` controlled device-info read/query.

---

## 9. Data Models

Create TypeScript types for:

- `ImportedProfile`
- `AjazzProfile`
- `DeviceInfo`
- `KeyboardKey`
- `GameModeInfo`
- `LedEffect`
- `CustomLedData`
- `MagneticAxisRT`
- `MagneticAxisRTConfig`
- `ValidationResult`

Validation should check at minimum:

- JSON is parseable
- `profile` object exists if the export wraps data in a top-level profile object
- `profileName` exists
- `deviceInfo` exists
- `keyList` exists and is an array
- Device identity matches AK680 V2 by device ID or VID/PID
- Missing optional sections create warnings, not crashes

---

## 10. Keyboard Layout Requirements

The Keyboard Layout screen must:

- Render rows from `keyList`
- Show `key.name` as the visible label
- Use `className` and `value` as data only
- Avoid depending on vendor CSS
- Highlight keys with `userKey`
- Show an `SOCD` badge when `userKey.name === "SOCD"`
- Remain read-only
- Expose no remapping/write action

---

## 11. Documentation Requirements

### README.md

Must include:

- What AK680 Studio is
- Open-source/unofficial disclaimer
- Tech stack
- How to install dependencies
- How to run locally
- Work Package 1 scope
- Out-of-scope features
- Safety note: read-only, no keyboard writes

### RESEARCH_NOTES.md

Must include:

- Target device details
- Known VID/PID
- Known profile sections
- Notes on AJAZZ-HUB as a reference only
- Unknowns around HID write protocol
- Future research tasks

### CHANGELOG.md

Must include:

- Work Package 1 entry
- Main files/screens added
- Known limitations

### CONTRIBUTING.md

Must include:

- How contributors should set up the project
- Scope discipline
- Safety warning around hardware control
- Requirement to avoid hardware writes unless assigned in a specific future work package

### SECURITY.md

Must include:

- How to report safety/security issues
- Warning that hardware-write features require careful review

---

## 12. Acceptance Criteria — Work Package 1

Work Package 1 is accepted only if:

1. App runs as a Tauri desktop app.
2. App does not use Electron.
3. App does not embed the AJAZZ website.
4. App has a clean UI shell with sidebar navigation.
5. Dashboard screen exists.
6. Device screen exists and is mock/read-only.
7. Profile Import screen exists.
8. Profile Inspector screen exists.
9. Keyboard Layout screen exists.
10. Lighting screen exists and is read-only.
11. Rapid Trigger screen exists and is read-only.
12. Macros screen exists and is read-only.
13. Diagnostics screen exists.
14. User can import an AJAZZ profile JSON file.
15. App validates that the profile is for AJAZZ AK680 V2.
16. App displays profile name and device ID.
17. App displays core device info.
18. App renders keyboard layout from `keyList`.
19. App highlights keys with `userKey` settings.
20. App shows LED settings read-only.
21. App shows game mode settings read-only.
22. App shows magnetic-axis settings summary read-only.
23. App shows macro data/count read-only.
24. Invalid JSON is rejected safely.
25. Wrong-device JSON is rejected safely.
26. No hardware write commands exist.
27. No hardware write UI exists.
28. No firmware flashing exists.
29. No calibration exists.
30. App state remains local-only.
31. README.md explains how to run the app.
32. PROJECT_PLAYBOOK.md exists and is followed.
33. CHANGELOG.md includes Work Package 1 notes.
34. RESEARCH_NOTES.md documents assumptions and unknowns.
35. Open-source files are created where practical: LICENSE, CONTRIBUTING.md, SECURITY.md.

---

## 13. Git and GitHub Rules

Codex should initialize and maintain a clean Git history.

Recommended branch:

- `main` for initial repo setup

Recommended commit style:

- `docs: add project playbook and QA plan`
- `chore: scaffold tauri app`
- `feat: add read-only profile inspector`
- `docs: update setup and safety notes`

If GitHub CLI is available and authenticated, Codex may create a public GitHub repository:

- Repo name: `ak680-studio`
- Visibility: public
- Description: `Open-source native desktop profile inspector and future configurator for the AJAZZ AK680 V2 keyboard.`

If GitHub CLI is not authenticated or repo creation fails, Codex should not block local implementation. It should finish the local repo, make commits if possible, and print the exact commands the maintainer should run manually.

Codex must not commit:

- Secrets
- Tokens
- API keys
- Personal machine paths
- Large build outputs
- `node_modules`
- Tauri target/build directories

---

## 14. Recommended First Repository Structure

```txt
ak680-studio/
  .gitignore
  LICENSE
  README.md
  PROJECT_PLAYBOOK.md
  RESEARCH_NOTES.md
  CHANGELOG.md
  CONTRIBUTING.md
  SECURITY.md
  RED_TEAM_WP1_TEST_PLAN.md
  fixtures/
    ak680-profile.sample.json
  src/
    components/
    features/
    lib/
    types/
  src-tauri/
```

---

## 15. Work Package Discipline

Codex must not build beyond the current work package.

Every future work package must include:

- Goal
- Scope
- Out of scope
- Acceptance criteria
- Red Team test plan before implementation
- Documentation updates
- Safety review if hardware control is involved

Do not add features just because they seem obvious.

Do not implement hardware writes unless a future work package explicitly allows it.
