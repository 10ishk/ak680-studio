import {
  CONTROLLED_READ_QUERY_NAME,
  CONTROLLED_READ_REPORT_ID,
  CONTROLLED_READ_REQUEST_BYTES,
  CONTROLLED_READ_REQUEST_HEX,
  CONTROLLED_READ_REQUEST_LENGTH,
  CONTROLLED_READ_REQUIRED_USAGE,
  CONTROLLED_READ_REQUIRED_USAGE_PAGE,
  formatResponseHex,
  type ControlledReadExperimentState,
  type ControlledReadRunStatus,
} from "./controlledReadExperiment";
import type { HidDeviceMetadata } from "../types/hid";
import type { AjazzProfile } from "../types/profile";

export const READ_ONLY_SNAPSHOT_SCHEMA_VERSION = 1;
export const READ_ONLY_COMMAND_PACK_VERSION = "wp16-read-only-command-pack-v1";
export const READ_ONLY_COMMAND_TIMEOUT_MS = 500;

export type ReadOnlyCommandId = "wp13-device-info-read";
export type ReadOnlyCommandConfidence = "none" | "low" | "medium";
export type SnapshotCommandStatus = ControlledReadRunStatus;
export type SnapshotCompareCategory =
  | "match"
  | "difference"
  | "unknown on device"
  | "unknown in profile"
  | "unsupported by current read-only command pack"
  | "parser warning"
  | "not comparable";

export interface ApprovedReadOnlyCommand {
  id: ReadOnlyCommandId;
  name: string;
  readArea: "device-info";
  evidenceSource: string;
  reportDirection: "output-report";
  reportId: number;
  requestLength: number;
  requestBytes: number[];
  requestHex: string;
  targetDevice: "AJAZZ AK680 V2";
  vendorId: 3141;
  productId: 32956;
  requiredInterface: {
    usagePage: number;
    usage: number;
    exactSelectedPathRequired: true;
    keyboardInterfaceBlocked: true;
    consumerControlInterfaceBlocked: true;
  };
  timeoutMs: number;
  expectedResponseLengthRange: {
    min: number;
    max: number;
  };
  parserStatus: "minimal-prefix-parser";
  knownFields: string[];
  unknownFields: string[];
  safetyRationale: string;
  gplSourceCleanlinessNote: string;
  manualConfirmationRequired: true;
  oneShotOnly: true;
  retryCount: 0;
  pollingEnabled: false;
  automaticExecutionEnabled: false;
}

export interface ParsedReadOnlyResponse {
  commandId: ReadOnlyCommandId;
  status: "not-run" | "parsed" | "invalid" | "empty";
  responseLength: number;
  rawBytes: number[];
  rawHex: string;
  knownFields: Array<{ key: string; label: string; value: string; confidence: ReadOnlyCommandConfidence }>;
  unknownFields: Array<{ label: string; byteRange: string; value: string }>;
  parserWarnings: string[];
  confidence: ReadOnlyCommandConfidence;
}

export interface ReadOnlyCommandSnapshotEntry {
  commandId: ReadOnlyCommandId;
  commandName: string;
  status: SnapshotCommandStatus;
  timestamp?: string;
  reportId: number;
  requestLength: number;
  responseLength: number;
  rawResponseHex: string;
  parserVersion: string;
  parsed: ParsedReadOnlyResponse;
  evidenceSource: string;
}

export interface ReadOnlyDeviceSnapshot {
  schemaVersion: number;
  snapshotId: string;
  timestamp: string;
  appVersion: string;
  deviceIdentity: "3141:32956:AJAZZ AK680 V2";
  vendorId: 3141;
  productId: 32956;
  selectedInterface: {
    path: string;
    pathRedacted: string;
    usagePage: string;
    usage: string;
    interfaceNumber: string;
  };
  sourceCommands: ReadOnlyCommandId[];
  commandResults: ReadOnlyCommandSnapshotEntry[];
  readOnly: true;
  writeSupport: false;
  applySyncSaveToDeviceSupport: false;
  settingsReadCoverage: "limited-approved-commands-only";
  hardwareReadPerformed: boolean;
  dataOrigin: "live-controlled-read-result" | "local-state-no-hardware-read";
  safetyNotes: string[];
}

export interface SnapshotCompareRow {
  field: string;
  category: SnapshotCompareCategory;
  deviceValue: string;
  profileValue: string;
  source: string;
  confidence: ReadOnlyCommandConfidence;
}

export interface SnapshotCompareSummary {
  comparedAt: string;
  comparisonType: "snapshot-vs-profile";
  readOnly: true;
  rows: SnapshotCompareRow[];
  safetyNotes: string[];
}

export interface FutureWriteGate {
  enabled: false;
  status: "disabled";
  reason: string;
  requiresSeparateWorkPackage: true;
  requiresRedTeamPlan: true;
  bypassAvailable: false;
  hidAccessAllowed: false;
  checklist: Array<{ label: string; status: "blocked"; detail: string }>;
}

export const APPROVED_READ_ONLY_COMMANDS: ApprovedReadOnlyCommand[] = [
  {
    id: "wp13-device-info-read",
    name: CONTROLLED_READ_QUERY_NAME,
    readArea: "device-info",
    evidenceSource: "WP12 evidence accepted for WP13; preserved through WP15/WP16. No additional WP15 candidate qualifies.",
    reportDirection: "output-report",
    reportId: CONTROLLED_READ_REPORT_ID,
    requestLength: CONTROLLED_READ_REQUEST_LENGTH,
    requestBytes: [...CONTROLLED_READ_REQUEST_BYTES],
    requestHex: CONTROLLED_READ_REQUEST_HEX,
    targetDevice: "AJAZZ AK680 V2",
    vendorId: 3141,
    productId: 32956,
    requiredInterface: {
      usagePage: CONTROLLED_READ_REQUIRED_USAGE_PAGE,
      usage: CONTROLLED_READ_REQUIRED_USAGE,
      exactSelectedPathRequired: true,
      keyboardInterfaceBlocked: true,
      consumerControlInterfaceBlocked: true,
    },
    timeoutMs: READ_ONLY_COMMAND_TIMEOUT_MS,
    expectedResponseLengthRange: {
      min: 0,
      max: 64,
    },
    parserStatus: "minimal-prefix-parser",
    knownFields: ["responsePrefix", "observedVidPidLikeBytes"],
    unknownFields: ["allOtherResponseBytes"],
    safetyRationale:
      "Existing one-shot controlled read only. It displays observed bytes without inferring firmware, settings, calibration, layout, memory, profile, or write capability.",
    gplSourceCleanlinessNote:
      "Maintainer-authored command specification from accepted project evidence; no GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material copied.",
    manualConfirmationRequired: true,
    oneShotOnly: true,
    retryCount: 0,
    pollingEnabled: false,
    automaticExecutionEnabled: false,
  },
];

export const FUTURE_WRITE_GATE: FutureWriteGate = {
  enabled: false,
  status: "disabled",
  reason: "Hardware writes require a separate future work package, explicit protocol evidence, backup plan, and Red Team plan.",
  requiresSeparateWorkPackage: true,
  requiresRedTeamPlan: true,
  bypassAvailable: false,
  hidAccessAllowed: false,
  checklist: [
    {
      label: "Write protocol evidence",
      status: "blocked",
      detail: "Not approved in WP16.",
    },
    {
      label: "Backup-before-write behavior",
      status: "blocked",
      detail: "Future safety requirement only; no write path exists.",
    },
    {
      label: "Apply/sync/save-to-device execution",
      status: "blocked",
      detail: "Not implemented.",
    },
  ],
};

export const READ_ONLY_FOUNDATION_SAFETY_NOTES = [
  "WP16 approves only the existing WP13 AA 10 30 controlled read.",
  "No additional WP15 candidate dossier is promoted into execution.",
  "Each approved read requires manual confirmation and is one-shot only.",
  "Canceling the confirmation sends nothing.",
  "No retries, polling, scanning, fuzzing, brute force, probing, or automatic execution are implemented.",
  "Snapshot viewer, compare, local editor, diff, backup, import, and export are local/read-only and do not trigger hidden HID access.",
  "Future write gate remains disabled and requires a separate work package and Red Team plan.",
  "Unknown bytes remain unknown; no unsupported firmware, settings, calibration, layout, memory, profile, or write-capability inference is made.",
  "No GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material was copied.",
];

export function getApprovedReadOnlyCommand(id: ReadOnlyCommandId): ApprovedReadOnlyCommand {
  const command = APPROVED_READ_ONLY_COMMANDS.find((item) => item.id === id);
  if (!command) {
    throw new Error(`Unknown approved read-only command: ${id}`);
  }
  return command;
}

export function parseApprovedReadOnlyResponse({
  commandId,
  responseBytes,
}: {
  commandId: ReadOnlyCommandId;
  responseBytes: number[];
}): ParsedReadOnlyResponse {
  const rawHex = formatResponseHex(responseBytes);
  if (responseBytes.length === 0) {
    return {
      commandId,
      status: "empty",
      responseLength: 0,
      rawBytes: [],
      rawHex,
      knownFields: [],
      unknownFields: [],
      parserWarnings: ["No response bytes are available."],
      confidence: "none",
    };
  }

  const parserWarnings: string[] = [];
  const prefix = formatResponseHex(responseBytes.slice(0, 3));
  if (prefix !== "55 10 30") {
    parserWarnings.push("Response prefix does not match the observed 55 10 30 prefix.");
  }
  if (responseBytes.length < 16) {
    parserWarnings.push("Response is too short for observed VID/PID-like byte display.");
  }
  if (responseBytes.length > 64) {
    parserWarnings.push("Response is longer than the documented range for the current minimal parser.");
  }

  const knownFields = [
    {
      key: "responsePrefix",
      label: "Observed response prefix",
      value: prefix || "Not available",
      confidence: prefix === "55 10 30" ? ("medium" as const) : ("low" as const),
    },
  ];
  if (responseBytes.length >= 16) {
    knownFields.push({
      key: "observedVidPidLikeBytes",
      label: "Observed VID/PID-like bytes",
      value: formatResponseHex(responseBytes.slice(12, 16)),
      confidence: "low",
    });
  }

  return {
    commandId,
    status: parserWarnings.length > 0 ? "invalid" : "parsed",
    responseLength: responseBytes.length,
    rawBytes: [...responseBytes],
    rawHex,
    knownFields,
    unknownFields:
      responseBytes.length > 3
        ? [
            {
              label: "Unparsed response bytes",
              byteRange: "3..end",
              value: formatResponseHex(responseBytes.slice(3)),
            },
          ]
        : [],
    parserWarnings,
    confidence: parserWarnings.length > 0 ? "low" : "medium",
  };
}

export function createReadOnlyDeviceSnapshot({
  controlledReadState,
  appVersion,
  selectedInterface,
  now = new Date(),
}: {
  controlledReadState: ControlledReadExperimentState;
  appVersion: string;
  selectedInterface?: HidDeviceMetadata;
  now?: Date;
}): ReadOnlyDeviceSnapshot {
  const result = controlledReadState.result;
  const command = getApprovedReadOnlyCommand("wp13-device-info-read");
  const parsed = parseApprovedReadOnlyResponse({
    commandId: command.id,
    responseBytes: result?.responseBytes ?? [],
  });

  return {
    schemaVersion: READ_ONLY_SNAPSHOT_SCHEMA_VERSION,
    snapshotId: `ak680-snapshot-${now.toISOString()}`,
    timestamp: now.toISOString(),
    appVersion,
    deviceIdentity: "3141:32956:AJAZZ AK680 V2",
    vendorId: 3141,
    productId: 32956,
    selectedInterface: summarizeSnapshotInterface(selectedInterface ?? controlledReadState.selectedInterface),
    sourceCommands: [command.id],
    commandResults: [
      {
        commandId: command.id,
        commandName: command.name,
        status: result?.status ?? controlledReadState.runStatus,
        timestamp: result?.timestamp,
        reportId: command.reportId,
        requestLength: command.requestLength,
        responseLength: result?.responseLength ?? 0,
        rawResponseHex: result?.responseHex ?? "",
        parserVersion: "wp16-minimal-prefix-parser-v1",
        parsed,
        evidenceSource: command.evidenceSource,
      },
    ],
    readOnly: true,
    writeSupport: false,
    applySyncSaveToDeviceSupport: false,
    settingsReadCoverage: "limited-approved-commands-only",
    hardwareReadPerformed: result?.status === "success",
    dataOrigin: result ? "live-controlled-read-result" : "local-state-no-hardware-read",
    safetyNotes: READ_ONLY_FOUNDATION_SAFETY_NOTES,
  };
}

export function createSnapshotProfileComparison({
  snapshot,
  profile,
  now = new Date(),
}: {
  snapshot: ReadOnlyDeviceSnapshot;
  profile?: AjazzProfile;
  now?: Date;
}): SnapshotCompareSummary {
  const prefixField = snapshot.commandResults[0]?.parsed.knownFields.find((field) => field.key === "responsePrefix");
  const parserWarnings = snapshot.commandResults.flatMap((entry) => entry.parsed.parserWarnings);

  return {
    comparedAt: now.toISOString(),
    comparisonType: "snapshot-vs-profile",
    readOnly: true,
    rows: [
      {
        field: "Device identity",
        category: profile?.deviceId
          ? profile.deviceId === snapshot.deviceIdentity
            ? "match"
            : "difference"
          : "unknown in profile",
        deviceValue: snapshot.deviceIdentity,
        profileValue: profile?.deviceId ?? "Not available",
        source: "Snapshot metadata and imported/local profile JSON",
        confidence: "medium",
      },
      {
        field: "Controlled read response prefix",
        category: prefixField ? (parserWarnings.length > 0 ? "parser warning" : "not comparable") : "unknown on device",
        deviceValue: prefixField?.value ?? "Not available",
        profileValue: "No comparable profile field",
        source: "WP13 controlled read minimal parser",
        confidence: prefixField?.confidence ?? "none",
      },
      {
        field: "Lighting state",
        category: "unsupported by current read-only command pack",
        deviceValue: "Not read by approved command pack",
        profileValue: profile?.ledEffect ? "Present in profile JSON" : "Unknown in profile",
        source: "Current WP16 command pack",
        confidence: "none",
      },
      {
        field: "Keymap/profile state",
        category: "unsupported by current read-only command pack",
        deviceValue: "Not read by approved command pack",
        profileValue: profile?.keyList ? "Present in profile JSON" : "Unknown in profile",
        source: "Current WP16 command pack",
        confidence: "none",
      },
      {
        field: "RT/SOCD settings",
        category: "unsupported by current read-only command pack",
        deviceValue: "Not read by approved command pack",
        profileValue: profile?.magneticAxisRT || profile?.gameModeInfo ? "Present in profile JSON" : "Unknown in profile",
        source: "Current WP16 command pack",
        confidence: "none",
      },
    ],
    safetyNotes: [
      "Comparison is local/read-only analysis.",
      "Unsupported fields are not treated as differences.",
      "Differences cannot be applied, synced, saved to device, or written from WP16.",
    ],
  };
}

export function createReadOnlySnapshotExport({
  snapshot,
  comparison,
  now = new Date(),
}: {
  snapshot: ReadOnlyDeviceSnapshot;
  comparison?: SnapshotCompareSummary;
  now?: Date;
}) {
  return {
    exportType: "ak680-read-only-device-snapshot",
    timestamp: now.toISOString(),
    workPackage: "WP16",
    localOnly: true,
    readOnly: true,
    hidAccessDuringExport: false,
    commandExecutionDuringExport: false,
    writeSupport: false,
    applySyncSaveToDeviceSupport: false,
    approvedCommands: APPROVED_READ_ONLY_COMMANDS.map((command) => ({
      id: command.id,
      name: command.name,
      reportId: command.reportId,
      requestLength: command.requestLength,
      requestHex: command.requestHex,
      timeoutMs: command.timeoutMs,
    })),
    snapshot,
    comparison,
    futureWriteGate: FUTURE_WRITE_GATE,
  };
}

function summarizeSnapshotInterface(device?: HidDeviceMetadata) {
  return {
    path: device?.path ?? "Not selected",
    pathRedacted: device?.path ? "Present; hidden in summary UI unless exported intentionally" : "Not selected",
    usagePage: formatOptional(device?.usagePage),
    usage: formatOptional(device?.usage),
    interfaceNumber: formatOptional(device?.interfaceNumber),
  };
}

function formatOptional(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }
  return String(value);
}
