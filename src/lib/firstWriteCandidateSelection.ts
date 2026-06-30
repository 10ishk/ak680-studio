import {
  EXAMPLE_FIRST_WRITE_EVIDENCE_PACK,
  FIRST_WRITE_CATEGORIES,
  validateFirstWriteEvidencePack,
  type FirstWriteCandidateDossier,
  type FirstWriteEvidencePack,
  type HardwareRiskClassification,
} from "./firstWriteEvidence";

export const FIRST_WRITE_SELECTION_SCHEMA_VERSION = 1;
export const FIRST_WRITE_SELECTION_STATUSES = [
  "not-selected",
  "rejected-insufficient-evidence",
  "rejected-too-risky",
  "rejected-not-first-write-appropriate",
  "selected-for-future-WP-review",
] as const;

export type FirstWriteSelectionStatus = (typeof FIRST_WRITE_SELECTION_STATUSES)[number];
export type FirstWriteSelectionOutcome = "Outcome A - no candidate selected" | "Outcome B - exactly one candidate selected";

export interface FirstWriteCandidateSelectionRecord {
  candidateId: string;
  title: string;
  sourceWp17Status: string;
  category: string;
  selectionStatus: FirstWriteSelectionStatus;
  evidenceReferences: string[];
  evidenceProvenanceSummary: string;
  gplSourceCleanlinessStatement: string;
  targetDeviceIdentity: string;
  vendorId: 3141;
  productId: 32956;
  targetInterfaceMetadata: string;
  exactSelectedPathInterfaceRequired: true;
  officialAppUserActionContext: string;
  observedTimingContext: string;
  exactRequestBytes: string;
  reportId: string;
  requestLength: string;
  expectedResponseAcknowledgement: string;
  mutationScope: string;
  riskScore: number;
  riskScoreExplanation: string;
  reversibilityScore: number;
  reversibilityScoreExplanation: string;
  hardwareRiskClassification: HardwareRiskClassification;
  backupEvidenceSummary: string;
  rollbackEvidenceSummary: string;
  readBackVerificationEvidenceSummary: string;
  physicalVerificationEvidenceSummary: string;
  unknownsAndUncertainties: string;
  rejectionRationale: string;
  selectionRationale: string;
  futureImplementationConstraints: string[];
  futureRedTeamReviewRequirements: string;
  explicitNonExecutionStatement: string;
  executionEnabled: false;
  writeApproved: false;
  reviewerNotes: string;
  errors: string[];
  warnings: string[];
}

export interface FirstWriteCandidateSelectionReview {
  schemaVersion: number;
  workPackage: "WP18";
  outcome: FirstWriteSelectionOutcome;
  selectedCandidateCount: 0 | 1;
  selectedCandidateId?: string;
  writeCommandApproved: false;
  writeSupportImplemented: false;
  commandExecutionEnabled: false;
  candidateSelectionEnablesExecution: false;
  validationTouchesHidDevices: false;
  futureWriteGate: "disabled";
  existingExecutableBoundary: "wp13-device-info-read-only";
  rejectionSummary: string;
  evidenceGaps: string[];
  riskRationale: string;
  backupRollbackGaps: string[];
  readBackPhysicalVerificationGaps: string[];
  gplSourceCleanlinessGaps: string[];
  futureEvidenceRequirements: string[];
  records: FirstWriteCandidateSelectionRecord[];
  errors: string[];
  warnings: string[];
  executableFieldPaths: string[];
}

export interface FirstWriteCandidateSelectionExport {
  exportType: "ak680-first-write-candidate-selection";
  timestamp: string;
  workPackage: "WP18";
  localOnly: true;
  candidateSelectionOnly: true;
  writeCommandApproved: false;
  writeSupportImplemented: false;
  commandExecutionEnabled: false;
  validationTouchesHidDevices: false;
  review: FirstWriteCandidateSelectionReview;
  safetyNotes: string[];
}

const EXECUTABLE_FIELD_NAMES = [
  "execute",
  "write",
  "writeCommand",
  "runWrite",
  "executeWrite",
  "executeCandidate",
  "runCandidate",
  "invoke",
  "tauriCommand",
  "commandRegistry",
  "rawCommand",
  "commandConsole",
  "packetEditor",
  "payloadExecution",
  "sendReport",
  "applyToDevice",
  "saveToDevice",
  "syncToDevice",
];

const FIRST_WRITE_APPROPRIATE_CATEGORIES = new Set(["simple-lighting-setting-write", "low-risk-visual-only-setting", "reversible-setting"]);
const LOW_RISK_CLASSES = new Set<HardwareRiskClassification>(["visual-only-low-risk", "single-setting-low-risk"]);

export const WP18_SAFETY_NOTES = [
  "WP18 is candidate-selection only.",
  "WP18 does not implement, approve, enable, or execute any write command.",
  "Candidate selection records are non-executable.",
  "Candidate readiness and evidence completeness do not enable execution.",
  "Backup, rollback, read-back, and physical verification evidence remain planning data only.",
  "The future write gate remains disabled and requires a separate work package and Red Team plan.",
  "The WP13/WP16 read-only command boundary remains unchanged.",
  "No apply, sync, save-to-device, arbitrary command entry, raw command console, packet editor, command registry execution, retries, polling, scanning, fuzzing, brute force, probing, automatic execution, or hidden follow-up command is implemented.",
  "No GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material was copied.",
];

export const WP18_FUTURE_IMPLEMENTATION_CONSTRAINTS = [
  "Separate future work package required before implementation.",
  "Separate Red Team plan and PASS required before closeout/tag.",
  "Exactly one selected candidate only.",
  "Exact command bytes, report ID, request length, target device, VID/PID, interface metadata, and selected path/interface gate must be pinned.",
  "Manual confirmation required.",
  "One-shot execution only.",
  "No retries, polling, automatic execution, hidden follow-up commands, arbitrary payloads, raw command console, packet editor, or command registry execution.",
  "Pre-write backup, rollback/recovery, and read-back or physical verification required before any future write.",
  "Failure handling must not trigger retry or fallback writes.",
  "Cancel must send nothing.",
];

export function reviewFirstWriteCandidateSelection(
  pack: FirstWriteEvidencePack = EXAMPLE_FIRST_WRITE_EVIDENCE_PACK,
): FirstWriteCandidateSelectionReview {
  const executableFieldPaths = findExecutableFieldPaths(pack);
  const validation = validateFirstWriteEvidencePack(pack);
  const warnings = [...validation.warnings];
  const errors = [...validation.errors];
  if (executableFieldPaths.length > 0) {
    errors.push("Executable-looking fields are not allowed in WP18 candidate-selection data.");
  }

  const records = pack.candidates.map((candidate) => reviewCandidate(candidate, pack));
  const selectedRecords = records.filter((record) => record.selectionStatus === "selected-for-future-WP-review");
  if (selectedRecords.length > 1) {
    errors.push("WP18 cannot select more than one future first-write candidate.");
    selectedRecords.slice(1).forEach((record) => {
      record.selectionStatus = "rejected-not-first-write-appropriate";
      record.rejectionRationale = appendReason(record.rejectionRationale, "Rejected because WP18 permits at most one selected candidate.");
      record.selectionRationale = "";
      record.executionEnabled = false;
      record.writeApproved = false;
    });
  }

  const selectedCandidate = records.find((record) => record.selectionStatus === "selected-for-future-WP-review");
  const outcome: FirstWriteSelectionOutcome = selectedCandidate
    ? "Outcome B - exactly one candidate selected"
    : "Outcome A - no candidate selected";
  const evidenceGaps = collectUnique(records.flatMap((record) => record.errors.concat(record.warnings))).slice(0, 12);
  const backupRollbackGaps = collectUnique(
    records.flatMap((record) =>
      [record.backupEvidenceSummary, record.rollbackEvidenceSummary]
        .filter(isPlanningMissing)
        .map((value) => `${record.candidateId}: ${value}`),
    ),
  );
  const readBackPhysicalVerificationGaps = collectUnique(
    records.flatMap((record) =>
      [record.readBackVerificationEvidenceSummary, record.physicalVerificationEvidenceSummary]
        .filter(isPlanningMissing)
        .map((value) => `${record.candidateId}: ${value}`),
    ),
  );
  const gplSourceCleanlinessGaps = collectUnique(
    records
      .filter((record) => !isGplClean(record.gplSourceCleanlinessStatement))
      .map((record) => `${record.candidateId}: GPL/source-cleanliness evidence is missing or unclear.`),
  );

  return {
    schemaVersion: FIRST_WRITE_SELECTION_SCHEMA_VERSION,
    workPackage: "WP18",
    outcome,
    selectedCandidateCount: selectedCandidate ? 1 : 0,
    selectedCandidateId: selectedCandidate?.candidateId,
    writeCommandApproved: false,
    writeSupportImplemented: false,
    commandExecutionEnabled: false,
    candidateSelectionEnablesExecution: false,
    validationTouchesHidDevices: false,
    futureWriteGate: "disabled",
    existingExecutableBoundary: "wp13-device-info-read-only",
    rejectionSummary: selectedCandidate
      ? "Exactly one candidate satisfies strict future-review thresholds; execution remains unimplemented and unapproved."
      : "No candidate satisfies WP18 Outcome B requirements. No candidate is selected for future implementation.",
    evidenceGaps: evidenceGaps.length > 0 ? evidenceGaps : ["No current evidence gaps detected in selected future-review data."],
    riskRationale: selectedCandidate
      ? "Selected candidate has risk score 1 or 2, reversibility score 4 or 5, low-risk classification, and narrow mutation scope."
      : "Current WP17 candidates are incomplete, too risky, or not first-write appropriate.",
    backupRollbackGaps,
    readBackPhysicalVerificationGaps,
    gplSourceCleanlinessGaps,
    futureEvidenceRequirements: [
      "Exact request bytes, report ID, and request length.",
      "Clear target device and exact selected path/interface constraints.",
      "Documented low-risk visual-only or single-setting mutation scope.",
      "Local pre-write backup evidence and limitations.",
      "Rollback/recovery evidence that does not depend on unknown writes.",
      "Read-back or physical verification evidence with limitations.",
      "GPL/source-cleanliness statement and reviewable provenance.",
      "Separate future work package and Red Team plan before any implementation.",
    ],
    records,
    errors,
    warnings,
    executableFieldPaths,
  };
}

export function createFirstWriteCandidateSelectionExport({
  pack = EXAMPLE_FIRST_WRITE_EVIDENCE_PACK,
  now = new Date(),
}: {
  pack?: FirstWriteEvidencePack;
  now?: Date;
} = {}): FirstWriteCandidateSelectionExport {
  return {
    exportType: "ak680-first-write-candidate-selection",
    timestamp: now.toISOString(),
    workPackage: "WP18",
    localOnly: true,
    candidateSelectionOnly: true,
    writeCommandApproved: false,
    writeSupportImplemented: false,
    commandExecutionEnabled: false,
    validationTouchesHidDevices: false,
    review: reviewFirstWriteCandidateSelection(pack),
    safetyNotes: WP18_SAFETY_NOTES,
  };
}

export function parseFirstWriteCandidateSelectionJson(text: string): FirstWriteCandidateSelectionReview {
  try {
    const parsed = JSON.parse(text) as unknown;
    const review = isRecord(parsed) && "review" in parsed ? (parsed.review as unknown) : parsed;
    return validateSelectionReviewShape(review);
  } catch {
    return invalidReview(["WP18 candidate-selection JSON could not be parsed."]);
  }
}

function validateSelectionReviewShape(input: unknown): FirstWriteCandidateSelectionReview {
  const executableFieldPaths = findExecutableFieldPaths(input);
  const errors: string[] = [];
  if (!isRecord(input)) {
    return invalidReview(["WP18 candidate-selection review must be an object."], executableFieldPaths);
  }
  if (input.schemaVersion !== FIRST_WRITE_SELECTION_SCHEMA_VERSION) {
    errors.push("Unsupported or missing WP18 selection schema version.");
  }
  if (input.writeCommandApproved !== false || input.writeSupportImplemented !== false || input.commandExecutionEnabled !== false) {
    errors.push("WP18 selection data must not approve or enable write execution.");
  }
  if (input.candidateSelectionEnablesExecution !== false) {
    errors.push("Candidate selection must not enable execution.");
  }
  if (input.futureWriteGate !== "disabled") {
    errors.push("Future write gate must remain disabled.");
  }
  if (!Array.isArray(input.records)) {
    errors.push("WP18 selection records must be an array.");
  }
  const selectedCount = Array.isArray(input.records)
    ? input.records.filter(
        (record) => isRecord(record) && record.selectionStatus === "selected-for-future-WP-review",
      ).length
    : 0;
  if (selectedCount > 1) {
    errors.push("WP18 selection data cannot contain more than one selected candidate.");
  }
  if (executableFieldPaths.length > 0) {
    errors.push("Executable-looking fields are not allowed in WP18 selection data.");
  }
  return {
    ...reviewFirstWriteCandidateSelection({ ...EXAMPLE_FIRST_WRITE_EVIDENCE_PACK, candidates: [] }),
    ...(input as Partial<FirstWriteCandidateSelectionReview>),
    errors,
    executableFieldPaths,
    selectedCandidateCount: selectedCount === 1 ? 1 : 0,
    outcome: selectedCount === 1 ? "Outcome B - exactly one candidate selected" : "Outcome A - no candidate selected",
    writeCommandApproved: false,
    writeSupportImplemented: false,
    commandExecutionEnabled: false,
    candidateSelectionEnablesExecution: false,
    validationTouchesHidDevices: false,
    futureWriteGate: "disabled",
  };
}

function reviewCandidate(candidate: FirstWriteCandidateDossier, pack: FirstWriteEvidencePack): FirstWriteCandidateSelectionRecord {
  const referencedRecords = pack.records.filter((record) => candidate.evidenceReferences.includes(record.evidenceId));
  const errors: string[] = [];
  const warnings: string[] = [];
  if (referencedRecords.length !== candidate.evidenceReferences.length) {
    errors.push("Evidence record references are missing.");
  }
  if (!FIRST_WRITE_CATEGORIES.includes(candidate.category)) {
    errors.push("Candidate category is not recognized.");
  }
  if (!FIRST_WRITE_APPROPRIATE_CATEGORIES.has(candidate.category)) {
    errors.push("Candidate category is not appropriate for a first write.");
  }
  if (!isExactCandidateEvidence(candidate)) {
    errors.push("Exact request bytes, report ID, or request length are missing.");
  }
  if (candidate.riskScore < 1 || candidate.riskScore > 2) {
    errors.push("Outcome B requires risk score 1 or 2.");
  }
  if (candidate.reversibilityScore < 4 || candidate.reversibilityScore > 5) {
    errors.push("Outcome B requires reversibility score 4 or 5.");
  }
  if (!LOW_RISK_CLASSES.has(candidate.hardwareRiskClassification)) {
    errors.push("Outcome B requires visual-only-low-risk or single-setting-low-risk classification.");
  }
  if (!isNarrowMutationScope(candidate.mutationScope)) {
    errors.push("Outcome B requires visual-only or single-setting mutation scope.");
  }
  if (isPlanningMissing(candidate.preWriteBackupRequirements)) {
    errors.push("Backup evidence is missing or incomplete.");
  }
  if (isPlanningMissing(candidate.rollbackRecoveryPlan)) {
    errors.push("Rollback evidence is missing or incomplete.");
  }
  if (isPlanningMissing(candidate.readBackVerificationPlan) && isPlanningMissing(candidate.physicalVerificationPlan)) {
    errors.push("Read-back or physical verification evidence is missing or incomplete.");
  }
  if (!isGplClean(candidate.gplSourceCleanlinessStatement)) {
    errors.push("GPL/source-cleanliness evidence is missing or unclear.");
  }
  if (candidate.status !== "ready-for-future-Red-Team-review") {
    warnings.push("WP17 candidate status is not ready-for-future-Red-Team-review.");
  }

  const selectionStatus = chooseSelectionStatus(candidate, errors);
  const targetDeviceIdentity = referencedRecords[0]?.targetDeviceIdentity || "AJAZZ AK680 V2 VID 3141 / PID 32956";
  return {
    candidateId: candidate.candidateId,
    title: candidate.title,
    sourceWp17Status: candidate.status,
    category: candidate.category,
    selectionStatus,
    evidenceReferences: [...candidate.evidenceReferences],
    evidenceProvenanceSummary: summarizeEvidenceProvenance(referencedRecords),
    gplSourceCleanlinessStatement: candidate.gplSourceCleanlinessStatement,
    targetDeviceIdentity,
    vendorId: 3141,
    productId: 32956,
    targetInterfaceMetadata: candidate.targetInterfaceMetadata,
    exactSelectedPathInterfaceRequired: true,
    officialAppUserActionContext: candidate.officialAppUserActionContext,
    observedTimingContext: referencedRecords.map((record) => record.timingSequence).filter(Boolean).join(" | ") || "Not documented.",
    exactRequestBytes: candidate.observedRequestBytes,
    reportId: candidate.reportId,
    requestLength: candidate.requestLength,
    expectedResponseAcknowledgement: candidate.expectedResponseAcknowledgement,
    mutationScope: candidate.mutationScope,
    riskScore: candidate.riskScore,
    riskScoreExplanation: candidate.riskScoreExplanation,
    reversibilityScore: candidate.reversibilityScore,
    reversibilityScoreExplanation: candidate.reversibilityScoreExplanation,
    hardwareRiskClassification: candidate.hardwareRiskClassification,
    backupEvidenceSummary: candidate.preWriteBackupRequirements,
    rollbackEvidenceSummary: candidate.rollbackRecoveryPlan,
    readBackVerificationEvidenceSummary: candidate.readBackVerificationPlan,
    physicalVerificationEvidenceSummary: candidate.physicalVerificationPlan,
    unknownsAndUncertainties: candidate.unknownsAndUncertainties,
    rejectionRationale: selectionStatus === "selected-for-future-WP-review" ? "" : errors.concat(warnings).join(" "),
    selectionRationale:
      selectionStatus === "selected-for-future-WP-review"
        ? "Candidate satisfies WP18 thresholds for future WP review only. Execution remains unimplemented and unapproved."
        : "",
    futureImplementationConstraints: WP18_FUTURE_IMPLEMENTATION_CONSTRAINTS,
    futureRedTeamReviewRequirements: candidate.futureRedTeamReviewRequirements,
    explicitNonExecutionStatement:
      "WP18 candidate selection is not execution approval and does not implement, enable, or execute a write path.",
    executionEnabled: false,
    writeApproved: false,
    reviewerNotes: candidate.reviewerNotes,
    errors,
    warnings,
  };
}

function chooseSelectionStatus(candidate: FirstWriteCandidateDossier, errors: string[]): FirstWriteSelectionStatus {
  if (errors.some((error) => /risk score|classification/i.test(error)) || candidate.riskScore >= 5) {
    return "rejected-too-risky";
  }
  if (errors.some((error) => /not appropriate|mutation scope/i.test(error))) {
    return "rejected-not-first-write-appropriate";
  }
  if (errors.length > 0 || candidate.status !== "ready-for-future-Red-Team-review") {
    return "rejected-insufficient-evidence";
  }
  return "selected-for-future-WP-review";
}

function isExactCandidateEvidence(candidate: FirstWriteCandidateDossier) {
  return candidate.observedRequestBytes.trim().length > 0 && candidate.reportId.trim().length > 0 && candidate.requestLength.trim().length > 0;
}

function isNarrowMutationScope(value: string) {
  return /visual-only|single-setting|single setting/i.test(value);
}

function isGplClean(value: string) {
  return /no GPL-3\.0 source code|GPL-clean|no GPL/i.test(value) && !/unknown|missing|unclear/i.test(value);
}

function isPlanningMissing(value: string) {
  return value.trim().length === 0 || /missing|unknown|required|not documented|not applicable/i.test(value);
}

function summarizeEvidenceProvenance(records: FirstWriteEvidencePack["records"]) {
  if (records.length === 0) {
    return "No referenced evidence record found.";
  }
  return records
    .map((record) => `${record.evidenceId}: ${record.sourceType}, ${record.sourceDateTime}, ${record.collectorOrReviewer}`)
    .join(" | ");
}

function appendReason(current: string, next: string) {
  return current ? `${current} ${next}` : next;
}

function collectUnique(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
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

function invalidReview(errors: string[], executableFieldPaths: string[] = []): FirstWriteCandidateSelectionReview {
  return {
    schemaVersion: FIRST_WRITE_SELECTION_SCHEMA_VERSION,
    workPackage: "WP18",
    outcome: "Outcome A - no candidate selected",
    selectedCandidateCount: 0,
    writeCommandApproved: false,
    writeSupportImplemented: false,
    commandExecutionEnabled: false,
    candidateSelectionEnablesExecution: false,
    validationTouchesHidDevices: false,
    futureWriteGate: "disabled",
    existingExecutableBoundary: "wp13-device-info-read-only",
    rejectionSummary: "Candidate-selection data is invalid.",
    evidenceGaps: [],
    riskRationale: "Invalid data cannot support candidate selection.",
    backupRollbackGaps: [],
    readBackPhysicalVerificationGaps: [],
    gplSourceCleanlinessGaps: [],
    futureEvidenceRequirements: [],
    records: [],
    errors,
    warnings: [],
    executableFieldPaths,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
