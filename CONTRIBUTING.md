# Contributing

Thanks for helping with AK680 Studio.

## Setup

```bash
npm install
npm run tauri dev
```

For checks:

```bash
npm run lint
npm run build
cd src-tauri
cargo check
```

## Scope Discipline

Keep contributions aligned with the active work package. Work Package 1 is read-only profile inspection only.

Do not add hardware write behavior unless a future work package explicitly assigns it and includes a Red Team test plan.

## Hardware Safety

Do not introduce:

- HID write/send commands
- Save-to-device or apply-to-device actions
- Key remapping writes
- RGB writes
- Rapid trigger writes
- SOCD writes
- Macro writes
- Firmware flashing
- Calibration

Hardware-control changes require documented protocol research, backup-before-write behavior, focused tests, and maintainer approval.

