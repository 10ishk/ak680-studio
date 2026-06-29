# PROJECT_PLAYBOOK.md

# AK680 Studio — Project Playbook

## 1. Project Identity

**Project name:** AK680 Studio  
**Repository name:** `ak680-studio`  
**Project type:** Open-source native desktop app  
**Target device:** AJAZZ AK680 V2  
**License:** MIT, unless the maintainer chooses another permissive license before first public release  
**Status:** Work Package 2 read-only HID detection

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

Work Packages 1 and 2 are intentionally read-only and do not configure the physical keyboard.

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

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/pull_request_template.md`
- GitHub Actions CI workflow

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

## 8. Required Screens

Work Package 1 must include these screens:

1. Dashboard
2. Device
3. Profile Import
4. Profile Inspector
5. Keyboard Layout
6. Lighting
7. Rapid Trigger
8. Macros
9. Diagnostics

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
