# AK680 Studio

AK680 Studio is an unofficial, open-source native desktop app for inspecting AJAZZ AK680 V2 profile exports and detecting the target keyboard locally. Work Package 2 adds read-only HID device detection while preserving the Work Package 1 read-only profile inspector.

This project is not affiliated with, endorsed by, or maintained by AJAZZ. The official vendor tooling remains the supported configuration path until native hardware-write behavior is researched, documented, and reviewed in a future work package.

## Tech Stack

- Tauri v2
- Rust backend with read-only HID enumeration
- React
- TypeScript
- Tailwind CSS
- Local-only browser state

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

Out of scope:

- Hardware writes
- HID write/send commands
- HID feature report send behavior
- Keyboard configuration read/write commands
- Keymap writes
- RGB writes
- Rapid trigger writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration
- Cloud login, sync, upload, or database features
- Electron or embedded AJAZZ website wrappers

## Safety

Work Packages 1 and 2 are read-only. The app does not include hardware write commands, save-to-device actions, apply-to-device actions, HID feature report sends, keyboard configuration writes, firmware flashing, calibration, or background device sync.
