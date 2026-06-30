# WP17 First Controlled Setting Write Evidence Plan

WP17 is evidence-only. It prepares a future WP18-or-later first controlled setting-write proposal, but it does not implement, approve, enable, or execute any setting write.

The only executable HID command remains the read-only `wp13-device-info-read` command:

- Report ID: `0`
- Request length: `64`
- Request bytes: `AA 10 30 00 00 00 01 00` followed by zeros
- Target: AK680 V2 VID `3141` / PID `32956`
- Interface: usagePage `65384` / usage `97`
- Exact selected path/interface, manual confirmation, one-shot execution, short timeout, no retries, no polling, no automatic execution

## Candidate Statuses

WP17 candidate statuses are planning labels only:

- `insufficient-evidence`
- `rejected-too-risky`
- `candidate-only`
- `ready-for-future-Red-Team-review`

No status enables execution. No status approves a write. No status bypasses the disabled future write gate.

## Risk And Reversibility

Risk scores are conservative:

- `1`: very low risk, visual-only, clearly reversible, clearly observed
- `2`: low risk, simple single setting, reversible, strong evidence
- `3`: moderate risk, persistent setting or unclear side effects
- `4`: high risk, profile-wide or unclear rollback
- `5`: unacceptable first-write risk

Reversibility scores are also conservative:

- `1`: not reversible or rollback unknown
- `2`: rollback uncertain or untested
- `3`: rollback likely but evidence incomplete
- `4`: rollback clearly documented
- `5`: rollback clearly documented and physically/verifiably testable

Low risk and high reversibility do not approve execution. A future implementation still requires a separate work package and Red Team plan.

## Required Evidence

Future candidates need exact request bytes, report ID, request length, target interface metadata, official-app user action context, mutation scope, rollback/recovery plan, pre-write backup requirements, read-back or physical verification plan, hardware-risk classification, safety rationale, unknowns, GPL/source-cleanliness statement, and future Red Team requirements.

Candidates without backup, rollback, and read-back or physical verification evidence must not be marked ready for future Red Team review.

## Blocked First-Write Categories

Full profile apply, keymap writes, macro writes, rapid trigger/actuation writes, SOCD/game-mode writes, calibration, firmware/bootloader/DFU, factory reset, persistent unknown memory writes, ambiguous commands, and commands observed near save/apply/sync/profile-switch behavior without clear safety analysis are rejected or blocked for first-write planning.

## WP17 Prohibitions

WP17 does not add writes, apply/sync/save-to-device behavior, setting writes, keymap writes, lighting writes, RT/SOCD writes, macro writes, full profile apply, firmware flashing, calibration writes, bootloader/DFU behavior, factory reset behavior, arbitrary command entry, raw command consoles, packet editors, command registry execution, retries, polling, scanning, fuzzing, brute force, probing, automatic execution, hidden hardware access, or copied GPL-3.0 implementation material.

Backup, rollback, read-back, and physical verification evidence remain planning data only.
