# AK680 Studio

AK680 Studio is an unofficial, open-source native desktop app for inspecting AJAZZ AK680 V2 profile exports, detecting the target keyboard locally, and managing saved local profile backups. Work Package 4 hardens local profile library backup and restore behavior while preserving the Work Package 1 profile inspector, Work Package 2 read-only HID detection, and Work Package 3 local profile manager.

This project is not affiliated with, endorsed by, or maintained by AJAZZ. The official vendor tooling remains the supported configuration path until native hardware-write behavior is researched, documented, and reviewed in a future work package.

## Tech Stack

- Tauri v2
- Rust backend with read-only HID enumeration
- React
- TypeScript
- Tailwind CSS
- Local-only browser state and localStorage profile persistence

## Setup

Install prerequisites:

- Node.js and npm
- Rust and Cargo
- Tauri system dependencies for your operating system

Install project dependencies:

```bash
npm install
```

Run the native desktop app locally:

```bash
npm run tauri dev
```

Run frontend checks:

```bash
npm run lint
npm run build
```

Run the Rust check:

```bash
cd src-tauri
cargo check
```

Run Rust tests:

```bash
cd src-tauri
cargo test
```

## Work Package 1 Scope

Included:

- Native Tauri app shell with sidebar navigation
- Dashboard, Device, Profile Import, Profile Inspector, Keyboard Layout, Lighting, Rapid Trigger, Macros, and Diagnostics screens
- Local AJAZZ profile JSON import
- AK680 V2 profile validation
- Read-only profile, lighting, game mode, macro, and magnetic-axis summaries
- Keyboard layout rendering from `keyList`
- Sample fixture at `fixtures/ak680-profile.sample.json`

## Work Package 2 Scope

Included:

- Read-only HID enumeration through the Rust backend.
- Device screen refresh detection action.
- AK680 V2 target matching by VID `3141` and PID `32956`.
- Safe metadata display for enumerated HID devices.
- Diagnostics status for last HID detection result.
- Practical Rust tests for target matching logic.

Notes:

- USB/wired mode may be required for the keyboard to appear as a HID device.
- OS permissions can affect HID enumeration.
- Detection is local and read-only.

## Work Package 3 Scope

Included:

- Local profile manager backed by browser `localStorage`.
- Save imported valid AK680 V2 profiles locally.
- List saved local profiles.
- Select an active local profile.
- Rename saved profile display names.
- Delete saved profiles with confirmation.
- Export saved profiles as JSON backups.
- Show source filename and created/imported/updated timestamps.
- Read-only high-level comparison between two saved profiles.
- Diagnostics storage status.

Notes:

- Saved profiles remain on this machine only.
- Export creates a JSON file from the saved profile data.
- Comparison summarizes profile metadata and high-level section differences only.
- No cloud sync, remote upload, database, or user account is used.

## Work Package 4 Scope

Included:

- Local profile storage schema versioning.
- Full saved-profile library backup export as JSON.
- Full saved-profile library backup import and restore.
- Backup shape validation before restore.
- Merge restore mode that safely rekeys duplicate profile IDs.
- Replace restore mode behind an explicit confirmation prompt.
- Active profile preservation where safe and safe reset when needed.
- Graceful fallback for corrupt or incompatible local storage.
- Clear storage health and backup/import status in Diagnostics.
- Practical tests for backup validation, restore modes, duplicate handling, and corrupt storage handling.

Notes:

- Backup and restore operate only on local saved profile data.
- Replace restore changes the local saved-profile library only after confirmation.
- Duplicate profile IDs are normalized before being stored.
- Backup import does not upload data or talk to keyboard hardware.

Out of scope:

- Hardware writes
- HID write/send commands
- HID feature report send behavior
- Keyboard configuration read/write commands
- Applying profiles to keyboard
- Syncing profiles to keyboard
- Save-to-device behavior
- Key remapping editor
- RGB editor
- Rapid trigger editor
- SOCD editor
- Macro editor
- Keymap writes
- RGB writes
- Rapid trigger writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration
- Cloud login, sync, upload, or database features
- User accounts
- Electron or embedded AJAZZ website wrappers

## Safety

Work Packages 1 through 4 are read-only with respect to keyboard hardware. The app does not include hardware write commands, save-to-device actions, apply-to-device actions, sync-to-device actions, HID feature report sends, keyboard configuration reads or writes, firmware flashing, calibration, remote upload, database services, or background device sync.
