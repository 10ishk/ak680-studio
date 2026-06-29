# AK680 Studio

AK680 Studio is an unofficial, open-source native desktop public alpha for inspecting AJAZZ AK680 V2 profile exports, detecting the target keyboard with read-only HID metadata, and managing local saved profile backups.

This project is not affiliated with, endorsed by, or maintained by AJAZZ. The official vendor tooling remains the supported configuration path until any native hardware-write behavior is researched, documented, reviewed, and explicitly approved in a future work package.

## Public Alpha Status

AK680 Studio is local-only and read-only with respect to keyboard hardware.

- Profile imports are parsed locally.
- Saved profiles and backups stay on this machine.
- HID detection enumerates safe metadata only.
- No hardware writes are implemented.
- No apply, sync, save-to-device, firmware flashing, calibration, cloud sync, user account, remote upload, or database feature is included.
- This is not a complete keyboard control suite yet.

## Current Features

- Tauri v2 native desktop shell.
- React, TypeScript, and Tailwind UI.
- AK680 V2 profile JSON import and validation.
- Read-only profile inspector.
- Keyboard layout view rendered from `keyList`.
- Read-only lighting, rapid trigger, SOCD, and macro summaries.
- Read-only Rust HID enumeration with target matching for VID `3141` and PID `32956`.
- Local saved profile manager backed by browser `localStorage`.
- Active local profile selection, rename, delete with confirmation, and individual JSON export.
- Full local profile library backup export/import with schema validation.
- Merge and confirmed replace restore modes.
- Duplicate profile ID handling and corrupt/incompatible storage recovery.
- Diagnostics and About screens with public-alpha safety status.

## Screenshots

Screenshots are not committed yet. Before adding screenshots:

1. Run `npm run tauri dev`.
2. Capture Dashboard, Device, Profiles, Diagnostics, and About screens.
3. Save images under `docs/screenshots/`.
4. Update this section with relative Markdown image links.

Do not include private profile data, serial numbers, or local file paths in screenshots.

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

## Checks

Frontend:

```bash
npm run lint
npm run build
npm test -- --run
npm audit --audit-level=moderate
```

Rust:

```bash
cd src-tauri
cargo fmt --check
cargo check
cargo test
```

Native build validation:

```bash
npm run tauri build
```

GitHub Actions CI is not committed yet because the current GitHub authentication available to Codex cannot push workflow files without the `workflow` OAuth scope. Until CI is added by a maintainer with that scope, run the checks above locally. Future CI should remain check-only and must not publish release binaries or upload installer artifacts.

## Reporting Issues

Use the GitHub issue templates:

- Bug report
- Feature request
- Device detection report

For device detection reports, share only metadata you are comfortable posting publicly. Serial numbers and HID paths may be sensitive.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, checks, pull request expectations, and safe hardware/protocol contribution guidance.

Hardware-write or protocol work requires documented research, explicit maintainer approval, and Red Team safety review before implementation.

## Security and Hardware Safety

See [SECURITY.md](SECURITY.md) for responsible disclosure and hardware-safety reporting guidance.

Report unsafe hardware-control behavior, accidental write paths, or security issues promptly. The current public alpha is not expected to write to keyboard hardware.

## Not Supported Yet

- Hardware writes
- HID write/send commands
- Keyboard configuration reads/writes
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
- Installer/release packaging
- Release binary publishing
- Electron or embedded AJAZZ website wrappers

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).
