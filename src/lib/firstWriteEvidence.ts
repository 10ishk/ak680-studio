import { parseEvidenceHexBytes } from "./readProtocolEvidence";

export const FIRST_WRITE_SCHEMA_VERSION = 1;

export const FIRST_WRITE_STATUSES = [
  "insufficient-evidence",
  "rejected-too-risky",
  "candidate-only",
  "ready-for-future-Red-Team-review",
] as const;

export const FIRST_WRITE_CATEGORIES = [
  "simple-lighting-setting-write",
  "low-risk-visual-only-setting",
  "reversible-setting",
  "other-proposed-first-write-category",
  "blocked-full-profile-apply",
  "blocked-keymap-write",
  "blocked-macro-write",
  "blocked-rt-actuation-write",
  "blocked-socd-game-mode-write",
  "blocked-calibration",
  "blocked-firmware-bootloader-dfu",
  "blocked-factory-reset",
  "blocked-persistent-unknown-memory-write",
  "blocked-ambiguous-command",
] as const;

export const HARDWARE_RISK_CLASSIFICATIONS = [
  "visual-only-low-risk",
  "single-setting-low-risk",
  "persistent-setting-moderate-risk",
  "profile-wide-high-risk",
  "safety-critical-high-risk",
  "firmware-or-calibration-blocked",
  "unknown-risk-blocked",
] as const;

export type FirstWriteStatus = (typeof FIRST_WRITE_STATUSES)[number];
export type FirstWriteCategory = (typeof FIRST_WRITE_CATEGORIES)[number];
export type HardwareRiskClassification = (typeof HARDWARE_RISK_CLASSIFICATIONS)[number];

export interface FirstWriteEvidenceRecord {
  evidenceId: string;
  title: string;
  sourceType: string;
  sourceDateTime: string;
  collectorOrReviewer: string;
  targetDeviceIdentity: string;
  environment: string;
  userActionContext: string;
  reportDirectionOrType: string;
  reportId: string;
  requestLength: string;
  observedRequestBytes: string;
  observedResponseOrAck: string;
  timingSequence: string;
  mutationStateUncertainty: string;
  reversibilityNotes: string;
  backupPossibility: string;
  readBackPossibility: string;
  physicalVerificationMethod: string;
  hardwareRiskNotes: string;
  gplSourceCleanlinessStatement: string;
  redactionSanitizationStatus: string;
  reviewerNotes: string;
}

export interface FirstWriteCandidateDossier {
  candidateId: string;
  title: string;
  category: FirstWriteCategory;
  status: FirstWriteStatus;
  evidenceReferences: string[];
  observedRequestBytes: string;
  reportId: string;
  requestLength: string;
  targetInterfaceMetadata: string;
  expectedResponseAcknowledgement: string;
  officialAppUserActionContext: string;
  mutationScope: string;
  riskScore: number;
  riskScoreExplanation: string;
  reversibilityScore: number;
  reversibilityScoreExplanation: string;
  rollbackRecoveryPlan: string;
  preWriteBackupRequirements: string;
  readBackVerificationPlan: string;
  physicalVerificationPlan: string;
  hardwareRiskClassification: HardwareRiskClassification;
  safetyRationale: string;
  rejectionRationale: string;
  unknownsAndUncertainties: string;
  gplSourceCleanlinessStatement: string;
  futureImplementationRequirements: string;
  futureRedTeamReviewRequirements: string;
  reviewerNotes: string;
}

export interface FirstWriteEvidencePack {
  schemaVersion: number;
  packId: string;
  title: string;
  evidenceOnly: true;
  writeExecutionApproved: false;
  writeSupportImplemented: false;
  commandExecutionEnabled: false;
  currentExecutableBoundary: "wp13-device-info-read-only";
  records: FirstWriteEvidenceRecord[];
  candidates: FirstWriteCandidateDossier[];
  safetyNotes: string[];
}

export interface FirstWriteCandidateValidation {
  candidateId: string;
  status: FirstWriteStatus;
  classifiedStatus: FirstWriteStatus;
  riskScore: number;
  reversibilityScore: number;
  hardwareRiskClassification: HardwareRiskClassification;
  readyForFutureRedTeamReview: boolean;
  executionEnabled: false;
  writeApproved: false;
  errors: string[];
  warnings: string[];
}

export interface FirstWriteValidationResult {
  valid: boolean;
  evidenceOnly: boolean;
  executionEnabled: false;
  writeApproved: false;
  writeSupportImplemented: false;
  errors: string[];
  warnings: string[];
  executableFieldPaths: string[];
  candidateResults: FirstWriteCandidateValidation[];
}

export interface FirstWriteEvidenceExport {
  exportType: "ak680-first-write-evidence-plan";
  timestamp: string;
  workPackage: "WP17";
  localOnly: true;
  evidenceOnly: true;
  writeExecutionApproved: false;
  commandExecutionEnabled: false;
  validationTouchesHidDevices: false;
  futureImplementationRequires: string;
  pack: FirstWriteEvidencePack;
  validation: FirstWriteValidationResult;
  disabledWriteReadinessChecklist: DisabledWriteReadinessChecklistItem[];
}

export interface DisabledWriteReadinessChecklistItem {
  label: string;
  status: "blocked";
  detail: string;
}

const REQUIRED_EVIDENCE_FIELDS: Array<keyof FirstWriteEvidenceRecord> = [
  "evidenceId",
  "title",
  "sourceType",
  "sourceDateTime",
  "collectorOrReviewer",
  "targetDeviceIdentity",
  "environment",
  "userActionContext",
  "reportDirectionOrType",
  "mutationStateUncertainty",
  "reversibilityNotes",
  "backupPossibility",
  "readBackPossibility",
  "physicalVerificationMethod",
  "hardwareRiskNotes",
  "gplSourceCleanlinessStatement",
  "redactionSanitizationStatus",
  "reviewerNotes",
];

const REQUIRED_CANDIDATE_FIELDS: Array<keyof FirstWriteCandidateDossier> = [
  "candidateId",
  "title",
  "evidenceReferences",
  "targetInterfaceMetadata",
  "officialAppUserActionContext",
  "mutationScope",
  "riskScoreExplanation",
  "reversibilityScoreExplanation",
  "rollbackRecoveryPlan",
  "preWriteBackupRequirements",
  "readBackVerificationPlan",
  "physicalVerificationPlan",
  "safetyRationale",
  "unknownsAndUncertainties",
  "gplSourceCleanlinessStatement",
  "futureImplementationRequirements",
  "futureRedTeamReviewRequirements",
  "reviewerNotes",
];

const EXECUTABLE_FIELD_NAMES = [
  "execute",
  "write",
  "writeCommand",
  "runWrite",
  "executeWrite",
  "invoke",
  "tauriCommand",
  "commandRegistry",
  "rawCommand",
  "packetEditor",
  "payloadExecution",
  "sendReport",
  "applyToDevice",
  "saveToDevice",
  "syncToDevice",
];

const BLOCKED_CATEGORIES = new Set<FirstWriteCategory>([
  "blocked-full-profile-apply",
  "blocked-keymap-write",
  "blocked-macro-write",
  "blocked-rt-actuation-write",
  "blocked-socd-game-mode-write",
  "blocked-calibration",
  "blocked-firmware-bootloader-dfu",
  "blocked-factory-reset",
  "blocked-persistent-unknown-memory-write",
  "blocked-ambiguous-command",
]);

export const WP17_SAFETY_NOTES = [
  "WP17 is evidence-only.",
  "No setting write is implemented, approved, enabled, or executed.",
  "Candidate readiness and evidence completeness do not enable execution.",
  "Backup, rollback, read-back, and physical verification evidence remain planning data only.",
  "The future write gate remains disabled and requires a separate work package and Red Team plan.",
  "The only executable HID command remains the read-only wp13-device-info-read.",
  "Validation, import, and export do not touch HID devices.",
  "No apply, sync, save-to-device, arbitrary command entry, raw command console, packet editor, command registry execution, retries, polling, scanning, fuzzing, brute force, probing, or automatic execution is implemented.",
  "No GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material was copied.",
];

export const DISABLED_WRITE_READINESS_CHECKLIST: DisabledWriteReadinessChecklistItem[] = [
  {
    label: "Future WP approval",
    status: "blocked",
    detail: "A separate WP18-or-later implementation package is required before any write behavior can be considered.",
  },
  {
    label: "Red Team write plan",
    status: "blocked",
    detail: "A future Red Team plan must approve any first-write implementation before code is added.",
  },
  {
    label: "Backup and rollback proof",
    status: "blocked",
    detail: "Backup and rollback evidence are required but remain planning data in WP17.",
  },
  {
    label: "Read-back or physical verification",
    status: "blocked",
    detail: "Verification evidence is required but does not enable execution in WP17.",
  },
];

export const EXAMPLE_FIRST_WRITE_EVIDENCE_PACK: FirstWriteEvidencePack = {
  schemaVersion: FIRST_WRITE_SCHEMA_VERSION,
  packId: "ak680-wp17-first-write-example",
  title: "WP17 first controlled setting-write evidence plan example",
  evidenceOnly: true,
  writeExecutionApproved: false,
  writeSupportImplemented: false,
  commandExecutionEnabled: false,
  currentExecutableBoundary: "wp13-device-info-read-only",
  records: [
    {
      evidenceId: "placeholder-lighting-visual-only-evidence",
      title: "Placeholder lighting evidence requiring future capture",
      sourceType: "planning-placeholder",
      sourceDateTime: "2026-06-30T00:00:00.000Z",
      collectorOrReviewer: "AK680 Studio maintainers",
      targetDeviceIdentity: "AJAZZ AK680 V2 VID 3141 / PID 32956",
      environment: "Sanitized example; no hardware trace included.",
      userActionContext: "Future evidence must identify a specific official-app visual setting action.",
      reportDirectionOrType: "Unknown until future evidence.",
      reportId: "",
      requestLength: "",
      observedRequestBytes: "",
      observedResponseOrAck: "",
      timingSequence: "Unknown; must document previous, candidate, follow-up, and acknowledgement traffic.",
      mutationStateUncertainty: "Unknown; candidate remains non-executable.",
      reversibilityNotes: "Rollback must be demonstrated before any future review.",
      backupPossibility: "Unknown; pre-write backup requirements are not satisfied.",
      readBackPossibility: "Unknown; no approved read-back command exists for this setting.",
      physicalVerificationMethod: "Possible visual verification only; future evidence required.",
      hardwareRiskNotes: "Insufficient evidence; no write approval.",
      gplSourceCleanlinessStatement:
        "No GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material copied.",
      redactionSanitizationStatus: "Sanitized placeholder, no serials, private paths, or raw private traces.",
      reviewerNotes: "Example evidence is incomplete and must not be executed.",
    },
  ],
  candidates: [
    {
      candidateId: "visual-lighting-first-write-placeholder",
      title: "Possible future visual-only lighting setting",
      category: "simple-lighting-setting-write",
      status: "insufficient-evidence",
      evidenceReferences: ["placeholder-lighting-visual-only-evidence"],
      observedRequestBytes: "",
      reportId: "",
      requestLength: "",
      targetInterfaceMetadata: "Must be documented before future review.",
      expectedResponseAcknowledgement: "Unknown.",
      officialAppUserActionContext: "Future evidence must document exact action and avoid save/apply/sync ambiguity.",
      mutationScope: "Unknown",
      riskScore: 5,
      riskScoreExplanation: "Evidence is incomplete; risk is treated as unacceptable for first write.",
      reversibilityScore: 1,
      reversibilityScoreExplanation: "Rollback is not demonstrated.",
      rollbackRecoveryPlan: "Missing; required before future review.",
      preWriteBackupRequirements: "Missing; required before future review.",
      readBackVerificationPlan: "Missing; required before future review.",
      physicalVerificationPlan: "Visual verification may be possible but is not documented.",
      hardwareRiskClassification: "unknown-risk-blocked",
      safetyRationale: "No execution in WP17.",
      rejectionRationale: "Insufficient evidence.",
      unknownsAndUncertainties: "Exact bytes, report ID, length, response, rollback, backup, and verification are unknown.",
      gplSourceCleanlinessStatement:
        "No GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material copied.",
      futureImplementationRequirements: "Separate WP18-or-later implementation and Red Team plan.",
      futureRedTeamReviewRequirements: "Complete evidence, rollback, backup, verification, and source-cleanliness review.",
      reviewerNotes: "Non-executable planning placeholder.",
    },
    {
      candidateId: "blocked-keymap-first-write",
      title: "Keymap write is rejected for first-write planning",
      category: "blocked-keymap-write",
      status: "rejected-too-risky",
      evidenceReferences: ["placeholder-lighting-visual-only-evidence"],
      observedRequestBytes: "",
      reportId: "",
      requestLength: "",
      targetInterfaceMetadata: "Not applicable.",
      expectedResponseAcknowledgement: "Not applicable.",
      officialAppUserActionContext: "Keymap writes are out of scope for first write.",
      mutationScope: "Profile-wide",
      riskScore: 5,
      riskScoreExplanation: "Keymap writes are profile-level and too risky for first write.",
      reversibilityScore: 1,
      reversibilityScoreExplanation: "Rollback is not proven.",
      rollbackRecoveryPlan: "Rejected; no WP17 rollback path.",
      preWriteBackupRequirements: "Rejected; no WP17 backup path.",
      readBackVerificationPlan: "Rejected; no WP17 read-back support.",
      physicalVerificationPlan: "Rejected.",
      hardwareRiskClassification: "profile-wide-high-risk",
      safetyRationale: "Rejected candidate remains non-executable.",
      rejectionRationale: "Keymap writes are explicitly unsuitable for first-write package.",
      unknownsAndUncertainties: "Many device-state effects unknown.",
      gplSourceCleanlinessStatement:
        "No GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material copied.",
      futureImplementationRequirements: "Not a first-write candidate.",
      futureRedTeamReviewRequirements: "Would require a separate later package if ever considered.",
      reviewerNotes: "Rejected too risky.",
    },
  ],
  safetyNotes: WP17_SAFETY_NOTES,
};

export function validateFirstWriteEvidencePack(input: unknown): FirstWriteValidationResult {
  const executableFieldPaths = findExecutableFieldPaths(input);
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(input)) {
    return invalidResult(["First-write evidence pack must be an object."], executableFieldPaths);
  }
  if (input.schemaVersion !== FIRST_WRITE_SCHEMA_VERSION) {
    errors.push("Unsupported or missing first-write evidence schema version.");
  }
  if (input.evidenceOnly !== true) {
    errors.push("First-write evidence pack must be evidence-only.");
  }
  if (input.writeExecutionApproved !== false || input.writeSupportImplemented !== false) {
    errors.push("First-write evidence pack must not approve or implement write support.");
  }
  if (input.commandExecutionEnabled !== false) {
    errors.push("First-write evidence pack must not enable command execution.");
  }
  if (executableFieldPaths.length > 0) {
    errors.push("Executable-looking fields are not allowed in WP17 evidence data.");
  }

  const records = Array.isArray(input.records) ? input.records : [];
  const candidates = Array.isArray(input.candidates) ? input.candidates : [];
  if (!Array.isArray(input.records)) {
    errors.push("Evidence records must be an array.");
  }
  if (!Array.isArray(input.candidates)) {
    errors.push("Candidate dossiers must be an array.");
  }

  const evidenceIds = new Set<string>();
  records.forEach((record, index) => validateEvidenceRecord(record, index, evidenceIds, errors, warnings));
  const candidateResults = candidates.map((candidate, index) => validateCandidate(candidate, index, evidenceIds, errors));

  return {
    valid: errors.length === 0,
    evidenceOnly: input.evidenceOnly === true,
    executionEnabled: false,
    writeApproved: false,
    writeSupportImplemented: false,
    errors,
    warnings,
    executableFieldPaths,
    candidateResults,
  };
}

export function createFirstWriteEvidenceExport({
  pack = EXAMPLE_FIRST_WRITE_EVIDENCE_PACK,
  now = new Date(),
}: {
  pack?: FirstWriteEvidencePack;
  now?: Date;
} = {}): FirstWriteEvidenceExport {
  return {
    exportType: "ak680-first-write-evidence-plan",
    timestamp: now.toISOString(),
    workPackage: "WP17",
    localOnly: true,
    evidenceOnly: true,
    writeExecutionApproved: false,
    commandExecutionEnabled: false,
    validationTouchesHidDevices: false,
    futureImplementationRequires: "Separate WP18-or-later implementation package and Red Team plan.",
    pack,
    validation: validateFirstWriteEvidencePack(pack),
    disabledWriteReadinessChecklist: DISABLED_WRITE_READINESS_CHECKLIST,
  };
}

export function parseFirstWriteEvidencePackJson(text: string): FirstWriteValidationResult {
  try {
    return validateFirstWriteEvidencePack(JSON.parse(text));
  } catch {
    return invalidResult(["First-write evidence JSON could not be parsed."]);
  }
}

function validateEvidenceRecord(
  input: unknown,
  index: number,
  evidenceIds: Set<string>,
  errors: string[],
  warnings: string[],
) {
  if (!isRecord(input)) {
    errors.push(`Evidence record ${index + 1} must be an object.`);
    return;
  }
  const missing = REQUIRED_EVIDENCE_FIELDS.filter((field) => isEmpty(input[field]));
  if (missing.length > 0) {
    warnings.push(`Evidence record ${index + 1} is incomplete: ${missing.join(", ")}.`);
  }
  if (typeof input.evidenceId === "string" && input.evidenceId.trim()) {
    evidenceIds.add(input.evidenceId);
  }
  validateOptionalBytes(input.observedRequestBytes, `Evidence record ${index + 1} observed request bytes`, errors);
}

function validateCandidate(
  input: unknown,
  index: number,
  evidenceIds: Set<string>,
  packErrors: string[],
): FirstWriteCandidateValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(input)) {
    return candidateResult(`candidate-${index + 1}`, "insufficient-evidence", 5, 1, "unknown-risk-blocked", false, [
      `Candidate ${index + 1} must be an object.`,
    ]);
  }

  const candidateId = typeof input.candidateId === "string" && input.candidateId ? input.candidateId : `candidate-${index + 1}`;
  const status = FIRST_WRITE_STATUSES.includes(input.status as FirstWriteStatus)
    ? (input.status as FirstWriteStatus)
    : "insufficient-evidence";
  const category = input.category as FirstWriteCategory;
  const riskScore = typeof input.riskScore === "number" ? input.riskScore : 5;
  const reversibilityScore = typeof input.reversibilityScore === "number" ? input.reversibilityScore : 1;
  const riskClass = HARDWARE_RISK_CLASSIFICATIONS.includes(input.hardwareRiskClassification as HardwareRiskClassification)
    ? (input.hardwareRiskClassification as HardwareRiskClassification)
    : "unknown-risk-blocked";

  if (!FIRST_WRITE_STATUSES.includes(input.status as FirstWriteStatus)) {
    errors.push("Candidate status is not allowed.");
  }
  if (!FIRST_WRITE_CATEGORIES.includes(category)) {
    errors.push("Candidate category is not allowed.");
  }
  if (!HARDWARE_RISK_CLASSIFICATIONS.includes(input.hardwareRiskClassification as HardwareRiskClassification)) {
    errors.push("Hardware-risk classification is not allowed.");
  }
  if (riskScore < 1 || riskScore > 5 || reversibilityScore < 1 || reversibilityScore > 5) {
    errors.push("Risk and reversibility scores must be in the 1..5 range.");
  }

  const missing = REQUIRED_CANDIDATE_FIELDS.filter((field) => isEmpty(input[field]));
  if (missing.length > 0) {
    warnings.push(`Missing candidate fields: ${missing.join(", ")}.`);
  }

  const references = Array.isArray(input.evidenceReferences) ? input.evidenceReferences : [];
  if (references.length === 0 || references.some((reference) => typeof reference !== "string" || !evidenceIds.has(reference))) {
    errors.push("Candidate must reference evidence records in the pack.");
  }
  validateOptionalBytes(input.observedRequestBytes, `${candidateId} observed request bytes`, errors);
  if (!isEmpty(input.observedRequestBytes) && (isEmpty(input.reportId) || isEmpty(input.requestLength))) {
    errors.push("Report ID and request length are required when observed bytes are present.");
  }

  const classifiedStatus = classifyCandidate({
    status,
    category,
    riskScore,
    reversibilityScore,
    errors,
    missingCount: missing.length,
    rollbackRecoveryPlan: String(input.rollbackRecoveryPlan ?? ""),
    preWriteBackupRequirements: String(input.preWriteBackupRequirements ?? ""),
    readBackVerificationPlan: String(input.readBackVerificationPlan ?? ""),
    physicalVerificationPlan: String(input.physicalVerificationPlan ?? ""),
  });
  const ready = classifiedStatus === "ready-for-future-Red-Team-review";
  const result = candidateResult(candidateId, status, riskScore, reversibilityScore, riskClass, ready, errors, warnings, classifiedStatus);
  packErrors.push(...errors.map((error) => `${candidateId}: ${error}`));
  return result;
}

function classifyCandidate({
  status,
  category,
  riskScore,
  reversibilityScore,
  errors,
  missingCount,
  rollbackRecoveryPlan,
  preWriteBackupRequirements,
  readBackVerificationPlan,
  physicalVerificationPlan,
}: {
  status: FirstWriteStatus;
  category: FirstWriteCategory;
  riskScore: number;
  reversibilityScore: number;
  errors: string[];
  missingCount: number;
  rollbackRecoveryPlan: string;
  preWriteBackupRequirements: string;
  readBackVerificationPlan: string;
  physicalVerificationPlan: string;
}): FirstWriteStatus {
  if (BLOCKED_CATEGORIES.has(category) || riskScore >= 5) {
    return "rejected-too-risky";
  }
  if (
    errors.length > 0 ||
    missingCount > 0 ||
    riskScore > 2 ||
    reversibilityScore < 4 ||
    isPlanningMissing(rollbackRecoveryPlan) ||
    isPlanningMissing(preWriteBackupRequirements) ||
    isPlanningMissing(readBackVerificationPlan) ||
    isPlanningMissing(physicalVerificationPlan)
  ) {
    return "insufficient-evidence";
  }
  if (status === "ready-for-future-Red-Team-review") {
    return "ready-for-future-Red-Team-review";
  }
  return "candidate-only";
}

function isPlanningMissing(value: string) {
  return value.trim().length === 0 || /missing|unknown|required/i.test(value);
}

function candidateResult(
  candidateId: string,
  status: FirstWriteStatus,
  riskScore: number,
  reversibilityScore: number,
  hardwareRiskClassification: HardwareRiskClassification,
  readyForFutureRedTeamReview: boolean,
  errors: string[] = [],
  warnings: string[] = [],
  classifiedStatus: FirstWriteStatus = status,
): FirstWriteCandidateValidation {
  return {
    candidateId,
    status,
    classifiedStatus,
    riskScore,
    reversibilityScore,
    hardwareRiskClassification,
    readyForFutureRedTeamReview,
    executionEnabled: false,
    writeApproved: false,
    errors,
    warnings,
  };
}

function validateOptionalBytes(value: unknown, label: string, errors: string[]) {
  if (isEmpty(value)) {
    return;
  }
  if (typeof value !== "string" || !parseEvidenceHexBytes(value)) {
    errors.push(`${label} must be parseable inert hex evidence bytes.`);
  }
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
    const executable = EXECUTABLE_FIELD_NAMES.some((name) => key.toLowerCase() === name.toLowerCase());
    return [...(executable ? [currentPath] : []), ...findExecutableFieldPaths(nested, currentPath)];
  });
}

function invalidResult(errors: string[], executableFieldPaths: string[] = []): FirstWriteValidationResult {
  return {
    valid: false,
    evidenceOnly: false,
    executionEnabled: false,
    writeApproved: false,
    writeSupportImplemented: false,
    errors,
    warnings: [],
    executableFieldPaths,
    candidateResults: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmpty(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim().length === 0) ||
    (Array.isArray(value) && value.length === 0)
  );
}
