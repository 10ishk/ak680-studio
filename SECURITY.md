# Security Policy

## Reporting Issues

Please report security or hardware-safety issues through the repository issue tracker. If public disclosure could put users at risk, contact the maintainer privately before posting sensitive details.

## Hardware Safety Scope

AK680 Studio public alpha is local-only and read-only with respect to keyboard hardware.

Current behavior:

- Imports profile JSON locally.
- Enumerates HID device metadata read-only.
- Saves profiles and backups locally.
- Does not write settings to keyboard hardware.

Report any behavior that appears to:

- Write to HID devices.
- Send feature reports or output reports.
- Apply, sync, or save profiles to keyboard hardware.
- Read or write keyboard configuration.
- Flash firmware or perform calibration.
- Upload profile/device data remotely.

## Sensitive Data

Avoid sharing sensitive data unnecessarily, including:

- Keyboard serial numbers.
- HID paths.
- Private profile exports.
- Local file paths.
- Logs that include personal information.

When reporting device detection issues, include only metadata you are comfortable making public.

## Future Hardware-Control Work

Any future hardware-write capability must go through documented protocol research, backup-before-write planning, focused tests, Red Team safety review, and explicit maintainer approval before implementation.
