import type { HidDetectionResult, HidDeviceMetadata } from "../types/hid";
import {
  CONTROLLED_READ_REPORT_ID,
  CONTROLLED_READ_REQUEST_BYTES,
  CONTROLLED_READ_REQUEST_LENGTH,
  CONTROLLED_READ_REQUIRED_USAGE,
  CONTROLLED_READ_REQUIRED_USAGE_PAGE,
} from "./controlledReadExperiment";
import {
  LIGHTING_DRY_RUN_PACKET_LENGTH,
  LIGHTING_DRY_RUN_REPORT_ID,
  LIGHTING_DRY_RUN_TARGET_METADATA,
  createLightingDryRunPlan,
} from "./lightingDryRunPlanner";

export type ControlledLightingWriteRunStatus = "never-run" | "blocked" | "canceled" | "success" | "failure";
export type ControlledLightingWriteGateStatus = "pass" | "blocked" | "info";
export type ControlledLightingWriteOutcome = "wp21-one-shot-static-global-lighting-write";

export interface ControlledLightingWriteGate {
  label: string;
  status: ControlledLightingWriteGateStatus;
  detail: string;
}

export interface ControlledLightingWriteExperimentState {
  implemented: true;
  implementationStatus: "implemented-single-approved-write";
  outcome: ControlledLightingWriteOutcome;
  actionName: string;
  selectedPath?: string;
  selectedInterface?: HidDeviceMetadata;
  manualConfirmation: boolean;
  canRun: boolean;
  runStatus: ControlledLightingWriteRunStatus;
  runDisabledReason: string;
  gates: ControlledLightingWriteGate[];
  result?: ControlledLightingWriteResult;
}

export interface ControlledLightingWriteBackendRequest {
  selectedPath: string;
  vendorId: number;
  productId: number;
  usagePage?: number | null;
  usage?: number | null;
  manualConfirmation: boolean;
}

export interface FunctionalLightingSettings {
  red: number;
  green: number;
  blue: number;
  brightness: number;
  speed: number;
  direction: number;
  colorMode: number;
}

export interface FunctionalLightingWriteBackendRequest extends ControlledLightingWriteBackendRequest, FunctionalLightingSettings {}

export interface ControlledLightingWriteBackendResult {
  status: "success" | "blocked" | "failure";
  message: string;
  reportId: number;
  packetLength: number;
  attemptedPacket: number[];
  writeAttemptCount: number;
  retryCount: number;
  followUpPacketCount: number;
}

export interface ControlledLightingWriteResult {
  status: ControlledLightingWriteRunStatus;
  timestamp: string;
  implemented: true;
  outcome: ControlledLightingWriteOutcome;
  actionName: string;
  target?: ControlledLightingWriteTargetSummary;
  reportId: number;
  packetLength: number;
  packetHex: string;
  attemptedPacket: number[];
  writeAttemptCount: number;
  retryCount: 0;
  followUpPacketCount: 0;
  physicalVerificationReminder: string;
  message: string;
}

export interface ControlledLightingWriteTargetSummary {
  vendorId: number;
  productId: number;
  path: string;
  usagePage: string;
  usage: string;
  interfaceNumber: string;
}

export interface ControlledLightingWriteExport {
  exportType: "ak680-wp21-controlled-lighting-write-evidence" | "ak680-wp22-functional-lighting-write-evidence";
  timestamp: string;
  localOnly: true;
  noSensitiveData: true;
  implementationStatus: "implemented-single-approved-write";
  outcome: ControlledLightingWriteOutcome;
  actionName: string;
  resultStatus: ControlledLightingWriteRunStatus;
  reportId: number;
  packetLength: number;
  packetHex: string;
  targetMetadata: typeof CONTROLLED_LIGHTING_WRITE_TARGET_METADATA;
  selectedInterface?: ControlledLightingWriteEvidenceInterface;
  gateResults: ControlledLightingWriteGate[];
  manualConfirmation: boolean;
  writeAttemptCount: number;
  retryCount: 0;
  followUpPacketCount: 0;
  physicalVerificationReminder: string;
  message: string;
  safetyNotes: string[];
}

export interface ControlledLightingWriteEvidenceInterface {
  vendorId: number;
  productId: number;
  usagePage: string;
  usage: string;
  interfaceNumber: string;
  pathRedacted: boolean;
  serialNumberIncluded: false;
}

export const CONTROLLED_LIGHTING_WRITE_ACTION_NAME = "WP21 experimental one-shot lighting write";
export const CONTROLLED_LIGHTING_WRITE_OUTCOME: ControlledLightingWriteOutcome =
  "wp21-one-shot-static-global-lighting-write";
export const CONTROLLED_LIGHTING_WRITE_IMPLEMENTATION_STATUS = "implemented-single-approved-write";
export const CONTROLLED_LIGHTING_WRITE_REPORT_ID = 0;
export const CONTROLLED_LIGHTING_WRITE_PACKET_BYTES = [
  0xaa, 0x23, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0xff, 0x00, 0x00, 0xff, 0x00,
  0x00, 0x00, 0x00, 0x05, 0x03, 0x00, 0x00, 0x00, 0xaa, 0x55, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];
export const CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH = CONTROLLED_LIGHTING_WRITE_PACKET_BYTES.length;
export const CONTROLLED_LIGHTING_WRITE_PACKET_HEX = formatHex(CONTROLLED_LIGHTING_WRITE_PACKET_BYTES);
export const CONTROLLED_LIGHTING_WRITE_REQUIRED_USAGE_PAGE = 65384;
export const CONTROLLED_LIGHTING_WRITE_REQUIRED_USAGE = 97;
export const FUNCTIONAL_LIGHTING_VARIABLE_INDEXES = [8, 9, 10, 11, 12, 17, 18] as const;
export const CONTROLLED_LIGHTING_WRITE_TARGET_METADATA = {
  device: "AJAZZ AK680 V2",
  vendorId: 3141,
  productId: 32956,
  usagePage: CONTROLLED_LIGHTING_WRITE_REQUIRED_USAGE_PAGE,
  usage: CONTROLLED_LIGHTING_WRITE_REQUIRED_USAGE,
  reportId: CONTROLLED_LIGHTING_WRITE_REPORT_ID,
  packetLength: CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH,
} as const;
export const WP21_PHYSICAL_VERIFICATION_REMINDER =
  "Physically verify keyboard lighting after the attempt. Recovery/rollback is manual through the official AJAZZ app/profile restore or a future tested rollback package.";
export const WP22_PHYSICAL_VERIFICATION_REMINDER =
  "Physically verify keyboard lighting after the attempt. Recovery is manual through the official AJAZZ app/profile restore or another explicitly triggered lighting write.";

export function createFunctionalLightingSettingsFromLedEffect(ledEffect?: {
  red?: unknown;
  green?: unknown;
  blue?: unknown;
  brightness?: unknown;
  speed?: unknown;
  direction?: unknown;
  colorMode?: unknown;
}): FunctionalLightingSettings {
  return {
    red: toByte(ledEffect?.red, 255),
    green: toByte(ledEffect?.green, 0),
    blue: toByte(ledEffect?.blue, 0),
    brightness: toByte(ledEffect?.brightness, 255),
    speed: toByte(ledEffect?.speed, 5),
    direction: toByte(ledEffect?.direction, 3),
    colorMode: toByte(ledEffect?.colorMode, 1),
  };
}

export function buildFunctionalLightingPacket(settings: FunctionalLightingSettings): number[] {
  const packet = [...CONTROLLED_LIGHTING_WRITE_PACKET_BYTES];
  packet[8] = validateByte(settings.colorMode, "colorMode");
  packet[9] = validateByte(settings.red, "red");
  packet[10] = validateByte(settings.green, "green");
  packet[11] = validateByte(settings.blue, "blue");
  packet[12] = validateByte(settings.brightness, "brightness");
  packet[17] = validateByte(settings.speed, "speed");
  packet[18] = validateByte(settings.direction, "direction");
  validateFunctionalLightingPacketFamily(packet);
  return packet;
}

export function validateFunctionalLightingPacketFamily(packet: number[]) {
  if (packet.length !== CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH) {
    throw new Error("Functional lighting packet must be exactly 64 bytes.");
  }

  if (packet[0] !== 0xaa || packet[1] !== 0x23 || packet[2] !== 0x10) {
    throw new Error("Functional lighting packet prefix must remain AA 23 10.");
  }

  if (packet[22] !== 0xaa || packet[23] !== 0x55) {
    throw new Error("Functional lighting packet marker bytes must remain AA 55.");
  }

  packet.forEach((byte, index) => {
    validateByte(byte, `packet[${index}]`);
    if (
      !(FUNCTIONAL_LIGHTING_VARIABLE_INDEXES as readonly number[]).includes(index) &&
      byte !== CONTROLLED_LIGHTING_WRITE_PACKET_BYTES[index]
    ) {
      throw new Error(`Functional lighting packet byte index ${index} is not allowed to vary.`);
    }
  });
}

export function createControlledLightingWriteExperimentState({
  hidDetection,
  selectedPath,
  manualConfirmation,
  result,
}: {
  hidDetection?: HidDetectionResult;
  selectedPath?: string;
  manualConfirmation: boolean;
  result?: ControlledLightingWriteResult;
}): ControlledLightingWriteExperimentState {
  const selectableInterfaces = getControlledLightingWriteCandidateInterfaces(hidDetection);
  const selectedInterface = selectedPath
    ? selectableInterfaces.find((device) => device.path === selectedPath)
    : undefined;
  const gates = createControlledLightingWriteGates(hidDetection, selectedPath, selectedInterface, manualConfirmation);
  const blockedGate = gates.find((gate) => gate.status === "blocked");

  return {
    implemented: true,
    implementationStatus: CONTROLLED_LIGHTING_WRITE_IMPLEMENTATION_STATUS,
    outcome: CONTROLLED_LIGHTING_WRITE_OUTCOME,
    actionName: CONTROLLED_LIGHTING_WRITE_ACTION_NAME,
    selectedPath,
    selectedInterface,
    manualConfirmation,
    canRun: !blockedGate,
    runStatus: result?.status ?? "never-run",
    runDisabledReason: blockedGate?.detail ?? "Ready for one manual confirmed WP21 lighting write.",
    gates,
    result,
  };
}

export function getControlledLightingWriteCandidateInterfaces(result?: HidDetectionResult): HidDeviceMetadata[] {
  return result?.devices.filter((device) => device.matchedTarget && Boolean(device.path)) ?? [];
}

export function createControlledLightingWriteBackendRequest(
  selectedInterface: HidDeviceMetadata | undefined,
  manualConfirmation: boolean,
): ControlledLightingWriteBackendRequest | undefined {
  if (!selectedInterface?.path || !manualConfirmation) {
    return undefined;
  }

  return {
    selectedPath: selectedInterface.path,
    vendorId: selectedInterface.vendorId,
    productId: selectedInterface.productId,
    usagePage: selectedInterface.usagePage,
    usage: selectedInterface.usage,
    manualConfirmation,
  };
}

export function createFunctionalLightingWriteBackendRequest(
  selectedInterface: HidDeviceMetadata | undefined,
  manualConfirmation: boolean,
  settings: FunctionalLightingSettings,
): FunctionalLightingWriteBackendRequest | undefined {
  if (!selectedInterface?.path || !manualConfirmation) {
    return undefined;
  }

  buildFunctionalLightingPacket(settings);

  return {
    selectedPath: selectedInterface.path,
    vendorId: selectedInterface.vendorId,
    productId: selectedInterface.productId,
    usagePage: selectedInterface.usagePage,
    usage: selectedInterface.usage,
    manualConfirmation,
    ...settings,
  };
}

export function createCanceledControlledLightingWriteResult({
  selectedInterface,
  now = new Date(),
}: {
  selectedInterface?: HidDeviceMetadata;
  now?: Date;
}): ControlledLightingWriteResult {
  return createControlledLightingWriteResult({
    status: "canceled",
    selectedInterface,
    attemptedPacket: CONTROLLED_LIGHTING_WRITE_PACKET_BYTES,
    writeAttemptCount: 0,
    retryCount: 0,
    followUpPacketCount: 0,
    message: "WP21 lighting write canceled before sending.",
    now,
  });
}

export function createControlledLightingWriteResultFromBackend({
  backendResult,
  selectedInterface,
  now = new Date(),
}: {
  backendResult: ControlledLightingWriteBackendResult;
  selectedInterface?: HidDeviceMetadata;
  now?: Date;
}): ControlledLightingWriteResult {
  return createControlledLightingWriteResult({
    status: backendResult.status,
    selectedInterface,
    attemptedPacket: backendResult.attemptedPacket,
    writeAttemptCount: backendResult.writeAttemptCount,
    retryCount: backendResult.retryCount,
    followUpPacketCount: backendResult.followUpPacketCount,
    message: backendResult.message,
    now,
  });
}

export function createControlledLightingWriteExport({
  state,
  now = new Date(),
  exportType = "ak680-wp21-controlled-lighting-write-evidence",
  packetHex = CONTROLLED_LIGHTING_WRITE_PACKET_HEX,
  physicalVerificationReminder = WP21_PHYSICAL_VERIFICATION_REMINDER,
  safetyNotes,
}: {
  state: ControlledLightingWriteExperimentState;
  now?: Date;
  exportType?: ControlledLightingWriteExport["exportType"];
  packetHex?: string;
  physicalVerificationReminder?: string;
  safetyNotes?: string[];
}): ControlledLightingWriteExport {
  const result =
    state.result ??
    createControlledLightingWriteResult({
      status: state.canRun ? "never-run" : "blocked",
      selectedInterface: state.selectedInterface,
      attemptedPacket: CONTROLLED_LIGHTING_WRITE_PACKET_BYTES,
      writeAttemptCount: 0,
      retryCount: 0,
      followUpPacketCount: 0,
      message: state.runDisabledReason,
      now,
    });

  return {
    exportType,
    timestamp: now.toISOString(),
    localOnly: true,
    noSensitiveData: true,
    implementationStatus: CONTROLLED_LIGHTING_WRITE_IMPLEMENTATION_STATUS,
    outcome: CONTROLLED_LIGHTING_WRITE_OUTCOME,
    actionName: CONTROLLED_LIGHTING_WRITE_ACTION_NAME,
    resultStatus: result.status,
    reportId: CONTROLLED_LIGHTING_WRITE_REPORT_ID,
    packetLength: CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH,
    packetHex,
    targetMetadata: CONTROLLED_LIGHTING_WRITE_TARGET_METADATA,
    selectedInterface: state.selectedInterface ? summarizeEvidenceInterface(state.selectedInterface) : undefined,
    gateResults: state.gates.map(sanitizeEvidenceGate),
    manualConfirmation: state.manualConfirmation,
    writeAttemptCount: result.writeAttemptCount,
    retryCount: 0,
    followUpPacketCount: 0,
    physicalVerificationReminder,
    message: result.message,
    safetyNotes: safetyNotes ?? [
      "WP21 implements exactly one experimental one-shot lighting write.",
      "The only executable packet is the fixed AA 23 10 packet with report ID 0 and 64 bytes.",
      "Packet bytes do not come from user input, imported profile data, RGB controls, fixtures, or the WP20 dry-run planner.",
      "One manual action can attempt at most one HID write; retries, polling, probing, hidden follow-up packets, and automatic rollback are not implemented.",
      "This is not full lighting support, profile write support, apply/sync/save-to-device behavior, or a general packet console.",
      "Evidence export is local and redacts HID paths and serial numbers.",
    ],
  };
}

export function createFunctionalLightingWriteExport({
  state,
  settings,
  now = new Date(),
}: {
  state: ControlledLightingWriteExperimentState;
  settings: FunctionalLightingSettings;
  now?: Date;
}): ControlledLightingWriteExport & { settings: FunctionalLightingSettings; variableByteIndexes: readonly number[] } {
  const packet = buildFunctionalLightingPacket(settings);
  return {
    ...createControlledLightingWriteExport({
      state,
      now,
      exportType: "ak680-wp22-functional-lighting-write-evidence",
      packetHex: formatHex(packet),
      physicalVerificationReminder: WP22_PHYSICAL_VERIFICATION_REMINDER,
      safetyNotes: [
        "WP22 implements functional global lighting writes for the approved AA 23 10 packet family only.",
        "Only colorMode, red, green, blue, brightness, speed, and direction fields can vary.",
        "No arbitrary packet input, raw command console, packet editor, RGB write outside the approved family, or profile apply behavior is implemented.",
        "One manual action can attempt at most one HID write; retries, polling, probing, hidden follow-up packets, and automatic rollback are not implemented.",
        "Evidence export is local and redacts HID paths and serial numbers.",
      ],
    }),
    settings,
    variableByteIndexes: FUNCTIONAL_LIGHTING_VARIABLE_INDEXES,
  };
}

function createControlledLightingWriteResult({
  status,
  selectedInterface,
  attemptedPacket,
  writeAttemptCount,
  retryCount,
  followUpPacketCount,
  message,
  now,
}: {
  status: ControlledLightingWriteRunStatus;
  selectedInterface?: HidDeviceMetadata;
  attemptedPacket: number[];
  writeAttemptCount: number;
  retryCount: number;
  followUpPacketCount: number;
  message: string;
  now: Date;
}): ControlledLightingWriteResult {
  const normalizedRetryCount: 0 = retryCount === 0 ? 0 : 0;
  const normalizedFollowUpPacketCount: 0 = followUpPacketCount === 0 ? 0 : 0;

  return {
    status,
    timestamp: now.toISOString(),
    implemented: true,
    outcome: CONTROLLED_LIGHTING_WRITE_OUTCOME,
    actionName: CONTROLLED_LIGHTING_WRITE_ACTION_NAME,
    target: selectedInterface ? summarizeTarget(selectedInterface) : undefined,
    reportId: CONTROLLED_LIGHTING_WRITE_REPORT_ID,
    packetLength: CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH,
    packetHex: formatHex(attemptedPacket),
    attemptedPacket,
    writeAttemptCount,
    retryCount: normalizedRetryCount,
    followUpPacketCount: normalizedFollowUpPacketCount,
    physicalVerificationReminder: WP21_PHYSICAL_VERIFICATION_REMINDER,
    message,
  };
}

function sanitizeEvidenceGate(gate: ControlledLightingWriteGate): ControlledLightingWriteGate {
  if (gate.label !== "Exact selected path/interface") {
    return gate;
  }

  return {
    ...gate,
    detail: gate.status === "pass" ? "Selected HID path/interface is present and redacted in evidence export." : gate.detail,
  };
}

function createControlledLightingWriteGates(
  hidDetection: HidDetectionResult | undefined,
  selectedPath: string | undefined,
  selectedInterface: HidDeviceMetadata | undefined,
  manualConfirmation: boolean,
): ControlledLightingWriteGate[] {
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
      label: "Exact selected path/interface",
      status: selectedInterface ? "pass" : "blocked",
      detail: selectedInterface
        ? `Selected ${selectedInterface.path}.`
        : selectedPath
          ? "Selected path is not a matching AK680 V2 interface."
          : "Select the exact AK680 V2 HID path/interface before this write can run.",
    },
    getUsageGate(selectedInterface),
    {
      label: "Manual checkbox confirmation",
      status: manualConfirmation ? "pass" : "blocked",
      detail: manualConfirmation
        ? "User checked the WP21 manual confirmation box."
        : "Check the WP21 manual confirmation box immediately before the write.",
    },
    {
      label: "Fixed packet scope",
      status: "pass",
      detail: "Only the fixed AA 23 10, report ID 0, 64-byte packet is available. No variants or user bytes.",
    },
    {
      label: "One-shot behavior",
      status: "info",
      detail: "One action attempts at most one write. Retry, polling, probing, follow-up, and automatic rollback counts are zero.",
    },
  ];
}

function getUsageGate(selectedInterface?: HidDeviceMetadata): ControlledLightingWriteGate {
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

  if (selectedInterface.usagePage !== CONTROLLED_LIGHTING_WRITE_REQUIRED_USAGE_PAGE) {
    return {
      label: "Usage page / usage target",
      status: "blocked",
      detail: "Selected interface usagePage is not the approved 65384.",
    };
  }

  if (selectedInterface.usage !== CONTROLLED_LIGHTING_WRITE_REQUIRED_USAGE) {
    return {
      label: "Usage page / usage target",
      status: "blocked",
      detail: "Selected interface usage is not the approved 97.",
    };
  }

  return {
    label: "Usage page / usage target",
    status: "pass",
    detail: "Selected metadata matches usagePage 65384 and usage 97.",
  };
}

function summarizeTarget(device: HidDeviceMetadata): ControlledLightingWriteTargetSummary {
  return {
    vendorId: device.vendorId,
    productId: device.productId,
    path: device.path ?? "Not available",
    usagePage: formatOptional(device.usagePage),
    usage: formatOptional(device.usage),
    interfaceNumber: formatOptional(device.interfaceNumber),
  };
}

function summarizeEvidenceInterface(device: HidDeviceMetadata): ControlledLightingWriteEvidenceInterface {
  return {
    vendorId: device.vendorId,
    productId: device.productId,
    usagePage: formatOptional(device.usagePage),
    usage: formatOptional(device.usage),
    interfaceNumber: formatOptional(device.interfaceNumber),
    pathRedacted: Boolean(device.path),
    serialNumberIncluded: false,
  };
}

function formatOptional(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return String(value);
}

function formatHex(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

function validateByte(value: number, field: string) {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new Error(`Lighting field ${field} must be an integer in 0..255.`);
  }

  return value;
}

function toByte(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(255, Math.max(0, Math.round(value))) : fallback;
}

export function assertWp21BoundariesForTests() {
  return {
    controlledReadReportId: CONTROLLED_READ_REPORT_ID,
    controlledReadRequestLength: CONTROLLED_READ_REQUEST_LENGTH,
    controlledReadRequestPrefix: CONTROLLED_READ_REQUEST_BYTES.slice(0, 8),
    controlledReadUsagePage: CONTROLLED_READ_REQUIRED_USAGE_PAGE,
    controlledReadUsage: CONTROLLED_READ_REQUIRED_USAGE,
    wp20DryRunReportId: LIGHTING_DRY_RUN_REPORT_ID,
    wp20DryRunLength: LIGHTING_DRY_RUN_PACKET_LENGTH,
    wp20DryRunExecutionEnabled: createLightingDryRunPlan().executionState.commandExecutionEnabled,
    wp20DryRunTargetMetadata: LIGHTING_DRY_RUN_TARGET_METADATA,
  };
}
