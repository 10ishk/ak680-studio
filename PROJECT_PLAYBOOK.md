# PROJECT_PLAYBOOK.md

# AK680 Studio — Project Playbook

## 1. Project Identity

**Project name:** AK680 Studio  
**Repository name:** `ak680-studio`  
**Project type:** Open-source native desktop app  
**Target device:** AJAZZ AK680 V2  
**License:** Apache-2.0
**Status:** Work Package 9 controlled read experiment harness

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

Work Packages 1, 2, 3, 4, 5, and 6 are intentionally read-only and do not configure the physical keyboard. Work Package 7 adds local profile JSON editing only and still does not configure the physical keyboard. Work Package 8 adds dry-run write safety planning only and cannot execute hardware writes or generate real HID packets. Work Package 9 adds a controlled read experiment harness only; command execution remains disabled until an exact safe query is justified.

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

All screens must remain read-only with respect to physical keyboard hardware.

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
