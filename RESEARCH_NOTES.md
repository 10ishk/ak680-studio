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
- WP3 local profile persistence uses browser `localStorage` in the Tauri webview.
- Saved local profile metadata includes display name, original profile name, device ID, source filename when available, created/imported timestamp, and updated timestamp.
- Exported profile backups are JSON generated from the saved raw imported profile data.
- Profile comparison is read-only and high-level; it summarizes selected sections and counts rather than editing profile data.
- Local persistence can be cleared by the user, browser storage policy, or webview storage reset.
- Corrupt local storage is handled by falling back to an empty local profile store and surfacing the storage error.
- WP4 local profile storage uses schema version `1`.
- WP4 full library backups include schema version, export timestamp, saved profiles, and active profile ID.
- Backup validation rejects invalid JSON, unsupported schema versions, missing profile arrays, and malformed saved profile records.
- Merge restore keeps existing saved profiles and rekeys imported duplicate IDs before saving.
- Replace restore requires confirmation and resets the active profile when the backup active ID is missing or invalid.
- Duplicate profile IDs are normalized before local storage or restored backup data is accepted.
- WP5 public alpha readiness is repo/UI polish only and does not change hardware capabilities.
- The project is licensed under Apache-2.0.
- Public alpha issue templates should avoid requiring users to share sensitive serial numbers, HID paths, profile data, or local file paths.
- Check-only CI is acceptable for WP5; release binary publishing remains out of scope.
- WP6 Protocol Research uses existing HID enumeration metadata only and does not open devices, send packets, probe interfaces, or read keyboard configuration through command packets.
- WP6 safe metadata includes VID, PID, path, manufacturer, product, serial when available, usage page, usage, interface number, and release number when available from `hidapi`.
- WP6 likely research interface inference is cautious and based only on read-only metadata count.
- WP6 protocol diagnostics snapshots are local JSON exports containing safe metadata, profile summaries, assumptions, and safety notes.
- WP9 Controlled Read Experiment is a disabled UI/safety harness only. Command execution is disabled pending safe justification because these research notes do not document an exact known safe AK680 V2 read/query.
- The WP9 harness requires AK680 V2 VID/PID detection and exact selected matching path/interface before any future implemented query could run, but no query command is currently implemented.
- WP9 status exports are local JSON only and may document disabled/not-implemented state without fabricating response bytes.
- WP10 selected Outcome B for the evidence-gated device-info read query. The exact safe query cannot be justified from current project research notes without guessing.
- WP10 missing evidence: exact HID report type, exact report ID if any, exact request bytes or command framing, expected response length, expected response format, and proof that the query is read/query-only rather than a keyboard setting write.
- WP10 does not add a Rust controlled-read command, Tauri controlled-read invoke, HID report send, or fake response bytes. UI, Diagnostics, and export behavior report disabled/not-implemented state.
- USB/wired mode is likely required for useful AK680 V2 HID enumeration.
- Bluetooth configuration is not supported.
- AK680 V2 is treated as proprietary HID, not QMK/VIA.
- GPL-3.0 repositories may be studied only for behavior/protocol understanding; do not copy GPL source code, comments, structures, constants, or packet code into this Apache-2.0 project.
- Native HID command framing for safe hardware writes is unknown.
- Native HID command framing for safe controlled reads is unknown.
- No exact safe HID read/query command has been justified for AK680 Studio.
- No exact safe device-info HID read/query command has been justified for AK680 Studio.
- Verification behavior after a hardware write is unknown.
- Backup and restore semantics for device state are unknown.
- Firmware flashing and calibration protocols are unknown and out of scope.

## Future Research Tasks

- Document the read protocol before any hardware interaction is attempted.
- Identify a safe backup format before any write feature is proposed.
- Design a Red Team plan for the smallest possible future hardware write.
- Identify and document one exact safe read/query command before enabling any controlled command execution.
- For a future device-info query, document the exact report type, report ID, request bytes/framing, response length/format, timeout expectation, target interface constraints, and read-only safety rationale before implementation.
- Keep future read/query work manual opt-in, single-command only, path-gated, confirmed, and timeout-limited.
- Require maintainer approval before adding hardware write code.

Work Package 1 performs local JSON inspection only. Work Package 2 adds read-only HID enumeration only. Work Package 3 adds local-only profile storage, export, active selection, rename/delete, and read-only comparison. Work Package 4 hardens local-only profile library backup export/import and storage recovery. Work Package 5 prepares public alpha docs, safety messaging, templates, and check-only CI. Work Package 6 adds read-only protocol research metadata inspection and local diagnostics snapshots. Work Package 7 adds local-only profile JSON editing. Work Package 8 adds dry-run write safety planning without real packets. Work Package 9 adds a disabled controlled read experiment harness only. Work Package 10 keeps the device-info read query disabled under Outcome B because exact safe-query evidence is missing. Hardware writes, unknown or guessed HID command packets, keyboard configuration reads/writes, cloud sync, remote upload, databases, release publishing, and user accounts remain out of scope.
