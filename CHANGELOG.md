# Changelog

## Unreleased - Work Package 22

- Added Functional Lighting Pack for AK680 V2 global lighting writes using the approved `AA 23 10` packet family.
- Added a narrow backend `run_functional_lighting_write` command with the same AK680 V2 VID/PID, exact path/interface, usagePage `65384`, usage `97`, report ID `0`, 64-byte packet, keyboard-interface block, and consumer-control-interface block gates.
- Added packet builder support where only color mode/effect, red, green, blue, brightness, speed, and direction bytes can vary.
- Added Lighting UI controls for RGB color, brightness, speed, direction, color mode/effect, generated packet preview, manual confirmation, final confirmation, result display, and local evidence export.
- Preserved the WP21 fixed-packet experiment and WP20 dry-run planner without converting either into generic execution.
- Added Rust and TypeScript tests for packet length, report ID, target metadata, RGB/brightness/speed/direction encoding, out-of-range rejection, command-family enforcement, interface gates, confirmation gates, no retry/polling/follow-up behavior, evidence redaction, and unchanged WP13/WP20/WP21 boundaries.
- Passed Red Team QA for Work Package 22 with no blockers.

Known limitations:

- WP22 supports only the observed global lighting `AA 23 10` packet family.
- WP22 does not add arbitrary packet input, raw command console, packet editor, command registry execution, apply/sync/save-to-device behavior, RT/SOCD/keymap/macro/profile/firmware/calibration writes, retries, polling, probing, hidden follow-up packets, or automatic rollback.
- Raw WebHID logs, research dumps, private traces, scratch files, serials, tokens, secrets, and local paths remain uncommitted.

## Unreleased - Work Package 21

- Added the WP21 Experimental One-Shot Lighting Write as the first controlled real hardware-write experiment.
- Added exactly one Rust/Tauri write command for one fixed AK680 V2 lighting packet only.
- Added backend validation for non-empty selected path, current HID metadata path existence, VID/PID `3141 / 32956`, usagePage `65384`, usage `97`, report ID `0`, 64-byte packet length, exact packet bytes, keyboard-interface blocking, consumer-control-interface blocking, and metadata mismatch blocking.
- Added Lighting UI for exact packet review, target metadata, selected interface metadata, manual checkbox confirmation, final confirmation dialog, warnings, result status, attempt/retry/follow-up counts, physical verification reminder, and local sanitized evidence export.
- Added Diagnostics status for WP21 command scope, gating, write attempt count, retry count zero, follow-up packet count zero, and unsupported full lighting/profile/apply behavior.
- Added TypeScript and Rust tests for exact packet bytes, report ID, packet length, VID/PID gates, usage gates, blocked keyboard/consumer-control interfaces, selected path gates, manual confirmation, canceled result behavior, one-shot attempt counts, no retries, no polling/follow-up, evidence export shape, WP13/WP16 boundary preservation, and WP20 dry-run non-execution.
- Updated README.md and CHANGELOG.md with WP21 scope and limitations.
- Passed Red Team QA for Work Package 21 with no blockers.

Known limitations:

- WP21 is not general lighting support, profile write support, apply/sync/save-to-device behavior, RGB editing-to-device, rollback support, a raw command console, arbitrary payload entry, packet editor, or command registry execution.
- Exactly one fixed packet is executable: `AA 23 10 00 00 00 01 00 01 FF 00 00 FF 00 00 00 00 05 03 00 00 00 AA 55` followed by zeros to 64 bytes.
- One user action can attempt at most one HID write. Retries, polling, probing, hidden follow-up packets, automatic repeated writes, and automatic rollback packets are not implemented.
- Packet bytes do not come from user input, imported profile data, RGB controls, fixtures, or the WP20 dry-run planner.
- WP13/WP16 read-only command behavior remains unchanged.
- WP20 dry-run planning remains intact and non-executable.
- Raw WebHID logs, research dumps, private traces, scratch files, serials, tokens, secrets, and local paths remain uncommitted.

## Unreleased - Work Package 20

- Added a local-only Lighting Write Candidate Dry-Run Planner for a possible future first controlled global/static lighting write candidate.
- Added TypeScript planner helpers for AK680 V2 target metadata, report ID `0`, 64-byte report metadata, source `ledEffect` data, sanitized preview bytes, warnings, disabled execution state, and future WP21 checklist items.
- Added Lighting and Diagnostics UI sections that show the dry-run preview as non-executable local planning data.
- Added a sanitized WP20 example export fixture.
- Added frontend tests for preview length, report ID, target metadata, RGB byte indexes, out-of-range value handling, missing lighting warnings, disabled execution, no-HID export shape, and unchanged WP13/WP16 read-only command boundary.
- Updated README.md and CHANGELOG.md with WP20 scope and limitations.
- Passed Red Team QA for Work Package 20 with no blockers.

Known limitations:

- WP20 is dry-run planning only.
- WP20 does not add an executable HID command, Tauri write command, lighting write execution, apply/sync/save-to-device behavior, retries, polling, scanning, fuzzing, probing, raw command console, arbitrary payload input, packet editor, command registry execution, or hidden follow-up command.
- WP20 does not weaken the WP13/WP16 read-only command gates.
- The preview bytes are sanitized local planning data, not approved executable HID protocol.
- Future real lighting-write work requires a separate work package and Red Team plan.
- Raw WebHID logs, research dumps, private traces, scratch files, serials, tokens, secrets, and local paths remain uncommitted.

## Unreleased - Work Package 19

- Added official AJAZZ AK680 V2 profile model helpers for local-only imported profile inspection.
- Added summaries for `deviceId`, `profileName`, `deviceInfo`, `keyList`, `gameModeInfo`, `ledEffect`, `customLedData`, `macroDataList`, `magneticAxisRT`, `magneticAxisRTConfig`, and `magneticAxisDKS`.
- Added SOCD detection from `keyList` entries where `userKey.page === "SOCD"`.
- Added active RT/actuation detection from non-default `magneticAxisRT` and `magneticAxisRTConfig` records, with mapping to `keyList.value` where possible.
- Added lighting, custom LED, game-mode, official-section warning, and local-only safety summaries in the app UI.
- Added a compact sanitized official-profile fixture and frontend tests for parser/validator behavior, SOCD detection, RT mapping, lighting parsing, game-mode parsing, key layout import, and warning behavior.
- Updated README.md and CHANGELOG.md with WP19 local profile-model scope.
- Passed Red Team QA for Work Package 19 with no blockers.

Known limitations:

- WP19 is local profile-model integration only.
- WP19 does not add hardware writes, new HID commands, apply/sync/save-to-device behavior, lighting writes, actuation/RT writes, SOCD writes, keymap writes, macro writes, profile apply, raw command console, arbitrary payload entry, packet editor, or command registry execution.
- WP19 does not weaken the WP13/WP16 read-only command boundary.
- Import, view, validation, and export remain local and do not touch HID devices.
- WebHID logs, research dumps, private traces, scratch files, serials, tokens, secrets, and local paths remain uncommitted.

## Unreleased - Work Package 18

- Added First Controlled Setting Write Candidate Selection as a candidate-selection-only package.
- Added inert TypeScript models for Outcome A, Outcome B, candidate selection records, selection statuses, review results, export shape, and safety notes.
- Added selection statuses: `not-selected`, `rejected-insufficient-evidence`, `rejected-too-risky`, `rejected-not-first-write-appropriate`, and `selected-for-future-WP-review`.
- Added review logic for WP17 first-write evidence, including one-candidate maximum, risk/reversibility thresholds, hardware-risk checks, mutation-scope checks, backup/rollback checks, read-back or physical verification checks, GPL/source-cleanliness checks, and suspicious executable-field rejection.
- Recorded Outcome A for the current WP17 evidence: no candidate is selected for future implementation.
- Added Protocol Research and Diagnostics UI sections for WP18 candidate-selection status, Outcome A rationale, candidate rejection table, local export, and safety boundaries.
- Added a sanitized WP18 guide and fixture for local candidate-selection review export.
- Updated README.md, PROJECT_PLAYBOOK.md, and RESEARCH_NOTES.md with WP18 scope, Outcome A, Outcome B thresholds, and future-work requirements.
- Added frontend tests for Outcome A, synthetic Outcome B, multiple-selection rejection, non-execution, risk/reversibility thresholds, backup/rollback requirements, read-back/physical verification requirements, suspicious executable-field rejection, inert export/import, disabled future write gate, and WP13/WP16 boundary preservation.
- Passed Red Team QA for Work Package 18 with no blockers.

Known limitations:

- WP18 is candidate-selection only.
- WP18 selected Outcome A.
- WP18 selected zero candidates.
- WP18 does not implement, approve, enable, or execute any write command.
- WP18 does not implement write support.
- WP18 does not add apply/sync/save-to-device behavior or setting/keymap/lighting/RT/SOCD/macro/profile/firmware/calibration write execution.
- WP18 does not add arbitrary command entry, raw command console, packet editor, command registry execution, retries, polling, scanning, fuzzing, brute force, probing, automatic execution, or hidden follow-up commands.
- WP18 does not weaken the WP13/WP16 read-only command boundary.
- WP13/WP16 read-only command behavior remains unchanged.
- Candidate-selection records are non-executable, and candidate selection does not enable execution.
- Backup, rollback, read-back, and physical verification evidence remain planning data only.
- The future write gate remains disabled and requires a separate work package and Red Team plan.
- No unsupported inference or copied GPL-3.0 material is included.

## Unreleased - Work Package 17

- Added the First Controlled Setting Write Evidence Plan as an evidence-only planning package.
- Added inert TypeScript models for first-write evidence records, candidate dossiers, validation results, risk scoring, reversibility scoring, hardware-risk classification, export shape, and disabled write-readiness checklist state.
- Added non-execution candidate statuses: `insufficient-evidence`, `rejected-too-risky`, `candidate-only`, and `ready-for-future-Red-Team-review`.
- Added validation for required write-evidence fields, suspicious executable-looking fields, GPL/source-cleanliness statements, backup requirements, rollback requirements, read-back verification, physical verification, and conservative status classification.
- Added Protocol Research and Diagnostics UI sections for WP17 evidence review, local JSON export, disabled write-readiness checklist, and first-write safety status.
- Added a sanitized WP17 guide and fixture for future evidence collection.
- Updated README.md, PROJECT_PLAYBOOK.md, and RESEARCH_NOTES.md with WP17 scope, safety limits, scoring behavior, and future-work requirements.
- Added frontend tests for WP13/WP16 boundary preservation, evidence-only exports, candidate classification, blocked categories, executable-field rejection, disabled checklist behavior, and safety wording.
- Passed Red Team QA for Work Package 17 with no blockers.

Known limitations:

- WP17 is evidence-only.
- WP17 does not implement, approve, enable, or execute any setting write.
- WP17 did not add apply, sync, save-to-device, keymap write, lighting write, RT write, SOCD write, macro write, profile write, firmware flashing, calibration, or other write execution.
- WP17 does not change WP13 command behavior and does not add any new HID command.
- WP17 did not weaken the WP13/WP16 read-only command boundary.
- Candidate records are non-executable.
- Candidate readiness and evidence completeness do not enable execution.
- Backup, rollback, read-back, and physical verification evidence remain planning data only.
- The future write gate remains disabled and requires a separate work package and Red Team plan.
- No write support, first-write support approval, settings-write support, raw command console, arbitrary command entry, packet editor, command registry execution, retries, polling, scanning, fuzzing, brute force, probing, automatic execution, hidden follow-up command, unsupported inference, or copied GPL-3.0 material is included.

## Unreleased - Work Package 16

- Added a read-only settings foundation pack using exactly the existing WP13 controlled device-info read as the only approved command.
- Added an approved read-only command model with pinned report ID, request length, request bytes, target identity, interface gate, timeout, parser status, known/unknown fields, and safety rationale.
- Added a local read-only device snapshot model with raw response metadata, known parsed fields, unknown fields, parser warnings, confidence, safety notes, and local JSON export.
- Added a Protocol Research snapshot viewer, conservative snapshot/profile compare UI, and disabled future write gate.
- Added Diagnostics status for approved command count, command IDs, WP13 boundary, manual confirmation, retry count zero, polling/automatic execution disabled, snapshot/compare status, and disabled future write gate.
- Added WP16 guide and tests for command constants, parser known/unknown separation, invalid responses, snapshot shape/export inertness, conservative compare behavior, and disabled future write gate.
- Updated README.md, PROJECT_PLAYBOOK.md, and RESEARCH_NOTES.md with WP16 scope, approved command table, snapshot/compare limits, and future write requirements.
- Passed Red Team QA for Work Package 16 with no blockers.

Known limitations:

- WP16 approved exactly one read-only command: `wp13-device-info-read`.
- No additional WP15 candidate was promoted into execution.
- WP13 command behavior remains unchanged.
- Snapshot/viewer/compare/editor/diff/backup/import/export features are local/read-only and do not trigger hidden HID access.
- The future write gate remains disabled and requires a separate work package and Red Team plan.
- WP16 approves no new HID commands beyond the existing WP13 `AA 10 30` controlled read.
- The available WP15 evidence pack does not qualify additional read commands.
- Snapshot data is incomplete and must not be treated as full settings-read support, full profile state, backup/restore coverage, firmware state, calibration state, memory state, or write capability.
- Future writes, apply/sync/save-to-device behavior, setting writes, full profile apply, macro/keymap/lighting/RT/SOCD writes, retries, polling, scanning, fuzzing, probing, automatic execution, raw command console, arbitrary payload input, packet editing, command registry execution, firmware flashing, calibration, unsupported inference, and copied GPL-3.0 material are not included.

## Unreleased - Work Package 15

- Added a local read-protocol evidence pack model for future read-only settings research.
- Added candidate read dossier models with non-executable statuses: `insufficient`, `candidate-only`, and `ready-for-future-Red-Team-review`.
- Added validation, completeness scoring, local export shape, executable-field rejection, byte evidence parsing, and inert classification logic.
- Added Protocol Research and Diagnostics UI sections for WP15 evidence-only review.
- Added a sanitized example evidence fixture and WP15 read protocol evidence guide.
- Updated README.md, PROJECT_PLAYBOOK.md, and RESEARCH_NOTES.md with WP15 scope, current WP13 command boundary, GPL/source-cleanliness requirements, and future-work limits.
- Added frontend tests for validation, classification, export shape, malformed evidence, suspicious executable-looking fields, GPL/source-cleanliness wording, and unchanged WP13 constants.
- Passed Red Team QA for Work Package 15 with no blockers.

Known limitations:

- WP15 is evidence-only.
- WP15 does not implement settings reads, write support, new HID commands, command approval, or additional protocol execution.
- WP15 did not add, approve, enable, or imply any new HID command.
- Candidate readiness, including `ready-for-future-Red-Team-review`, is only for possible future Red Team review and does not enable execution.
- Future command execution requires a separate work package and Red Team plan.
- Validation, classification, and local export are inert data operations and do not touch HID devices.
- No writes, apply/sync/save-to-device behavior, retries, polling, scanning, fuzzing, probing, raw command console, arbitrary payload input, packet editing, command registry execution, firmware flashing, calibration, unsupported inference, or copied GPL-3.0 material are included.

## Unreleased - Work Package 14

- Added Hardware Smoke Test and release-safety polish without changing WP13 command behavior.
- Added a manual optional hardware smoke-test checklist under Protocol Research.
- Added a local smoke-test observation template export for recording status, response length, response hex prefix, observed VID/PID-like bytes when present, and notes.
- Updated Diagnostics with WP14 smoke-test/release-safety status.
- Updated README.md, PROJECT_PLAYBOOK.md, and RESEARCH_NOTES.md with WP14 scope and observation-only guidance.
- Added frontend tests for unchanged WP13 command scope, smoke-test template shape, and safety wording.
- Passed Red Team QA for Work Package 14 with no blockers.

Known limitations:

- Hardware smoke testing remains optional and manual; this implementation does not record a physical AK680 V2 success-path result unless a user performs the checklist.
- Red Team did not independently perform a physical AK680 V2 success-path smoke test.
- Smoke-test observations must not be treated as proof of firmware version, settings state, calibration state, layout state, memory state, profile state, or write capability.
- No new HID commands, command behavior changes, writes, apply/sync/save-to-device behavior, retries, polling, scanning, fuzzing, raw command console, arbitrary payload input, packet editing, firmware flashing, calibration, or copied GPL-3.0 material are included.

## Unreleased - Work Package 13

- Implemented exactly one controlled device-info read/query using the existing Controlled Read Experiment harness.
- Added the WP12-approved `AA 10 30` request only, with report ID `0` and 64 request bytes.
- Added a Rust/Tauri controlled-read command with backend VID/PID, selected path, usagePage, and usage gating.
- Added manual confirmation before execution, one-shot/no-retry behavior, short timeout handling, and structured success/blocked/canceled/timeout/error results.
- Added safe response display and export with status, response length, hex bytes, minimal prefix parse, and observed VID/PID-like bytes only.
- Updated Diagnostics with controlled-read implementation status, command scope, report ID, request length, no-retry status, and safety boundaries.
- Updated README.md, PROJECT_PLAYBOOK.md, RESEARCH_NOTES.md, and protocol assumptions with WP13 scope and WP12 evidence basis.
- Added frontend and Rust tests for exact bytes, report ID, request length, gates, cancellation, response formatting, export shape, and no-execution alternatives.
- Passed Red Team targeted re-check and was accepted for Work Package 13.

Known limitations:

- WP13 implements only the `AA 10 30` device-info read/query and no other command.
- Physical AK680 V2 success-path smoke test was not independently verified by Red Team.
- No firmware/settings/calibration/layout/memory/profile inference is made from response bytes.
- No setting writes, apply/sync/save-to-device behavior, keymap/RGB/RT/SOCD/macro writes, firmware flashing, calibration, unknown or guessed HID commands, other official-driver connect commands, retries, fuzzing, scanning, background polling, cloud sync, remote upload, database services, release publishing, or user accounts are included.

## Unreleased - Work Package 11

- Added a Protocol Evidence Guide under Protocol Research.
- Added a Candidate Query Dossier template and local example dossier JSON export.
- Added dossier validation/completeness logic for required report details, expected response, read-only/non-write rationale, GPL/source cleanliness notes, and allowed non-execution statuses.
- Updated Controlled Read Experiment copy to point to the evidence guide while keeping execution disabled.
- Updated Diagnostics with protocol evidence status.
- Updated RESEARCH_NOTES.md, README.md, and PROJECT_PLAYBOOK.md with WP11 evidence-only scope and safety boundaries.
- Added pure helper tests for dossier validation, completeness, allowed statuses, export shape, and no-execution guarantees.
- Passed Red Team QA for Work Package 11.

Known limitations:

- WP11 is evidence-only and does not implement HID command execution or device-info query execution.
- Dossier readiness means ready for Red Team review only; it does not enable execution.
- No HID report sends, keyboard setting writes, apply/sync/save-to-device behavior, unknown or guessed HID commands, fuzzing, brute forcing, command scanning, background polling, firmware flashing, calibration, cloud sync, remote upload, database services, release publishing, or user accounts are included.

## Unreleased - Work Package 10

- Selected Outcome B for the evidence-gated device-info read/query because current project research notes do not justify one exact safe query.
- Kept command execution disabled/not implemented.
- Added missing-evidence reporting for exact HID report type, report ID, request bytes/framing, expected response length/format, and read-only safety proof.
- Updated Controlled Read Experiment UI, Diagnostics, and local status export to report WP10 disabled state honestly.
- Added export fields confirming no Rust controlled-read command, no Tauri controlled-read invoke, no HID report send, and no fake response bytes.
- Updated RESEARCH_NOTES.md, README.md, and PROJECT_PLAYBOOK.md with WP10 Outcome B scope and GPL boundary.
- Added pure helper tests for Outcome B identity, disabled gates, missing evidence, and export shape.
- Passed Red Team QA for Work Package 10.

Known limitations:

- No device-info HID read/query command is implemented in WP10.
- Command execution remains disabled pending exact safe-query evidence.
- No keyboard setting writes, apply/sync/save-to-device behavior, unknown or guessed HID commands, fuzzing, brute forcing, command scanning, background polling, firmware flashing, calibration, cloud sync, remote upload, database services, release publishing, or user accounts are included.

## Unreleased - Work Package 9

- Added a Controlled Read Experiment section under Protocol Research.
- Implemented harness-only disabled state because current project research notes do not justify an exact safe AK680 V2 read/query command.
- Added AK680 V2 VID/PID detection and exact selected matching path/interface gates.
- Added experimental read/query-only warning copy covering disabled execution, USB/wired mode, no setting changes, no automatic execution, and no unplugging during any future experiment.
- Added disabled/not-implemented run state and local JSON export of controlled read status/result.
- Added safe status/result display with status, timestamp, response length, hex bytes where applicable, and message.
- Updated Diagnostics with controlled read experiment status.
- Updated RESEARCH_NOTES.md, README.md, and PROJECT_PLAYBOOK.md with WP9 disabled-harness scope and safety boundaries.
- Added pure helper tests for gating, selected path/interface requirement, disabled state, hex formatting, and export shape.
- Passed Red Team QA for Work Package 9.

Known limitations:

- No HID read/query command is implemented in WP9.
- Command execution remains disabled pending safe query justification.
- No keyboard setting writes, apply/sync/save-to-device behavior, unknown HID commands, fuzzing, brute forcing, command scanning, background polling, firmware flashing, calibration, cloud sync, remote upload, database services, release publishing, or user accounts are included.

## Unreleased - Work Package 8

- Added a Write Safety / Dry-Run Planner screen for future hardware-write planning without sending anything to the keyboard.
- Added valid WP7 edited local profile input handling, including no-input, invalid, no-change, and ready states.
- Added original/source vs edited profile summaries.
- Added abstract operation summaries for keymap, RT/actuation, SOCD/game-mode, lighting, and macro preservation status.
- Added backup-before-write future safety gate messaging.
- Added device compatibility and safety checklist covering VID/PID detection, likely HID interface status, profile identity, edited profile validation, backup requirement, hardware write support status, and no-packets-sent status.
- Added local dry-run plan JSON export with timestamp, validation, abstract operations, safety checklist, protocol assumptions, and explicit no-packets-sent statement.
- Added disabled blocked execution state for future hardware writes marked `Not implemented`.
- Updated Diagnostics with dry-run planner status.
- Added pure helper tests for dry-run no-input/invalid/no-change/ready states, abstract operations, checklist generation, export shape, and editor-state mutation isolation.
- Updated README.md and PROJECT_PLAYBOOK.md with WP8 dry-run scope and safety boundaries.
- Passed Red Team QA for Work Package 8.

Known limitations:

- WP8 plans and previews only; it cannot execute hardware writes.
- Dry-run operations are abstract summaries, not real HID packets or device commands.
- Backup-before-write is represented as a future safety gate only and does not unlock writing.
- No hardware writes, HID writes, real HID packets, unknown HID command packets, keyboard configuration reads/writes, apply/sync/save-to-device behavior, firmware flashing, calibration, cloud sync, remote upload, database services, release publishing, or user accounts are included.

## Unreleased - Work Package 7

- Added a Local Editor screen for imported or saved AK680 V2 profile JSON.
- Added deep-cloned edit sessions so original imported/saved profile data is preserved until explicit local export/save/update.
- Added local-only keymap assignment-name editing, RT/actuation editing, SOCD/game-mode editing, and lighting editing where matching profile sections exist.
- Added edited-vs-original summaries, validation before local export/save/update, edited JSON export, save-as-new local profile, confirmed update of existing saved local profiles, and discard/reset edits.
- Preserved `macroDataList` exactly; macro editing is not implemented in WP7.
- Updated Diagnostics with local editor status.
- Added pure helper tests for editor cloning, mutation isolation, diffing, validation, macro preservation, and edited export shape.
- Updated README.md and PROJECT_PLAYBOOK.md with WP7 local-editor scope and safety boundaries.
- Passed Red Team QA for Work Package 7.

Known limitations:

- The Local Editor changes profile JSON only; it does not apply, sync, or save anything to keyboard hardware.
- Only selected high-level fields are exposed in the local editor UI.
- Macro editing is not implemented.
- No hardware writes, HID writes, unknown HID command packets, keyboard configuration reads/writes, apply/sync/save-to-device behavior, firmware flashing, calibration, cloud sync, remote upload, database services, release publishing, or user accounts are included.

## Unreleased - Work Package 6

- Added a read-only Protocol Research screen for safe AK680 V2 HID metadata inspection.
- Added display of matching AK680 V2 HID interfaces/paths and optional HID metadata including usage page, usage, interface number, and release number where available.
- Added cautious likely-research-interface labeling only when it can be inferred from read-only metadata count.
- Added local protocol diagnostics snapshot export as JSON.
- Updated Diagnostics with protocol research status and no-unknown-command-packet safety status.
- Added pure helper tests for matching interface filtering, missing metadata formatting, cautious interface inference, and snapshot generation.
- Updated README.md, PROJECT_PLAYBOOK.md, and RESEARCH_NOTES.md with WP6 protocol assumptions and GPL behavior-only warnings.
- Passed Red Team QA for Work Package 6.

Known limitations:

- Protocol Research uses existing HID enumeration metadata only.
- No hardware writes, HID writes, unknown HID command packets, keyboard configuration reads/writes, apply/sync/save-to-device behavior, editors, firmware flashing, calibration, cloud sync, remote upload, database services, release publishing, or user accounts are included.
- Likely research interface is not inferred when multiple matching interfaces are present.

## Unreleased - Work Package 5

- Added public alpha safety messaging in-app.
- Added an About screen with unofficial status, local-only behavior, read-only HID detection, and no-hardware-write status.
- Improved Dashboard, Device, Profiles, and Diagnostics copy for public alpha users.
- Improved README structure with current capabilities, setup, checks, screenshot instructions, issue reporting, contribution guidance, security guidance, and safety exclusions.
- Added GitHub issue templates for bug reports, feature requests, and device detection reports.
- Added a pull request template with test, docs, and safety checklist items.
- Documented that GitHub Actions CI is skipped until a maintainer with `workflow` OAuth scope can add the check-only workflow.
- Updated CONTRIBUTING.md with safe hardware/protocol contribution guidance.
- Updated SECURITY.md with hardware safety and responsible disclosure guidance.
- Changed the project license from MIT to Apache-2.0.
- Added license transition guidance: earlier versions of this project may have been distributed under MIT. Starting from this WP5 license update, current and future versions are licensed under Apache-2.0.
- Documented that GPL-3.0 research repositories must not be copied and may be used only for behavioral/protocol research unless the whole project is explicitly relicensed later.
- Passed Red Team re-check for Work Package 5 after stale visible WP4 UI copy was replaced with public-alpha wording.

Known limitations:

- Screenshots are documented as instructions/placeholders and are not committed yet.
- CI is not committed yet because the current GitHub authentication cannot push workflow files without `workflow` scope. Future CI should be check-only and must not publish release binaries or installer artifacts.
- No hardware writes, HID writes, keyboard configuration reads/writes, apply/sync/save-to-device behavior, editors, cloud sync, remote upload, database services, release publishing, or user accounts are included.

## Unreleased - Work Package 4

- Added local profile storage schema versioning.
- Added full saved-profile library backup export as JSON.
- Added full saved-profile library backup import/restore with backup shape validation.
- Added merge restore mode with safe duplicate profile ID handling.
- Added confirmed replace restore mode with safe active profile reset behavior.
- Added graceful recovery from corrupt or incompatible local profile storage.
- Improved local import/export success and error messages.
- Updated Diagnostics with schema version, storage health, and last backup/import status.
- Added pure helper tests for backup validation, merge/replace restore behavior, duplicate handling, and corrupt/incompatible storage handling.
- Passed Red Team source/docs QA for Work Package 4. Red Team did not independently run local build/test commands.

Known limitations:

- Backup import/export remains local-only and depends on Tauri webview browser storage.
- Replace restore affects only the saved local profile library after confirmation.
- No hardware writes, HID writes, keyboard configuration reads/writes, apply/sync/save-to-device behavior, editors, cloud sync, remote upload, database services, or user accounts are included.

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
