import {
  CONTROLLED_READ_REPORT_ID,
  CONTROLLED_READ_REQUEST_BYTES,
  CONTROLLED_READ_REQUEST_LENGTH,
  CONTROLLED_READ_REQUIRED_USAGE,
  CONTROLLED_READ_REQUIRED_USAGE_PAGE,
} from "./controlledReadExperiment";

export const WP15_EVIDENCE_SCHEMA_VERSION = 1;

export const READ_PROTOCOL_SOURCE_TYPES = [
  "official-app-observation",
  "webhid-trace",
  "hid-traffic-capture",
  "local-manual-observation",
  "ak680-studio-snapshot",
  "other-identified-source",
] as const;

export const READ_PROTOCOL_REPORT_DIRECTIONS = ["output-report", "input-report", "feature-report", "unknown"] as const;

export const READ_CANDIDATE_AREAS = [
  "device-info-follow-up",
  "lighting-state",
  "keymap-profile-state",
  "rapid-trigger-actuation-state",
  "socd-game-mode-state",
  "other-observed-read-only-area",
] as const;

export const READ_CANDIDATE_STATUSES = [
  "insufficient",
  "candidate-only",
  "ready-for-future-Red-Team-review",
] as const;

export type ReadProtocolSourceType = (typeof READ_PROTOCOL_SOURCE_TYPES)[number];
export type ReadProtocolReportDirection = (typeof READ_PROTOCOL_REPORT_DIRECTIONS)[number];
export type ReadCandidateArea = (typeof READ_CANDIDATE_AREAS)[number];
export type ReadCandidateStatus = (typeof READ_CANDIDATE_STATUSES)[number];

export interface ReadProtocolTargetIdentity {
  deviceName: string;
  vendorId: string;
  productId: string;
  interfacePath: string;
  usagePage: string;
  usage: string;
  interfaceNumber: string;
}

export interface ReadProtocolEnvironment {
  operatingSystem: string;
  connectionMode: string;
  observationTool: string;
}

export interface ReadProtocolEvidenceRecord {
  evidenceId: string;
  title: string;
  sourceType: ReadProtocolSourceType;
  sourceDateTime: string;
  collectorOrReviewerNote: string;
  target: ReadProtocolTargetIdentity;
  environment: ReadProtocolEnvironment;
  reportDirection: ReadProtocolReportDirection;
  reportId: string;
  requestLength: string;
  responseLength: string;
  observedRequestBytes: string;
  observedResponseBytesOrPrefix: string;
  timingContext: string;
  userActionContext: string;
  readWriteUncertainty: string;
  reproducibilityNotes: string;
  safetyNotes: string;
  gplSourceCleanlinessNotes: string;
  attachmentOrFixtureReferences: string[];
  reviewerNotes: string;
}

export interface CandidateReadDossier {
  candidateId: string;
  title: string;
  readArea: ReadCandidateArea;
  status: ReadCandidateStatus;
  evidenceSourceReferences: string[];
  completenessSummary: string;
  targetDeviceMetadata: string;
  observedReportDetails: string;
  timingUserActionContext: string;
  readOnlyRationale: string;
  writeRiskAssessment: string;
  unknownsAndUncertainties: string;
  safetyBoundaries: string;
  gplSourceCleanlinessStatement: string;
  reviewerNotes: string;
  futureReviewRequirements: string;
}

export interface ReadProtocolEvidencePack {
  schemaVersion: number;
  packId: string;
  title: string;
  evidenceOnly: true;
  commandExecutionEnabled: false;
  settingsReadSupportImplemented: false;
  writeSupportImplemented: false;
  wp13Boundary: {
    reportId: number;
    requestLength: number;
    requestPrefix: string;
    requiredVid: 3141;
    requiredPid: 32956;
    requiredUsagePage: number;
    requiredUsage: number;
    executionChangedByWp15: false;
  };
  records: ReadProtocolEvidenceRecord[];
  dossiers: CandidateReadDossier[];
  safetyNotes: string[];
}

export interface ReadProtocolValidationResult {
  valid: boolean;
  evidenceOnly: boolean;
  executionEnabled: false;
  settingsReadSupportImplemented: false;
  writeSupportImplemented: false;
  completenessScore: number;
  status: ReadCandidateStatus;
  errors: string[];
  warnings: string[];
  executableFieldPaths: string[];
  dossierResults: CandidateDossierValidationResult[];
}

export interface CandidateDossierValidationResult {
  candidateId: string;
  valid: boolean;
  status: ReadCandidateStatus;
  classifiedStatus: ReadCandidateStatus;
  completenessScore: number;
  readyForFutureRedTeamReview: boolean;
  executionEnabled: false;
  errors: string[];
  warnings: string[];
}

export interface ReadProtocolEvidencePackExport {
  exportType: "ak680-read-protocol-evidence-pack";
  timestamp: string;
  workPackage: "WP15";
  localOnly: true;
  evidenceOnly: true;
  commandExecutionEnabled: false;
  validationTouchesHidDevices: false;
  futureExecutionRequires: string;
  allowedCandidateStatuses: ReadCandidateStatus[];
  pack: ReadProtocolEvidencePack;
  validation: ReadProtocolValidationResult;
}

const REQUIRED_EVIDENCE_FIELDS: Array<keyof ReadProtocolEvidenceRecord> = [
  "evidenceId",
  "title",
  "sourceDateTime",
  "collectorOrReviewerNote",
  "reportId",
  "requestLength",
  "responseLength",
  "timingContext",
  "userActionContext",
  "readWriteUncertainty",
  "reproducibilityNotes",
  "safetyNotes",
  "gplSourceCleanlinessNotes",
  "reviewerNotes",
];

const REQUIRED_DOSSIER_FIELDS: Array<keyof CandidateReadDossier> = [
  "candidateId",
  "title",
  "evidenceSourceReferences",
  "completenessSummary",
  "targetDeviceMetadata",
  "observedReportDetails",
  "timingUserActionContext",
  "readOnlyRationale",
  "writeRiskAssessment",
  "unknownsAndUncertainties",
  "safetyBoundaries",
  "gplSourceCleanlinessStatement",
  "reviewerNotes",
  "futureReviewRequirements",
];

const EXECUTABLE_FIELD_NAMES = [
  "execute",
  "executable",
  "invoke",
  "tauriCommand",
  "commandRegistry",
  "runCommand",
  "sendReport",
  "deviceWrite",
  "rawCommand",
  "packetEditor",
  "payloadExecution",
];

export const WP15_SAFETY_NOTES = [
  "WP15 is evidence-only.",
  "Candidate read dossiers are non-executable records.",
  "Evidence completeness does not approve or enable command execution.",
  "Ready for future Red Team review is not a runnable status.",
  "The only executable HID command remains the WP13 AA 10 30 controlled read.",
  "No settings-read support is implemented in WP15.",
  "No write support, apply, sync, save-to-device, retries, polling, scanning, fuzzing, raw command console, arbitrary payload input, packet editing, or command registry execution is implemented.",
  "Validation, import, and export are local data operations and do not touch HID devices.",
  "GPL-3.0 source code, comments, constants, packet builders, structures, and implementation material must not be copied.",
];

export const EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK: ReadProtocolEvidencePack = {
  schemaVersion: WP15_EVIDENCE_SCHEMA_VERSION,
  packId: "ak680-wp15-example-pack",
  title: "WP15 example read-protocol evidence pack",
  evidenceOnly: true,
  commandExecutionEnabled: false,
  settingsReadSupportImplemented: false,
  writeSupportImplemented: false,
  wp13Boundary: {
    reportId: CONTROLLED_READ_REPORT_ID,
    requestLength: CONTROLLED_READ_REQUEST_LENGTH,
    requestPrefix: formatEvidenceBytes(CONTROLLED_READ_REQUEST_BYTES.slice(0, 8)),
    requiredVid: 3141,
    requiredPid: 32956,
    requiredUsagePage: CONTROLLED_READ_REQUIRED_USAGE_PAGE,
    requiredUsage: CONTROLLED_READ_REQUIRED_USAGE,
    executionChangedByWp15: false,
  },
  records: [
    {
      evidenceId: "wp13-controlled-read-observation",
      title: "Existing WP13 controlled device-info read boundary",
      sourceType: "ak680-studio-snapshot",
      sourceDateTime: "2026-06-30T00:00:00.000Z",
      collectorOrReviewerNote: "Sanitized project evidence for the already-approved WP13 command boundary.",
      target: {
        deviceName: "AJAZZ AK680 V2",
        vendorId: "3141",
        productId: "32956",
        interfacePath: "Redacted; exact selected path is required at runtime for WP13 only.",
        usagePage: String(CONTROLLED_READ_REQUIRED_USAGE_PAGE),
        usage: String(CONTROLLED_READ_REQUIRED_USAGE),
        interfaceNumber: "Observed where available; do not infer across devices.",
      },
      environment: {
        operatingSystem: "Document in real evidence; example is sanitized.",
        connectionMode: "USB/wired expected",
        observationTool: "AK680 Studio controlled read status export or local tester notes",
      },
      reportDirection: "output-report",
      reportId: String(CONTROLLED_READ_REPORT_ID),
      requestLength: String(CONTROLLED_READ_REQUEST_LENGTH),
      responseLength: "Document observed response length; do not infer settings state.",
      observedRequestBytes: formatEvidenceBytes(CONTROLLED_READ_REQUEST_BYTES),
      observedResponseBytesOrPrefix: "Optional observed response prefix only; leave blank if unavailable.",
      timingContext: "Manual explicit confirmation only; no startup, polling, retry, scan, or automatic execution.",
      userActionContext: "Existing WP13 controlled device-info read button, if a tester performed it.",
      readWriteUncertainty: "Existing WP13 query is approved only for controlled device-info read; no settings-read support is claimed.",
      reproducibilityNotes: "Record observation count and byte stability if hardware testing is performed.",
      safetyNotes: "Evidence only. Does not approve new commands, settings reads, writes, retries, polling, or scanning.",
      gplSourceCleanlinessNotes:
        "Maintainer-authored project evidence only; no GPL-3.0 code, comments, constants, packet builders, structures, or implementation copied.",
      attachmentOrFixtureReferences: ["fixtures/wp15-read-protocol-evidence.example.json"],
      reviewerNotes: "Use as a format example and WP13 boundary reminder, not as new execution approval.",
    },
  ],
  dossiers: [
    {
      candidateId: "lighting-state-read-placeholder",
      title: "Lighting state read evidence placeholder",
      readArea: "lighting-state",
      status: "insufficient",
      evidenceSourceReferences: [],
      completenessSummary: "No safe exact report evidence is present.",
      targetDeviceMetadata: "Must be AK680 V2 VID 3141 / PID 32956 if future evidence exists.",
      observedReportDetails: "No observed report details; no bytes are proposed.",
      timingUserActionContext: "Unknown.",
      readOnlyRationale: "Missing; future evidence required.",
      writeRiskAssessment: "Unknown write risk; must remain non-executable.",
      unknownsAndUncertainties: "Exact report direction, ID, bytes, response shape, and read-only proof are unknown.",
      safetyBoundaries: "No execution, no settings-read claim, no write support claim.",
      gplSourceCleanlinessStatement:
        "No GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material copied.",
      reviewerNotes: "Placeholder demonstrates an insufficient candidate status.",
      futureReviewRequirements: "Separate future work package and Red Team plan required before any implementation.",
    },
  ],
  safetyNotes: WP15_SAFETY_NOTES,
};

export function createReadProtocolEvidencePackExport({
  pack = EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK,
  now = new Date(),
}: {
  pack?: ReadProtocolEvidencePack;
  now?: Date;
} = {}): ReadProtocolEvidencePackExport {
  return {
    exportType: "ak680-read-protocol-evidence-pack",
    timestamp: now.toISOString(),
    workPackage: "WP15",
    localOnly: true,
    evidenceOnly: true,
    commandExecutionEnabled: false,
    validationTouchesHidDevices: false,
    futureExecutionRequires: "A separate future work package, documented evidence review, and Red Team plan.",
    allowedCandidateStatuses: [...READ_CANDIDATE_STATUSES],
    pack,
    validation: validateReadProtocolEvidencePack(pack),
  };
}

export function parseReadProtocolEvidencePackJson(text: string): ReadProtocolValidationResult {
  try {
    const parsed: unknown = JSON.parse(text);
    return validateReadProtocolEvidencePack(parsed);
  } catch {
    return createInvalidResult(["Evidence pack JSON could not be parsed."]);
  }
}

export function validateReadProtocolEvidencePack(input: unknown): ReadProtocolValidationResult {
  const executableFieldPaths = findExecutableFieldPaths(input);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(input)) {
    return createInvalidResult(["Evidence pack must be a JSON object."], executableFieldPaths);
  }

  if (input.schemaVersion !== WP15_EVIDENCE_SCHEMA_VERSION) {
    errors.push("Unsupported or missing evidence schema version.");
  }
  if (input.evidenceOnly !== true) {
    errors.push("Evidence pack must set evidenceOnly to true.");
  }
  if (input.commandExecutionEnabled !== false) {
    errors.push("Evidence pack must set commandExecutionEnabled to false.");
  }
  if (input.settingsReadSupportImplemented !== false) {
    errors.push("Evidence pack must not claim settings-read support.");
  }
  if (input.writeSupportImplemented !== false) {
    errors.push("Evidence pack must not claim write support.");
  }
  if (executableFieldPaths.length > 0) {
    errors.push("Executable-looking fields are not allowed in WP15 evidence data.");
  }

  const records = Array.isArray(input.records) ? input.records : [];
  const dossiers = Array.isArray(input.dossiers) ? input.dossiers : [];
  if (!Array.isArray(input.records)) {
    errors.push("Evidence records must be an array.");
  }
  if (!Array.isArray(input.dossiers)) {
    errors.push("Candidate dossiers must be an array.");
  }
  if (records.length === 0) {
    warnings.push("No evidence records are present.");
  }
  if (dossiers.length === 0) {
    warnings.push("No candidate dossiers are present.");
  }

  const evidenceIds = new Set<string>();
  const recordScores = records.map((record, index) => validateEvidenceRecord(record, index, errors, warnings, evidenceIds));
  const dossierResults = dossiers.map((dossier, index) =>
    validateCandidateReadDossier(dossier, index, evidenceIds, errors),
  );
  const scoredItems = [...recordScores, ...dossierResults.map((result) => result.completenessScore)];
  const completenessScore =
    scoredItems.length > 0 ? Math.round(scoredItems.reduce((total, score) => total + score, 0) / scoredItems.length) : 0;
  const anyReady = dossierResults.some((result) => result.readyForFutureRedTeamReview);
  const anyCandidate = dossierResults.some((result) => result.classifiedStatus === "candidate-only");
  const status: ReadCandidateStatus = anyReady ? "ready-for-future-Red-Team-review" : anyCandidate ? "candidate-only" : "insufficient";
  const valid = errors.length === 0;

  return {
    valid,
    evidenceOnly: input.evidenceOnly === true,
    executionEnabled: false,
    settingsReadSupportImplemented: false,
    writeSupportImplemented: false,
    completenessScore,
    status: valid ? status : "insufficient",
    errors,
    warnings,
    executableFieldPaths,
    dossierResults,
  };
}

function validateEvidenceRecord(
  input: unknown,
  index: number,
  errors: string[],
  warnings: string[],
  evidenceIds: Set<string>,
): number {
  if (!isRecord(input)) {
    errors.push(`Evidence record ${index + 1} must be an object.`);
    return 0;
  }

  const missingFields = REQUIRED_EVIDENCE_FIELDS.filter((field) => {
    const value = input[field];
    return typeof value !== "string" || value.trim().length === 0;
  });
  if (missingFields.length > 0) {
    warnings.push(`Evidence record ${index + 1} is missing: ${missingFields.join(", ")}.`);
  }

  if (!READ_PROTOCOL_SOURCE_TYPES.includes(input.sourceType as ReadProtocolSourceType)) {
    errors.push(`Evidence record ${index + 1} has an unsupported source type.`);
  }
  if (!READ_PROTOCOL_REPORT_DIRECTIONS.includes(input.reportDirection as ReadProtocolReportDirection)) {
    errors.push(`Evidence record ${index + 1} has an unsupported report direction.`);
  }
  if (typeof input.evidenceId === "string" && input.evidenceId.trim().length > 0) {
    evidenceIds.add(input.evidenceId);
  }

  validateOptionalByteString(input.observedRequestBytes, `Evidence record ${index + 1} observed request bytes`, errors);
  validateOptionalByteString(
    input.observedResponseBytesOrPrefix,
    `Evidence record ${index + 1} observed response bytes`,
    errors,
  );

  return calculateScore(REQUIRED_EVIDENCE_FIELDS.length, missingFields.length);
}

function validateCandidateReadDossier(
  input: unknown,
  index: number,
  evidenceIds: Set<string>,
  packErrors: string[],
): CandidateDossierValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(input)) {
    return {
      candidateId: `candidate-${index + 1}`,
      valid: false,
      status: "insufficient",
      classifiedStatus: "insufficient",
      completenessScore: 0,
      readyForFutureRedTeamReview: false,
      executionEnabled: false,
      errors: [`Candidate dossier ${index + 1} must be an object.`],
      warnings,
    };
  }

  const candidateId = typeof input.candidateId === "string" && input.candidateId ? input.candidateId : `candidate-${index + 1}`;
  const status = READ_CANDIDATE_STATUSES.includes(input.status as ReadCandidateStatus)
    ? (input.status as ReadCandidateStatus)
    : "insufficient";
  if (!READ_CANDIDATE_STATUSES.includes(input.status as ReadCandidateStatus)) {
    errors.push("Candidate status is not an allowed non-execution status.");
  }
  if (!READ_CANDIDATE_AREAS.includes(input.readArea as ReadCandidateArea)) {
    errors.push("Candidate read area is not allowed.");
  }

  const missingFields = REQUIRED_DOSSIER_FIELDS.filter((field) => {
    const value = input[field];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return typeof value !== "string" || value.trim().length === 0;
  });
  if (missingFields.length > 0) {
    warnings.push(`Missing dossier fields: ${missingFields.join(", ")}.`);
  }

  const references = Array.isArray(input.evidenceSourceReferences) ? input.evidenceSourceReferences : [];
  const missingReferences = references.filter((reference) => typeof reference !== "string" || !evidenceIds.has(reference));
  if (missingReferences.length > 0) {
    errors.push("Candidate dossier references evidence IDs that are not present in the pack.");
  }

  const completenessScore = calculateScore(REQUIRED_DOSSIER_FIELDS.length, missingFields.length);
  const valid = errors.length === 0;
  const classifiedStatus = classifyCandidateDossier(status, valid, completenessScore, references.length);
  const readyForFutureRedTeamReview = classifiedStatus === "ready-for-future-Red-Team-review";

  packErrors.push(...errors.map((error) => `${candidateId}: ${error}`));

  return {
    candidateId,
    valid,
    status,
    classifiedStatus,
    completenessScore,
    readyForFutureRedTeamReview,
    executionEnabled: false,
    errors,
    warnings,
  };
}

function classifyCandidateDossier(
  requestedStatus: ReadCandidateStatus,
  valid: boolean,
  completenessScore: number,
  referenceCount: number,
): ReadCandidateStatus {
  if (!valid || completenessScore < 70 || referenceCount === 0) {
    return "insufficient";
  }
  if (requestedStatus === "ready-for-future-Red-Team-review" && completenessScore >= 95) {
    return "ready-for-future-Red-Team-review";
  }
  return "candidate-only";
}

function validateOptionalByteString(value: unknown, label: string, errors: string[]) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return;
  }
  const normalized = value.trim().toLowerCase();
  if (["unknown", "not available", "n/a", "none"].includes(normalized) || normalized.includes("optional")) {
    return;
  }
  if (!parseEvidenceHexBytes(value)) {
    errors.push(`${label} must be parseable hex evidence bytes or a documented unknown placeholder.`);
  }
}

export function parseEvidenceHexBytes(value: string): number[] | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return [];
  }
  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  if (tokens.some((token) => !/^[0-9a-fA-F]{2}$/.test(token))) {
    return undefined;
  }
  return tokens.map((token) => Number.parseInt(token, 16));
}

function findExecutableFieldPaths(value: unknown, prefix = ""): string[] {
  if (!isRecord(value) && !Array.isArray(value)) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findExecutableFieldPaths(item, `${prefix}[${index}]`));
  }
  return Object.entries(value).flatMap(([key, nested]) => {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    const keyLooksExecutable = EXECUTABLE_FIELD_NAMES.some((name) => key.toLowerCase() === name.toLowerCase());
    return [...(keyLooksExecutable ? [currentPath] : []), ...findExecutableFieldPaths(nested, currentPath)];
  });
}

function createInvalidResult(errors: string[], executableFieldPaths: string[] = []): ReadProtocolValidationResult {
  return {
    valid: false,
    evidenceOnly: false,
    executionEnabled: false,
    settingsReadSupportImplemented: false,
    writeSupportImplemented: false,
    completenessScore: 0,
    status: "insufficient",
    errors,
    warnings: [],
    executableFieldPaths,
    dossierResults: [],
  };
}

function calculateScore(total: number, missing: number) {
  return Math.max(0, Math.round(((total - missing) / total) * 100));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatEvidenceBytes(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}
