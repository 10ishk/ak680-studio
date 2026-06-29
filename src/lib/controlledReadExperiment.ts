import type { HidDetectionResult, HidDeviceMetadata } from "../types/hid";

export type ControlledReadRunStatus = "never-run" | "disabled" | "canceled" | "success" | "error" | "timeout";
export type ControlledReadGateStatus = "pass" | "blocked" | "info";
export type ControlledReadOutcome = "wp10-outcome-b-disabled-insufficient-evidence";

export interface ControlledReadGate {
  label: string;
  status: ControlledReadGateStatus;
  detail: string;
}

export interface ControlledReadExperimentState {
  implemented: false;
  implementationStatus: "disabled-not-implemented";
  outcome: ControlledReadOutcome;
  queryName: string;
  missingEvidence: string[];
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
  outcome: ControlledReadOutcome;
  queryName: string;
  missingEvidence: string[];
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
  outcome: ControlledReadOutcome;
  queryName: string;
  missingEvidence: string[];
  rustCommandImplemented: false;
  tauriInvokeImplemented: false;
  hidReportSendImplemented: false;
  fakeResponseBytesIncluded: false;
  target?: ControlledReadTargetSummary;
  resultStatus: ControlledReadRunStatus;
  responseLength: number;
  responseHex: string;
  message: string;
  safetyNotes: string[];
}

export const CONTROLLED_READ_QUERY_NAME = "Device-info read/query";
export const CONTROLLED_READ_OUTCOME: ControlledReadOutcome = "wp10-outcome-b-disabled-insufficient-evidence";
export const CONTROLLED_READ_DISABLED_REASON =
  "Device-info read/query execution is disabled because current project research notes do not document an exact safe query.";
export const WP10_MISSING_DEVICE_INFO_EVIDENCE = [
  "Exact HID report type for a device-info query is not documented.",
  "Exact report ID, if any, is not documented.",
  "Exact request bytes or command framing are not documented.",
  "Expected response length and response format are not documented.",
  "Project research notes do not yet prove the query is read/query-only and not a keyboard setting write.",
];

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
    outcome: CONTROLLED_READ_OUTCOME,
    queryName: CONTROLLED_READ_QUERY_NAME,
    missingEvidence: [...WP10_MISSING_DEVICE_INFO_EVIDENCE],
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
    outcome: CONTROLLED_READ_OUTCOME,
    queryName: CONTROLLED_READ_QUERY_NAME,
    missingEvidence: [...WP10_MISSING_DEVICE_INFO_EVIDENCE],
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
    outcome: state.outcome,
    queryName: state.queryName,
    missingEvidence: [...state.missingEvidence],
    rustCommandImplemented: false,
    tauriInvokeImplemented: false,
    hidReportSendImplemented: false,
    fakeResponseBytesIncluded: false,
    target: result.target,
    resultStatus: result.status,
    responseLength: result.responseLength,
    responseHex: result.responseHex,
    message: result.message,
    safetyNotes: [
      "WP10 Outcome B: disabled because exact device-info query evidence is insufficient.",
      "No Rust controlled-read command is implemented.",
      "No Tauri controlled-read invoke is implemented.",
      "No HID report send is implemented.",
      "No response bytes are fabricated.",
      "No keyboard settings are changed.",
      "This is not apply, sync, save-to-device, or write support.",
      "No unknown or guessed HID commands are sent.",
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
      label: "Device-info query evidence",
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
