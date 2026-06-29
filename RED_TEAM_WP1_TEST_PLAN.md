# RED_TEAM_WP1_TEST_PLAN.md

# Red Team QA Test Plan — Work Package 1

## 1. Purpose

This QA plan verifies that Work Package 1 of **AK680 Studio** meets the agreed contract only.

The purpose is to test that the app provides a native Tauri desktop foundation with a polished read-only UI shell and an imported AJAZZ AK680 V2 profile JSON inspector.

This plan does **not** add new product requirements. It only tests the agreed Work Package 1 scope and acceptance criteria.

---

## 2. Test Environment Assumptions

Testing assumes the implementation provides:

* A Tauri v2 desktop app.
* A Rust backend.
* A React + TypeScript frontend.
* Tailwind CSS styling.
* Optional shadcn/ui usage if implemented.
* Local-only app state.
* No real hardware writes.
* No Electron wrapper.
* No embedded AJAZZ website.
* A sample or user-provided AJAZZ AK680 V2 profile JSON file.

Target keyboard/profile details expected for valid profile testing:

* Device: `AJAZZ AK680 V2`
* Device ID: `3141:32956:AJAZZ AK680 V2`
* VID: `3141`
* PID: `32956`
* Example profile name: `Valorant (1)`

Expected profile JSON may include:

* `deviceInfo`
* `keyList`
* `gameModeInfo`
* `ledEffect`
* `customLedData`
* `macroDataList`
* `magneticAxisRT`
* `magneticAxisRTConfig`
* `profileName`

---

## 3. Manual Test Cases

### TC-01 — App launches as native Tauri desktop app

**Acceptance criteria covered:** 1, 14

**Steps:**

1. Install dependencies according to `README.md`.
2. Run the app using the documented command.
3. Confirm that a native desktop window opens.
4. Confirm the app is not running inside a browser tab.
5. Confirm the project does not use Electron.

**Expected result:**

* The app launches as a native Tauri desktop app.
* No Electron window, Electron dependency, or Electron wrapper is used.

**Pass/Fail:**

* Pass if the app launches successfully through Tauri.
* Fail if the app only runs as a web page, uses Electron, or cannot launch.

---

### TC-02 — Sidebar navigation is present

**Acceptance criteria covered:** 2

**Steps:**

1. Launch the app.
2. Inspect the main UI shell.
3. Confirm that sidebar navigation is visible.
4. Confirm navigation entries exist for the agreed Work Package 1 screens.

**Expected result:**

The app has a clean UI shell with sidebar navigation.

Expected navigation areas:

* Dashboard
* Device
* Profile Import
* Profile Inspector
* Lighting
* Rapid Trigger
* Macros
* Diagnostics

**Pass/Fail:**

* Pass if the sidebar exists and the agreed screens are reachable.
* Fail if there is no sidebar or core screens are unreachable.

---

### TC-03 — Dashboard screen loads

**Acceptance criteria covered:** 2

**Steps:**

1. Launch the app.
2. Open the Dashboard screen.
3. Verify that the screen renders without errors.
4. Confirm it fits within the Work Package 1 shell.

**Expected result:**

* Dashboard screen loads cleanly.
* No broken layout, blank page, or runtime error appears.

**Pass/Fail:**

* Pass if the dashboard renders correctly.
* Fail if the screen crashes or is missing.

---

### TC-04 — Device screen shows mock/read-only detection placeholder

**Acceptance criteria covered:** 6, 13

**Steps:**

1. Open the Device screen.
2. Confirm the screen shows device-related information or a placeholder.
3. Confirm it is read-only.
4. Confirm no hardware write action is available.

**Expected result:**

* Device screen exists.
* Device detection is mock/read-only only.
* No real hardware write, sync, flash, remap, RGB write, or calibration action is available.

**Pass/Fail:**

* Pass if the device screen is read-only and within scope.
* Fail if the screen attempts real hardware writes or exposes write controls.

---

### TC-05 — Import valid AJAZZ AK680 V2 profile JSON

**Acceptance criteria covered:** 3, 4, 5, 6

**Steps:**

1. Open Profile Import.
2. Import a valid AJAZZ AK680 V2 profile JSON file.
3. Confirm the app accepts the file.
4. Open Profile Inspector.
5. Confirm the app displays the profile name.
6. Confirm the app displays the device ID.
7. Confirm the app displays core device info.

**Expected result:**

* The valid profile imports successfully.
* The profile is recognized as AJAZZ AK680 V2.
* The profile name is displayed.
* The device ID `3141:32956:AJAZZ AK680 V2` is displayed.
* Core device info is displayed.

**Pass/Fail:**

* Pass if the profile imports and all required information is displayed.
* Fail if valid profile import fails or required profile/device info is missing.

---

### TC-06 — Profile validation rejects non-AK680 V2 profile

**Acceptance criteria covered:** 4

**Steps:**

1. Open Profile Import.
2. Import a structurally valid JSON profile for a different device.
3. Observe validation result.

**Expected result:**

* The app rejects the profile as not matching AJAZZ AK680 V2.
* The app does not treat it as a valid AK680 V2 profile.
* The app does not crash.

**Pass/Fail:**

* Pass if wrong-device JSON is rejected cleanly.
* Fail if wrong-device JSON is accepted as AK680 V2 or causes a crash.

---

### TC-07 — Profile Inspector displays imported profile details

**Acceptance criteria covered:** 5, 6

**Steps:**

1. Import a valid AK680 V2 profile.
2. Navigate to Profile Inspector.
3. Confirm the profile name is visible.
4. Confirm the device ID is visible.
5. Confirm core device information is visible.

**Expected result:**

Profile Inspector displays the imported profile details in read-only form.

**Pass/Fail:**

* Pass if profile details are visible and match the imported JSON.
* Fail if details are missing, incorrect, or editable as hardware settings.

---

### TC-08 — Keyboard layout renders from `keyList`

**Acceptance criteria covered:** 7

**Steps:**

1. Import a valid AK680 V2 profile JSON containing `keyList`.
2. Open the Profile Inspector or keyboard layout area.
3. Confirm a keyboard layout is rendered.
4. Confirm the layout is based on imported `keyList`.

**Expected result:**

* Keyboard layout renders from `keyList`.
* The app does not show only a static unrelated placeholder when valid `keyList` data exists.

**Pass/Fail:**

* Pass if the rendered layout reflects the imported `keyList`.
* Fail if layout does not render or ignores imported `keyList`.

---

### TC-09 — Keys with `userKey` settings are highlighted

**Acceptance criteria covered:** 8

**Steps:**

1. Import a profile JSON where some keys contain `userKey` settings.
2. Open the keyboard layout.
3. Identify keys with `userKey` settings from the JSON.
4. Confirm those keys are visually highlighted.

**Expected result:**

* Keys with `userKey` settings are highlighted.
* Keys without `userKey` settings are not incorrectly highlighted.

**Pass/Fail:**

* Pass if highlighting matches the imported profile data.
* Fail if highlighted keys are missing, incorrect, or unrelated to `userKey`.

---

### TC-10 — Lighting screen shows LED settings read-only

**Acceptance criteria covered:** 9

**Steps:**

1. Import a valid AK680 V2 profile JSON containing `ledEffect` and/or `customLedData`.
2. Open the Lighting screen.
3. Confirm LED-related settings are displayed.
4. Confirm the screen is read-only.

**Expected result:**

* LED settings are visible.
* LED data is not editable as a hardware write action.
* No RGB write action exists.

**Pass/Fail:**

* Pass if LED settings are shown read-only.
* Fail if LED settings are missing when present in JSON, or if write controls exist.

---

### TC-11 — Game mode settings are shown read-only

**Acceptance criteria covered:** 10

**Steps:**

1. Import a valid AK680 V2 profile JSON containing `gameModeInfo`.
2. Open the relevant profile/game mode display area.
3. Confirm game mode settings are displayed.
4. Confirm settings are read-only.

**Expected result:**

* Game mode settings from the profile are visible.
* No write or apply action exists.

**Pass/Fail:**

* Pass if game mode settings are displayed read-only.
* Fail if game mode settings are missing or editable as hardware writes.

---

### TC-12 — Rapid Trigger screen shows magnetic-axis summary read-only

**Acceptance criteria covered:** 11

**Steps:**

1. Import a valid AK680 V2 profile JSON containing:

   * `magneticAxisRT`
   * `magneticAxisRTConfig`
2. Open Rapid Trigger screen.
3. Confirm magnetic-axis settings summary is displayed.
4. Confirm the screen is read-only.

**Expected result:**

* Magnetic-axis settings summary is visible.
* No rapid trigger write, apply, calibration, or save-to-device action exists.

**Pass/Fail:**

* Pass if magnetic-axis summary is displayed read-only.
* Fail if the data is missing or hardware write actions exist.

---

### TC-13 — Macros screen shows macro data read-only

**Acceptance criteria covered:** Scope: Macros read-only screen

**Steps:**

1. Import a valid AK680 V2 profile JSON containing `macroDataList`.
2. Open Macros screen.
3. Confirm macro data is displayed.
4. Confirm macro data is read-only.

**Expected result:**

* Macro data from `macroDataList` is visible where present.
* No macro create, edit, save, or write-to-device action exists.

**Pass/Fail:**

* Pass if macro data is shown read-only.
* Fail if macros are missing when present in JSON, or if write/edit actions exist.

---

### TC-14 — Diagnostics page exists

**Acceptance criteria covered:** 12

**Steps:**

1. Launch the app.
2. Open Diagnostics from the sidebar.
3. Confirm the page renders.
4. Confirm it stays within read-only Work Package 1 scope.

**Expected result:**

* Diagnostics page exists.
* Page renders without crash.
* No hardware write command is exposed.

**Pass/Fail:**

* Pass if diagnostics page exists and renders.
* Fail if diagnostics page is missing or exposes out-of-scope actions.

---

### TC-15 — Local-only app state

**Acceptance criteria covered:** Scope: Local-only app state

**Steps:**

1. Launch the app.
2. Import a profile JSON.
3. Navigate between screens.
4. Confirm imported state is available locally during the session.
5. Confirm there are no cloud login, account, sync, upload, or remote storage features.

**Expected result:**

* App state is local-only.
* No cloud feature is present.

**Pass/Fail:**

* Pass if app state remains local and no cloud features exist.
* Fail if the app requires cloud login, remote sync, or upload.

---

## 4. Invalid JSON Test Cases

### IJ-01 — Empty file

**Input:**

An empty `.json` file.

**Steps:**

1. Import the empty file.
2. Observe validation behavior.

**Expected result:**

* Import is rejected.
* App does not crash.
* User receives a clear validation failure.

---

### IJ-02 — Malformed JSON

**Input example:**

```json
{
  "profileName": "Valorant (1)",
  "deviceInfo":
```

**Steps:**

1. Import malformed JSON.
2. Observe validation behavior.

**Expected result:**

* Import is rejected.
* App does not crash.
* App does not navigate to inspector as if import succeeded.

---

### IJ-03 — Valid JSON but missing required profile identity fields

**Input example:**

```json
{
  "profileName": "Valorant (1)",
  "keyList": []
}
```

**Steps:**

1. Import JSON with missing device identity information.
2. Observe validation behavior.

**Expected result:**

* App does not validate it as an AJAZZ AK680 V2 profile.
* App does not crash.

---

### IJ-04 — Valid JSON but wrong data shape for `keyList`

**Input example:**

```json
{
  "profileName": "Valorant (1)",
  "deviceInfo": {
    "deviceId": "3141:32956:AJAZZ AK680 V2"
  },
  "keyList": "not-an-array"
}
```

**Steps:**

1. Import JSON with invalid `keyList` shape.
2. Observe Profile Import and Inspector behavior.

**Expected result:**

* App handles invalid shape safely.
* App does not crash.
* Keyboard layout is not rendered from invalid `keyList`.

---

### IJ-05 — Valid JSON with unknown extra fields

**Input example:**

```json
{
  "profileName": "Valorant (1)",
  "deviceInfo": {
    "deviceId": "3141:32956:AJAZZ AK680 V2",
    "vid": 3141,
    "pid": 32956
  },
  "keyList": [],
  "unknownExtraField": {
    "example": true
  }
}
```

**Steps:**

1. Import JSON with extra unknown fields.
2. Observe validation behavior.

**Expected result:**

* App does not crash.
* Unknown extra fields do not break the profile inspector.
* App still validates the profile if required AK680 V2 identity data is valid.

---

## 5. Wrong-Device JSON Test Cases

### WD-01 — Wrong device ID

**Input example:**

```json
{
  "profileName": "Other Keyboard",
  "deviceInfo": {
    "deviceId": "0000:0000:OTHER DEVICE",
    "vid": 3141,
    "pid": 32956
  },
  "keyList": []
}
```

**Expected result:**

* App rejects the profile as not being AJAZZ AK680 V2.

---

### WD-02 — Wrong VID

**Input example:**

```json
{
  "profileName": "Wrong VID",
  "deviceInfo": {
    "deviceId": "9999:32956:AJAZZ AK680 V2",
    "vid": 9999,
    "pid": 32956
  },
  "keyList": []
}
```

**Expected result:**

* App rejects the profile as not matching the known AK680 V2 profile identity.

---

### WD-03 — Wrong PID

**Input example:**

```json
{
  "profileName": "Wrong PID",
  "deviceInfo": {
    "deviceId": "3141:99999:AJAZZ AK680 V2",
    "vid": 3141,
    "pid": 99999
  },
  "keyList": []
}
```

**Expected result:**

* App rejects the profile as not matching the known AK680 V2 profile identity.

---

### WD-04 — Correct VID/PID but wrong device name

**Input example:**

```json
{
  "profileName": "Wrong Name",
  "deviceInfo": {
    "deviceId": "3141:32956:OTHER DEVICE",
    "vid": 3141,
    "pid": 32956
  },
  "keyList": []
}
```

**Expected result:**

* App should not validate it as AJAZZ AK680 V2 if the profile identity does not match the known target keyboard.

---

## 6. UI and Navigation Checks

Check the following:

* App opens into a clean UI shell.
* Sidebar navigation is visible.
* Dashboard screen is reachable.
* Device screen is reachable.
* Profile Import screen is reachable.
* Profile Inspector screen is reachable.
* Lighting screen is reachable.
* Rapid Trigger screen is reachable.
* Macros screen is reachable.
* Diagnostics screen is reachable.
* Navigation does not crash after importing a valid profile.
* Navigation does not crash after failed import.
* No screen displays an embedded AJAZZ website.
* No screen depends on cloud login or remote account access.

Pass if all agreed screens are reachable and stable.

Fail if any required screen is missing, unreachable, crashes, or introduces out-of-scope behavior.

---

## 7. Keyboard Layout Checks

Check after importing a valid AK680 V2 profile JSON:

* Keyboard layout renders from `keyList`.
* Rendered keys correspond to imported key data.
* Keys with `userKey` settings are highlighted.
* Keys without `userKey` settings are not incorrectly highlighted.
* Empty or invalid `keyList` does not crash the app.
* Keyboard layout remains read-only.
* No key remapping write action exists.
* No save-to-device action exists.

Pass if keyboard layout reflects `keyList` and `userKey` highlighting correctly.

Fail if the layout is missing, unrelated to imported data, crashes, or exposes write actions.

---

## 8. Lighting Read-Only Checks

Check after importing a valid AK680 V2 profile JSON:

* Lighting screen exists.
* LED settings from `ledEffect` are shown where available.
* Custom LED data from `customLedData` is shown where available.
* Lighting information is presented read-only.
* No RGB write action exists.
* No apply-to-device action exists.
* No save-to-keyboard action exists.

Pass if LED settings are displayed read-only.

Fail if LED settings are missing when present in the JSON, or if hardware write controls exist.

---

## 9. Rapid Trigger Read-Only Checks

Check after importing a valid AK680 V2 profile JSON:

* Rapid Trigger screen exists.
* Magnetic-axis settings summary is displayed from:

  * `magneticAxisRT`
  * `magneticAxisRTConfig`
* Data is read-only.
* No rapid trigger write action exists.
* No calibration action exists.
* No apply-to-device action exists.
* No save-to-keyboard action exists.

Pass if magnetic-axis settings are summarized read-only.

Fail if settings are missing when present in JSON, or if write/calibration actions exist.

---

## 10. Macro Read-Only Checks

Check after importing a valid AK680 V2 profile JSON:

* Macros screen exists.
* Macro data from `macroDataList` is shown where available.
* Macro information is read-only.
* No macro creation action exists.
* No macro editing action exists.
* No macro write-to-device action exists.
* No save-to-keyboard action exists.

Pass if macro data is displayed read-only.

Fail if macro data is missing when present in JSON, or if editing/writing actions exist.

---

## 11. Safety Checks: No Hardware Writes

The red team must verify that Work Package 1 contains no hardware write commands or write-facing UI.

Check the app for:

* No real hardware write commands.
* No key remapping writes.
* No RGB writes.
* No rapid trigger writes.
* No SOCD writes.
* No macro writes.
* No firmware flashing.
* No calibration.
* No save/apply/sync-to-device action.
* No backend command that writes to the keyboard.
* No UI button that implies writing to the keyboard.
* No hidden or unused write command exposed through Tauri commands.
* No embedded AJAZZ website.
* No Electron wrapper.

Suggested audit checks:

* Review frontend UI labels for actions such as:

  * Save to device
  * Apply
  * Sync
  * Flash
  * Calibrate
  * Write
  * Remap
* Review backend command names for hardware write behavior.
* Review dependency files to confirm Electron is not included.
* Review Tauri configuration to confirm the app is Tauri-based.
* Confirm profile import only reads local JSON.
* Confirm imported profile data is displayed locally only.

Pass if no hardware write path exists.

Fail if any hardware write command, write UI, Electron wrapper, embedded AJAZZ website, firmware flashing, or calibration feature exists.

---

## 12. Documentation Checks

### DOC-01 — README.md

**Acceptance criteria covered:** 15

Check that `README.md` explains:

* What AK680 Studio is.
* That Work Package 1 is read-only.
* How to install dependencies.
* How to run the Tauri app.
* How to import a profile JSON, if documented.

Pass if README explains how to run the app.

Fail if README is missing or does not explain how to run the app.

---

### DOC-02 — PROJECT_PLAYBOOK.md

**Acceptance criteria covered:** 16

Check that `PROJECT_PLAYBOOK.md` exists or has been updated.

Pass if the file exists or is updated for the project.

Fail if it is missing and not otherwise updated.

---

### DOC-03 — CHANGELOG.md

**Acceptance criteria covered:** 17

Check that `CHANGELOG.md` includes Work Package 1 notes.

Pass if Work Package 1 changes are recorded.

Fail if changelog is missing or has no Work Package 1 entry.

---

### DOC-04 — RESEARCH_NOTES.md

**Acceptance criteria covered:** 18

Check that `RESEARCH_NOTES.md` documents assumptions and unknowns.

Expected topics may include:

* AJAZZ AK680 V2 profile structure assumptions.
* Known device ID, VID, and PID.
* Unknowns about hardware behavior.
* Confirmation that Work Package 1 is read-only.

Pass if assumptions and unknowns are documented.

Fail if the file is missing or does not document assumptions and unknowns.

---

## 13. Pass/Fail Criteria

Work Package 1 passes QA only if all of the following are true:

1. The app runs as a Tauri desktop app.
2. The app does not use Electron.
3. The app has a clean UI shell with sidebar navigation.
4. Dashboard screen exists.
5. Device screen exists and is mock/read-only.
6. User can import an AJAZZ AK680 V2 profile JSON file.
7. Profile validation confirms the profile is for AJAZZ AK680 V2.
8. Wrong-device profiles are rejected safely.
9. Invalid JSON is rejected safely.
10. Profile name is displayed.
11. Device ID is displayed.
12. Core device info is displayed.
13. Keyboard layout renders from `keyList`.
14. Keys with `userKey` settings are highlighted.
15. LED settings are shown read-only.
16. Game mode settings are shown read-only.
17. Magnetic-axis settings summary is shown read-only.
18. Macro data is shown read-only.
19. Diagnostics page exists.
20. App state remains local-only.
21. No hardware write commands exist.
22. No hardware write UI exists.
23. No firmware flashing exists.
24. No calibration exists.
25. No embedded AJAZZ website exists.
26. `README.md` explains how to run the app.
27. `PROJECT_PLAYBOOK.md` exists or is updated.
28. `CHANGELOG.md` includes Work Package 1 notes.
29. `RESEARCH_NOTES.md` documents assumptions and unknowns.

Work Package 1 fails QA if any acceptance criterion is missing, broken, or contradicted by implementation.

---

## 14. Final QA Checklist

Use this checklist during final review.

### App Foundation

* [ ] App runs as a Tauri desktop app.
* [ ] App does not use Electron.
* [ ] App does not embed the AJAZZ website.
* [ ] React + TypeScript frontend is present.
* [ ] Rust backend is present.
* [ ] Tailwind CSS styling is present.
* [ ] UI shell is clean and usable.
* [ ] Sidebar navigation exists.

### Screens

* [ ] Dashboard screen exists.
* [ ] Device screen exists.
* [ ] Profile Import screen exists.
* [ ] Profile Inspector screen exists.
* [ ] Lighting screen exists.
* [ ] Rapid Trigger screen exists.
* [ ] Macros screen exists.
* [ ] Diagnostics screen exists.

### Profile Import and Validation

* [ ] Valid AK680 V2 profile JSON imports successfully.
* [ ] Profile validation checks AJAZZ AK680 V2 identity.
* [ ] Device ID `3141:32956:AJAZZ AK680 V2` is accepted.
* [ ] VID `3141` is accepted.
* [ ] PID `32956` is accepted.
* [ ] Wrong-device JSON is rejected.
* [ ] Invalid JSON is rejected.
* [ ] App does not crash on invalid input.

### Profile Inspector

* [ ] Profile name is displayed.
* [ ] Device ID is displayed.
* [ ] Core device info is displayed.
* [ ] `keyList` data is used.
* [ ] `gameModeInfo` data is shown read-only where available.
* [ ] `ledEffect` data is shown read-only where available.
* [ ] `customLedData` data is shown read-only where available.
* [ ] `macroDataList` data is shown read-only where available.
* [ ] `magneticAxisRT` data is shown read-only where available.
* [ ] `magneticAxisRTConfig` data is shown read-only where available.

### Keyboard Layout

* [ ] Keyboard layout renders from imported `keyList`.
* [ ] Keys with `userKey` settings are highlighted.
* [ ] Keys without `userKey` settings are not incorrectly highlighted.
* [ ] Keyboard layout is read-only.
* [ ] No key remapping write action exists.

### Lighting

* [ ] LED settings are visible.
* [ ] Custom LED data is visible where available.
* [ ] Lighting screen is read-only.
* [ ] No RGB write action exists.

### Rapid Trigger

* [ ] Magnetic-axis summary is visible.
* [ ] Rapid Trigger screen is read-only.
* [ ] No rapid trigger write action exists.
* [ ] No calibration action exists.

### Macros

* [ ] Macro data is visible where available.
* [ ] Macros screen is read-only.
* [ ] No macro write action exists.
* [ ] No macro edit/create requirement has been added.

### Diagnostics

* [ ] Diagnostics page exists.
* [ ] Diagnostics page renders without crashing.
* [ ] Diagnostics page does not expose hardware writes.

### Safety

* [ ] No hardware write commands exist.
* [ ] No save-to-device action exists.
* [ ] No apply-to-device action exists.
* [ ] No sync-to-device action exists.
* [ ] No firmware flashing exists.
* [ ] No calibration exists.
* [ ] No cloud feature exists.
* [ ] App state is local-only.

### Documentation

* [ ] `README.md` explains how to run the app.
* [ ] `PROJECT_PLAYBOOK.md` exists or is updated.
* [ ] `CHANGELOG.md` includes Work Package 1 notes.
* [ ] `RESEARCH_NOTES.md` documents assumptions and unknowns.

---

## QA Verdict Template

Use this after testing:

```markdown
# QA Verdict — Work Package 1

Result: PASS / FAIL

Summary:
- 

Passed:
- 

Failed:
- 

Blockers:
- 

Notes:
- 

Confirmed out-of-scope items not present:
- Hardware writes
- Key remapping writes
- RGB writes
- Rapid trigger writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration
- Electron wrapper
- Embedded AJAZZ website
- Cloud features
```
