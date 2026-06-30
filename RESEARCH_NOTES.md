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
- WP11 adds a Protocol Evidence Guide and Candidate Query Dossier system for collecting evidence only. It does not add HID command execution, device-info query execution, HID report sends, or setting writes.
- WP11 required evidence for any future device-info query includes exact report type, report ID if applicable, request bytes/framing, expected response length/shape, target interface/path constraints, read-only justification, non-write rationale, evidence source, and GPL cleanliness statement.
- WP11 dossier statuses are limited to `draft`, `needs evidence`, `rejected`, and `ready for Red Team review`. A ready dossier does not enable command execution; future implementation still requires a separate work package and Red Team plan.
- WP12 accepted one candidate query for future implementation after evidence review: HID output report / WebHID `sendReport` equivalent, report ID `0`, exact 64-byte `AA 10 30` request, target AK680 V2 VID/PID `3141/32956`, usagePage `65384`, usage `97`, exact selected path/interface, manual confirmation only.
- WP13 implements exactly that one controlled device-info read/query. It does not implement `AA 11 38`, `AA 12 38`, `AA 13 10`, `AA 14 38`, any other official-driver connect command, retries, command scanning, fuzzing, or arbitrary command entry.
- WP13 request bytes:

```text
AA 10 30 00 00 00 01 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```

- WP13 response display is limited to status, length, hex bytes, minimal prefix parse, and observed VID/PID-like bytes. `55 10 30` is treated only as an observed expected prefix. `45 0C BC 80` may be displayed only as observed VID/PID-like bytes consistent with `VID_0C45 / PID_80BC`.
- WP13 must not infer firmware version, settings state, calibration state, layout state, memory state, profile state, or write support from response bytes.
- WP13 GPL boundary: the implementation is based on project evidence review and does not copy GPL-3.0 source code, comments, constants, structures, packet framing, or implementation material.
- WP14 adds Hardware Smoke Test and release-safety polish only. It does not add new HID commands or change the WP13 command behavior.
- WP14 hardware smoke-test recording is optional, manual, local, and observation-only. It may record status, response length, response hex prefix, observed VID/PID-like bytes when present, and notes.
- WP14 smoke-test observations must not be used to infer firmware version, settings state, calibration state, layout state, memory state, profile state, or write capability.
- WP14 does not add retries, polling, automatic execution, command scanning, fuzzing, raw command consoles, arbitrary payload input, packet editing, writes, apply/sync/save-to-device behavior, setting writes, firmware flashing, calibration, or copied GPL-3.0 material.
- WP15 adds read-protocol evidence and candidate dossier pack support only. It is evidence-only and does not add, approve, or enable any new HID command.
- WP15 candidate statuses are limited to `insufficient`, `candidate-only`, and `ready-for-future-Red-Team-review`. No status enables execution or claims settings-read support.
- WP15 validation, classification, and local JSON export are inert data operations. They do not open HID devices, send reports, query live state, retry, poll, scan, fuzz, probe, or run on import/export.
- WP15 evidence may organize future read areas such as device-info follow-up, lighting state, keymap/profile state, rapid trigger/actuation state, and SOCD/game-mode state, but no settings-read support is implemented.
- WP15 requires GPL/source-cleanliness notes and must not copy GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material.
- WP16 adds a read-only settings foundation with exactly one approved command: the existing WP13 `AA 10 30` controlled device-info read/query.
- WP16 does not approve additional WP15 candidate dossiers because the available sanitized WP15 fixture includes only an insufficient placeholder for unsupported settings areas.
- WP16 snapshots are local read-only observations and may be incomplete. Known parsed fields, unknown bytes, raw bytes, parser warnings, and confidence must remain separate.
- WP16 comparison is conservative; unsupported lighting/keymap/RT/SOCD/profile fields are not treated as writable differences.
- WP16 future write gate remains disabled and requires a separate future work package and Red Team plan.
- USB/wired mode is likely required for useful AK680 V2 HID enumeration.
- Bluetooth configuration is not supported.
- AK680 V2 is treated as proprietary HID, not QMK/VIA.
- GPL-3.0 repositories may be studied only for behavior/protocol understanding; do not copy GPL source code, comments, structures, constants, or packet code into this Apache-2.0 project.
- Native HID command framing for safe hardware writes is unknown.
- Native HID command framing for broad safe controlled reads remains unknown.
- Only the WP12-approved `AA 10 30` device-info read/query has been justified for AK680 Studio.
- Verification behavior after a hardware write is unknown.
- Backup and restore semantics for device state are unknown.
- Firmware flashing and calibration protocols are unknown and out of scope.

## Future Research Tasks

- Document the read protocol before any hardware interaction is attempted.
- Identify a safe backup format before any write feature is proposed.
- Design a Red Team plan for the smallest possible future hardware write.
- Keep the WP13 controlled read limited to the exact approved command and evaluate hardware results conservatively.
- Treat any WP14 hardware smoke-test result as a local observation only, not protocol proof beyond the exact recorded bytes/status.
- Use the WP15 read-protocol evidence pack for future read evidence without treating completeness as execution approval.
- Keep WP16 snapshot comparisons conservative until exact read evidence exists for each settings area.
- For any additional future query, document the exact report type, report ID, request bytes/framing, response length/format, timeout expectation, target interface constraints, and read-only safety rationale before implementation.
- Use the Candidate Query Dossier format to collect evidence source, GPL/source cleanliness notes, risk assessment, and reviewer notes before proposing a future query.
- Keep future read/query work manual opt-in, single-command only, path-gated, confirmed, and timeout-limited.
- Require maintainer approval before adding hardware write code.

Work Package 1 performs local JSON inspection only. Work Package 2 adds read-only HID enumeration only. Work Package 3 adds local-only profile storage, export, active selection, rename/delete, and read-only comparison. Work Package 4 hardens local-only profile library backup export/import and storage recovery. Work Package 5 prepares public alpha docs, safety messaging, templates, and check-only CI. Work Package 6 adds read-only protocol research metadata inspection and local diagnostics snapshots. Work Package 7 adds local-only profile JSON editing. Work Package 8 adds dry-run write safety planning without real packets. Work Package 9 adds a disabled controlled read experiment harness only. Work Package 10 keeps the device-info read query disabled under Outcome B because exact safe-query evidence is missing. Work Package 11 adds evidence guide and dossier tooling only. Work Package 13 adds exactly one WP12-approved controlled device-info read/query. Work Package 14 adds manual hardware smoke-test and release-safety polish without changing command behavior. Work Package 15 adds evidence-only read-protocol dossier pack support. Work Package 16 adds read-only snapshot/view/compare/future-write-gate foundation using only the existing WP13 command. Hardware writes, unknown or guessed HID command packets, keyboard configuration writes, additional command experiments, cloud sync, remote upload, databases, release publishing, and user accounts remain out of scope.
