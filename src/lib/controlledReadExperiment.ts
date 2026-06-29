import type { HidDetectionResult, HidDeviceMetadata } from "../types/hid";

export type ControlledReadRunStatus = "never-run" | "disabled" | "canceled" | "success" | "error" | "timeout";
export type ControlledReadGateStatus = "pass" | "blocked" | "info";

export interface ControlledReadGate {
  label: string;
  status: ControlledReadGateStatus;
  detail: string;
}

export interface ControlledReadExperimentState {
  implemented: false;
  implementationStatus: "disabled-not-implemented";
  selectedPath?: string;
  selectedInterface?: HidDeviceMetadata;
  canRun: false;
  runStatus: ControlledReadRunStatus;
  runDisabledReason: string;
  gates: ControlledReadGate[];
  result?: ControlledReadResult;
}

export interface ControlledReadResult {
  status: ControlledReadRunStatus;
  timestamp: string;
  implemented: false;
  target?: ControlledReadTargetSummary;
  responseLength: number;
  responseHex: string;
  message: string;
}

export interface ControlledReadTargetSummary {
  vendorId: number;
  productId: number;
  path: string;
  usagePage: string;
  usage: string;
  interfaceNumber: string;
}

export interface ControlledReadExport {
  exportType: "ak680-controlled-read-experiment";
  timestamp: string;
  implementationStatus: "disabled-not-implemented";
  target?: ControlledReadTargetSummary;
  resultStatus: ControlledReadRunStatus;
  responseLength: number;
  responseHex: string;
  message: string;
  safetyNotes: string[];
}

export const CONTROLLED_READ_DISABLED_REASON =
  "Command execution is disabled pending a justified safe read/query. Current project research notes do not document an exact safe query.";

export function createControlledReadExperimentState({
  hidDetection,
  selectedPath,
  result,
}: {
  hidDetection?: HidDetectionResult;
  selectedPath?: string;
  result?: ControlledReadResult;
}): ControlledReadExperimentState {
  const matchingInterfaces = getMatchingControlledReadInterfaces(hidDetection);
  const selectedInterface = selectedPath
    ? matchingInterfaces.find((device) => device.path === selectedPath)
    : undefined;

  return {
    implemented: false,
    implementationStatus: "disabled-not-implemented",
    selectedPath,
    selectedInterface,
    canRun: false,
    runStatus: result?.status ?? "never-run",
    runDisabledReason: CONTROLLED_READ_DISABLED_REASON,
    gates: createControlledReadGates(hidDetection, selectedPath, selectedInterface),
    result,
  };
}

export function getMatchingControlledReadInterfaces(result?: HidDetectionResult): HidDeviceMetadata[] {
  return result?.devices.filter((device) => device.matchedTarget && Boolean(device.path)) ?? [];
}

export function createDisabledControlledReadResult({
  selectedInterface,
  now = new Date(),
}: {
  selectedInterface?: HidDeviceMetadata;
  now?: Date;
}): ControlledReadResult {
  return {
    status: "disabled",
    timestamp: now.toISOString(),
    implemented: false,
    target: selectedInterface ? summarizeControlledReadTarget(selectedInterface) : undefined,
    responseLength: 0,
    responseHex: "",
    message: CONTROLLED_READ_DISABLED_REASON,
  };
}

export function createControlledReadExport({
  state,
  now = new Date(),
}: {
  state: ControlledReadExperimentState;
  now?: Date;
}): ControlledReadExport {
  const result =
    state.result ??
    createDisabledControlledReadResult({
      selectedInterface: state.selectedInterface,
      now,
    });

  return {
    exportType: "ak680-controlled-read-experiment",
    timestamp: now.toISOString(),
    implementationStatus: state.implementationStatus,
    target: result.target,
    resultStatus: result.status,
    responseLength: result.responseLength,
    responseHex: result.responseHex,
    message: result.message,
    safetyNotes: [
      "Harness-only disabled state.",
      "No HID read/query command is implemented in WP9.",
      "No keyboard settings are changed.",
      "This is not apply, sync, save-to-device, or write support.",
      "No fuzzing, brute forcing, command scanning, background polling, or continuous monitoring is implemented.",
      "GPL-3.0 source code, packet framing, constants, and implementation material were not copied.",
    ],
  };
}

export function formatResponseHex(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

function createControlledReadGates(
  hidDetection?: HidDetectionResult,
  selectedPath?: string,
  selectedInterface?: HidDeviceMetadata,
): ControlledReadGate[] {
  const targetDetected = Boolean(hidDetection?.targetDetected);
  return [
    {
      label: "AK680 V2 VID/PID detected",
      status: targetDetected ? "pass" : "blocked",
      detail: targetDetected
        ? "Read-only HID metadata includes VID 3141 and PID 32956."
        : "Run read-only HID detection and connect the AK680 V2 in USB/wired mode.",
    },
    {
      label: "Exact target path/interface selected",
      status: selectedInterface ? "pass" : "blocked",
      detail: selectedInterface
        ? `Selected ${selectedInterface.path}.`
        : selectedPath
          ? "Selected path is not a matching AK680 V2 interface."
          : "Select one matching AK680 V2 HID path/interface before any future experiment can run.",
    },
    {
      label: "Explicit user confirmation",
      status: "info",
      detail: "Required before any future implemented read/query attempt. No confirmation can run a command in harness-only mode.",
    },
    {
      label: "Known safe query justified",
      status: "blocked",
      detail: CONTROLLED_READ_DISABLED_REASON,
    },
  ];
}

function summarizeControlledReadTarget(device: HidDeviceMetadata): ControlledReadTargetSummary {
  return {
    vendorId: device.vendorId,
    productId: device.productId,
    path: device.path ?? "Not available",
    usagePage: formatOptional(device.usagePage),
    usage: formatOptional(device.usage),
    interfaceNumber: formatOptional(device.interfaceNumber),
  };
}

function formatOptional(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return String(value);
}
