# AK680 Studio

AK680 Studio is an unofficial, open-source native desktop app for inspecting AJAZZ AK680 V2 profile exports. Work Package 1 is a read-only foundation: it imports a local profile JSON file, validates that it targets the AJAZZ AK680 V2, and displays profile data without writing to hardware.

This project is not affiliated with, endorsed by, or maintained by AJAZZ. The official vendor tooling remains the supported configuration path until native hardware-write behavior is researched, documented, and reviewed in a future work package.

## Tech Stack

- Tauri v2
- Rust backend scaffold
- React
- TypeScript
- Tailwind CSS
- Local-only browser state for Work Package 1

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

## Work Package 1 Scope

Included:

- Native Tauri app shell with sidebar navigation
- Dashboard, Device, Profile Import, Profile Inspector, Keyboard Layout, Lighting, Rapid Trigger, Macros, and Diagnostics screens
- Local AJAZZ profile JSON import
- AK680 V2 profile validation
- Read-only profile, lighting, game mode, macro, and magnetic-axis summaries
- Keyboard layout rendering from `keyList`
- Sample fixture at `fixtures/ak680-profile.sample.json`

Out of scope:

- Hardware writes
- HID write/send commands
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

Work Package 1 is read-only. The app does not include hardware write commands, save-to-device actions, apply-to-device actions, firmware flashing, calibration, or background device sync.

