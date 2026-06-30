# WP16 Read-Only Settings Foundation

WP16 adds the local foundation for read-only settings snapshots, viewing, comparison, and future write gating. It remains read-only from hardware.

## Approved Read-Only Command Pack

WP16 approves exactly one read-only command: the existing WP13 controlled device-info read.

| Command ID | Name | Read area | Evidence source | Report ID | Request length | Target/interface | Timeout | Parser |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `wp13-device-info-read` | WP12-approved AA 10 30 device-info read/query | Device info | WP12/WP13 accepted evidence; WP15 did not provide a qualifying additional candidate | `0` | `64` bytes | AK680 V2 VID `3141`, PID `32956`, usagePage `65384`, usage `97`, exact selected path/interface | `500ms` | Minimal prefix parser |

Exact request bytes:

```text
AA 10 30 00 00 00 01 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```

Execution constraints remain unchanged from WP13: manual confirmation, one-shot execution, short timeout, no retries, no polling, no automatic execution, no keyboard usagePage `1` / usage `6`, and no consumer-control usagePage `12` / usage `1`.

## Snapshot Model

The snapshot model stores local read-only observations:

- Source command IDs and statuses
- Raw response metadata
- Known parsed fields
- Unknown/unparsed fields
- Parser warnings and confidence
- Read-only declarations
- Write/apply/sync/save-to-device support set to false
- Safety notes and local data origin

Snapshots may be incomplete. Unknown bytes remain unknown. A snapshot is not a full device backup and does not prove firmware, settings, calibration, layout, memory, profile, or write capability.

## Compare UI

The compare view is local/read-only analysis. It uses conservative categories:

- Match
- Difference
- Unknown on device
- Unknown in profile
- Unsupported by current read-only command pack
- Parser warning
- Not comparable

Unsupported fields, such as lighting/keymap/RT/SOCD state that the approved command pack does not read, are not treated as writable differences.

## Future Write Gate

The future write gate remains disabled. Hardware writes, apply/sync/save-to-device behavior, setting writes, full profile apply, macro writes, keymap writes, lighting writes, RT/SOCD writes, firmware flashing, and calibration require a separate future work package and Red Team plan.

No raw command console, arbitrary payload input, packet editor, command registry execution, retries, polling, scanning, fuzzing, brute force, probing, or automatic execution is implemented.
