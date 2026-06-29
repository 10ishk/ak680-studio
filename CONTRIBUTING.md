# Contributing

Thanks for helping with AK680 Studio. This project is a public alpha and currently remains local-only and read-only with respect to keyboard hardware.

## Setup

```bash
npm install
npm run tauri dev
```

## Common Checks

Frontend:

```bash
npm run lint
npm run build
npm test -- --run
```

Rust:

```bash
cd src-tauri
cargo fmt --check
cargo check
cargo test
```

Optional native build validation:

```bash
npm run tauri build
```

## Pull Requests

- Keep changes aligned with the active work package.
- Update docs and changelog entries when user-visible behavior or project policy changes.
- Include screenshots for UI changes when practical.
- Use the pull request template checklist.
- Do not commit secrets, private profile data, local machine paths, build outputs, `node_modules`, or Tauri target artifacts.

## Scope Discipline

Work Packages 1 through 5 preserve a read-only hardware posture. Do not add hardware-write behavior unless a future work package explicitly assigns it and includes a Red Team test plan.

Do not add:

- HID write/send commands
- `device.write`, `send_feature_report`, output report writes, or save/apply/sync-to-device actions
- Keyboard configuration reads/writes
- Key remapping, RGB, rapid trigger, SOCD, or macro editors
- Firmware flashing
- Calibration
- Cloud sync, user accounts, remote upload, or database services
- Electron wrappers or embedded vendor websites
- Installer/release packaging or release binary publishing unless explicitly in scope

## Hardware and Protocol Work

Hardware/protocol research is welcome as documentation or test planning when it is clearly labeled as research. Implementation of any hardware-write path requires:

1. Documented protocol research.
2. Backup-before-write design.
3. The smallest possible first write.
4. Verification-after-write design.
5. Focused tests.
6. Red Team safety review.
7. Explicit maintainer approval before implementation.

## Vendor Code and Assets

Do not copy proprietary AJAZZ code, assets, bundled firmware, or vendor UI into this repository. Public references may be cited for research context only.

## License

By contributing, you agree that your contributions are submitted under the Apache License, Version 2.0.
