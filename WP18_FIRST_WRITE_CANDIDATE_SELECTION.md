# WP18 First Controlled Setting Write Candidate Selection

WP18 is candidate-selection only. It reviews WP17 first-write evidence and records either Outcome A or Outcome B.

WP18 does not implement, approve, enable, or execute any setting write.

## Current Outcome

Outcome A is selected for the current WP17 evidence pack: no candidate is selected for future implementation.

Reasons:

- The current visual lighting placeholder has no exact request bytes.
- Report ID and request length are missing.
- Mutation scope is unknown.
- Risk score is `5`, which is unacceptable for Outcome B.
- Reversibility score is `1`, which is too low for Outcome B.
- Backup evidence is missing.
- Rollback evidence is missing.
- Read-back evidence is missing.
- Physical verification evidence is incomplete.
- The keymap candidate is explicitly rejected as too risky for a first write.

## Outcome Definitions

Outcome A means no candidate is selected. No write command is approved, no write support is implemented, the future write gate remains disabled, and additional evidence is required before any future implementation package.

Outcome B would mean exactly one candidate is selected for future work-package review only. Outcome B is not execution approval and does not unlock writing.

## Selection Rules

Outcome B requires all of the following:

- Exactly one selected candidate.
- Exact request bytes.
- Report ID.
- Request length.
- Target device identity for AJAZZ AK680 V2.
- VID/PID `3141 / 32956`.
- Required interface metadata.
- Exact selected path/interface behavior.
- Expected response or acknowledgement.
- Risk score `1` or `2`.
- Reversibility score `4` or `5`.
- Hardware-risk classification `visual-only-low-risk` or `single-setting-low-risk`.
- Visual-only or single-setting mutation scope.
- Backup evidence.
- Rollback evidence.
- Read-back or physical verification evidence.
- GPL/source-cleanliness confirmation.
- Future implementation constraints.
- Future Red Team review requirements.

## Non-Execution Statuses

WP18 selection statuses are:

- `not-selected`
- `rejected-insufficient-evidence`
- `rejected-too-risky`
- `rejected-not-first-write-appropriate`
- `selected-for-future-WP-review`

All statuses are non-executable. `selected-for-future-WP-review` does not approve implementation or execution.

## Preserved Executable Boundary

The only currently approved executable HID command remains the WP13/WP16 read-only `wp13-device-info-read` command:

```text
AA 10 30 00 00 00 01 00 followed by zeros to 64 bytes
```

It remains report ID `0`, request length `64`, AK680 V2 VID/PID `3141 / 32956`, usagePage `65384`, usage `97`, exact selected path/interface, manual confirmation, one-shot, short timeout, no retries, no polling, and no automatic execution.

## Explicit Prohibitions

WP18 does not add writes, apply/sync/save-to-device behavior, setting writes, keymap writes, lighting writes, RT/SOCD writes, macro writes, profile writes, firmware flashing, calibration writes, arbitrary command entry, raw command consoles, packet editors, command registry execution, retries, polling, scanning, fuzzing, brute force, probing, automatic execution, hidden follow-up commands, or copied GPL-3.0 implementation material.

Future write execution requires a separate work package and Red Team plan.
