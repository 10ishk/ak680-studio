# WP15 Read Protocol Evidence Guide

WP15 is evidence-only. It collects and reviews local protocol evidence and candidate read-command dossiers for possible future read-only settings work. It does not add, approve, or enable any new HID command.

The only executable HID command in AK680 Studio remains the WP13 controlled device-info read/query:

- Request prefix: `AA 10 30 00 00 00 01 00`
- Report ID: `0`
- Request length: `64`
- Target: AK680 V2 VID `3141` / PID `32956`
- Interface gate: usagePage `65384` / usage `97`
- Exact selected path/interface required
- Manual confirmation, one-shot execution, short timeout, no retries, no polling, no automatic execution

## Evidence Records

Evidence records are local, reviewable JSON data. They may describe observations for future read areas such as device-info follow-up, lighting state, keymap/profile state, rapid trigger/actuation state, SOCD/game-mode state, or another clearly observed area. Evidence does not imply support.

Records should include source type, source date/time, target identity, OS/environment, report direction, report ID, request/response lengths, observed bytes when available, timing/user-action context, read/write uncertainty, reproducibility notes, safety notes, GPL/source-cleanliness notes, fixture references, and reviewer notes.

Import, validation, and export are data-only operations. They must not open HID devices, send reports, query live state, retry, poll, scan, fuzz, probe, or promote evidence into executable behavior.

## Candidate Dossiers

Dossiers are non-executable review records with one of these statuses:

- `insufficient`
- `candidate-only`
- `ready-for-future-Red-Team-review`

`ready-for-future-Red-Team-review` means the evidence may be reviewed later. It does not approve a command, enable execution, or imply settings-read support.

Each dossier should document candidate ID, title, read area, evidence references, completeness summary, target device metadata, observed report details, timing/user-action context, read-only rationale, write-risk assessment, unknowns, safety boundaries, GPL/source-cleanliness statement, reviewer notes, and future review requirements.

## Forbidden In WP15

WP15 must not add new executable HID commands, executable lighting/keymap/profile/RT/SOCD/game-mode reads, writes, apply/sync/save-to-device behavior, setting writes, raw command consoles, arbitrary command entry, packet editing, command registry execution, retries, polling, scanning, fuzzing, brute force, probing, automatic execution, settings-read support claims, write support claims, unsupported protocol inference, or copied GPL-3.0 source code/comments/constants/packet builders/structures/implementation material.

See `fixtures/wp15-read-protocol-evidence.example.json` for a sanitized local evidence pack example.
