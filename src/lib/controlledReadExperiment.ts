import type { HidDetectionResult, HidDeviceMetadata } from "../types/hid";

export type ControlledReadRunStatus = "never-run" | "blocked" | "canceled" | "success" | "error" | "timeout";
export type ControlledReadGateStatus = "pass" | "blocked" | "info";
export type ControlledReadOutcome = "wp13-implemented-single-device-info-read";

export interface ControlledReadGate {
  label: string;
  status: ControlledReadGateStatus;
  detail: string;
}

export interface ControlledReadExperimentState {
  implemented: true;
  implementationStatus: "implemented-single-approved-query";
  outcome: ControlledReadOutcome;
  queryName: string;
  selectedPath?: string;
  selectedInterface?: HidDeviceMetadata;
  canRun: boolean;
  runStatus: ControlledReadRunStatus;
  runDisabledReason: string;
  gates: ControlledReadGate[];
  result?: ControlledReadResult;
}

export interface ControlledReadResult {
  status: ControlledReadRunStatus;
  timestamp: string;
  implemented: true;
  outcome: ControlledReadOutcome;
  queryName: string;
  target?: ControlledReadTargetSummary;
  reportId: number;
  requestLength: number;
  requestHex: string;
  responseLength: number;
  responseHex: string;
  responseBytes: number[];
  minimalParse: ControlledReadMinimalParse;
  message: string;
}

export interface ControlledReadMinimalParse {
  prefix: string;
  prefixMatchesExpected: boolean;
  observedVidPidLikeBytes?: string;
  notes: string[];
}

export interface ControlledReadTargetSummary {
  vendorId: number;
  productId: number;
  path: string;
  usagePage: string;
  usage: string;
  interfaceNumber: string;
}

export interface ControlledReadBackendRequest {
  selectedPath: string;
  vendorId: number;
  productId: number;
  usagePage?: number | null;
  usage?: number | null;
}

export interface ControlledReadBackendResult {
  status: "success" | "blocked" | "timeout" | "error";
  message: string;
  reportId: number;
  requestLength: number;
  responseLength: number;
  responseBytes: number[];
}

export interface ControlledReadExport {
  exportType: "ak680-controlled-read-experiment";
  timestamp: string;
  implementationStatus: "implemented-single-approved-query";
  outcome: ControlledReadOutcome;
  queryName: string;
  reportId: number;
  requestLength: number;
  requestHex: string;
  retryCount: 0;
  target?: ControlledReadTargetSummary;
  resultStatus: ControlledReadRunStatus;
  responseLength: number;
  responseHex: string;
  minimalParse: ControlledReadMinimalParse;
  message: string;
  safetyNotes: string[];
}

export const CONTROLLED_READ_QUERY_NAME = "WP12-approved AA 10 30 device-info read/query";
export const CONTROLLED_READ_OUTCOME: ControlledReadOutcome = "wp13-implemented-single-device-info-read";
export const CONTROLLED_READ_IMPLEMENTATION_STATUS = "implemented-single-approved-query";
export const CONTROLLED_READ_REPORT_ID = 0;
export const CONTROLLED_READ_REQUEST_BYTES = [
  0xaa, 0x10, 0x30, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];
export const CONTROLLED_READ_REQUEST_LENGTH = CONTROLLED_READ_REQUEST_BYTES.length;
export const CONTROLLED_READ_REQUEST_HEX = formatResponseHex(CONTROLLED_READ_REQUEST_BYTES);
export const CONTROLLED_READ_REQUIRED_USAGE_PAGE = 65384;
export const CONTROLLED_READ_REQUIRED_USAGE = 97;

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
  const gates = createControlledReadGates(hidDetection, selectedPath, selectedInterface);
  const blockedGate = gates.find((gate) => gate.status === "blocked");

  return {
    implemented: true,
    implementationStatus: CONTROLLED_READ_IMPLEMENTATION_STATUS,
    outcome: CONTROLLED_READ_OUTCOME,
    queryName: CONTROLLED_READ_QUERY_NAME,
    selectedPath,
    selectedInterface,
    canRun: !blockedGate,
    runStatus: result?.status ?? "never-run",
    runDisabledReason: blockedGate?.detail ?? "Ready for one manual confirmed controlled read.",
    gates,
    result,
  };
}

export function getMatchingControlledReadInterfaces(result?: HidDetectionResult): HidDeviceMetadata[] {
  return result?.devices.filter((device) => device.matchedTarget && Boolean(device.path)) ?? [];
}

export function createControlledReadBackendRequest(
  selectedInterface?: HidDeviceMetadata,
): ControlledReadBackendRequest | undefined {
  if (!selectedInterface?.path) {
    return undefined;
  }

  return {
    selectedPath: selectedInterface.path,
    vendorId: selectedInterface.vendorId,
    productId: selectedInterface.productId,
    usagePage: selectedInterface.usagePage,
    usage: selectedInterface.usage,
  };
}

export function createCanceledControlledReadResult({
  selectedInterface,
  now = new Date(),
}: {
  selectedInterface?: HidDeviceMetadata;
  now?: Date;
}): ControlledReadResult {
  return createControlledReadResult({
    status: "canceled",
    selectedInterface,
    responseBytes: [],
    message: "Controlled device-info read canceled before sending.",
    now,
  });
}

export function createControlledReadResultFromBackend({
  backendResult,
  selectedInterface,
  now = new Date(),
}: {
  backendResult: ControlledReadBackendResult;
  selectedInterface?: HidDeviceMetadata;
  now?: Date;
}): ControlledReadResult {
  return createControlledReadResult({
    status: backendResult.status,
    selectedInterface,
    responseBytes: backendResult.responseBytes,
    message: backendResult.message,
    now,
  });
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
    createControlledReadResult({
      status: state.canRun ? "never-run" : "blocked",
      selectedInterface: state.selectedInterface,
      responseBytes: [],
      message: state.runDisabledReason,
      now,
    });

  return {
    exportType: "ak680-controlled-read-experiment",
    timestamp: now.toISOString(),
    implementationStatus: state.implementationStatus,
    outcome: state.outcome,
    queryName: state.queryName,
    reportId: CONTROLLED_READ_REPORT_ID,
    requestLength: CONTROLLED_READ_REQUEST_LENGTH,
    requestHex: CONTROLLED_READ_REQUEST_HEX,
    retryCount: 0,
    target: result.target,
    resultStatus: result.status,
    responseLength: result.responseLength,
    responseHex: result.responseHex,
    minimalParse: result.minimalParse,
    message: result.message,
    safetyNotes: [
      "WP13 implements exactly one controlled device-info read/query.",
      "The only approved request is AA 10 30 with report ID 0 and 64 request bytes.",
      "The command runs once per explicit user confirmation; no retries are implemented.",
      "No other official-driver connect commands are implemented.",
      "No keyboard settings are changed.",
      "This is not apply, sync, save-to-device, or write support.",
      "No arbitrary command entry or raw command console is implemented.",
      "No fuzzing, brute forcing, command scanning, background polling, or continuous monitoring is implemented.",
      "GPL-3.0 source code, packet framing, constants, and implementation material were not copied.",
    ],
  };
}

export function parseControlledReadResponse(bytes: number[]): ControlledReadMinimalParse {
  const prefixBytes = bytes.slice(0, 3);
  const prefix = formatResponseHex(prefixBytes);
  const observedVidPidLikeBytes = bytes.length >= 16 ? formatResponseHex(bytes.slice(12, 16)) : undefined;

  return {
    prefix: prefix || "Not available",
    prefixMatchesExpected: prefix === "55 10 30",
    observedVidPidLikeBytes,
    notes: [
      "Minimal parse only.",
      "Prefix match only checks for observed 55 10 30 response prefix.",
      "VID/PID-like bytes are displayed only as observed bytes when present.",
      "No firmware, settings, calibration, layout, memory, or profile inference is made.",
    ],
  };
}

export function formatResponseHex(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

function createControlledReadResult({
  status,
  selectedInterface,
  responseBytes,
  message,
  now,
}: {
  status: ControlledReadRunStatus;
  selectedInterface?: HidDeviceMetadata;
  responseBytes: number[];
  message: string;
  now: Date;
}): ControlledReadResult {
  return {
    status,
    timestamp: now.toISOString(),
    implemented: true,
    outcome: CONTROLLED_READ_OUTCOME,
    queryName: CONTROLLED_READ_QUERY_NAME,
    target: selectedInterface ? summarizeControlledReadTarget(selectedInterface) : undefined,
    reportId: CONTROLLED_READ_REPORT_ID,
    requestLength: CONTROLLED_READ_REQUEST_LENGTH,
    requestHex: CONTROLLED_READ_REQUEST_HEX,
    responseLength: responseBytes.length,
    responseHex: formatResponseHex(responseBytes),
    responseBytes,
    minimalParse: parseControlledReadResponse(responseBytes),
    message,
  };
}

function createControlledReadGates(
  hidDetection?: HidDetectionResult,
  selectedPath?: string,
  selectedInterface?: HidDeviceMetadata,
): ControlledReadGate[] {
  const targetDetected = Boolean(hidDetection?.targetDetected);
  const usageGate = getUsageGate(selectedInterface);

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
          : "Select one matching AK680 V2 HID path/interface before the controlled read can run.",
    },
    usageGate,
    {
      label: "Explicit user confirmation",
      status: "info",
      detail: "Required immediately before the single AA 10 30 controlled read. Canceling sends nothing.",
    },
    {
      label: "Single approved command",
      status: "pass",
      detail: "Only AA 10 30, report ID 0, 64-byte request is available. No retries or alternate commands.",
    },
  ];
}

function getUsageGate(selectedInterface?: HidDeviceMetadata): ControlledReadGate {
  if (!selectedInterface) {
    return {
      label: "Usage page / usage target",
      status: "blocked",
      detail: "Select a matching HID path/interface so usagePage 65384 and usage 97 can be checked.",
    };
  }

  if (selectedInterface.usagePage === 1 && selectedInterface.usage === 6) {
    return {
      label: "Usage page / usage target",
      status: "blocked",
      detail: "Keyboard interface usagePage 1 / usage 6 is blocked.",
    };
  }

  if (selectedInterface.usagePage === 12 && selectedInterface.usage === 1) {
    return {
      label: "Usage page / usage target",
      status: "blocked",
      detail: "Consumer-control interface usagePage 12 / usage 1 is blocked.",
    };
  }

  if (
    selectedInterface.usagePage !== undefined &&
    selectedInterface.usagePage !== null &&
    selectedInterface.usagePage !== CONTROLLED_READ_REQUIRED_USAGE_PAGE
  ) {
    return {
      label: "Usage page / usage target",
      status: "blocked",
      detail: "Selected interface usagePage is not the approved 65384.",
    };
  }

  if (
    selectedInterface.usage !== undefined &&
    selectedInterface.usage !== null &&
    selectedInterface.usage !== CONTROLLED_READ_REQUIRED_USAGE
  ) {
    return {
      label: "Usage page / usage target",
      status: "blocked",
      detail: "Selected interface usage is not the approved 97.",
    };
  }

  return {
    label: "Usage page / usage target",
    status: "pass",
    detail: "Selected metadata matches usagePage 65384 and usage 97, or unavailable fields are deferred to backend validation.",
  };
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
