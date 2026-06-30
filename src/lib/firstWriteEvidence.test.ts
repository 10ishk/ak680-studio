import { describe, expect, it } from "vitest";
import {
  CONTROLLED_READ_REPORT_ID,
  CONTROLLED_READ_REQUEST_BYTES,
  CONTROLLED_READ_REQUEST_LENGTH,
  CONTROLLED_READ_REQUIRED_USAGE,
  CONTROLLED_READ_REQUIRED_USAGE_PAGE,
} from "./controlledReadExperiment";
import {
  DISABLED_WRITE_READINESS_CHECKLIST,
  EXAMPLE_FIRST_WRITE_EVIDENCE_PACK,
  FIRST_WRITE_STATUSES,
  WP17_SAFETY_NOTES,
  createFirstWriteEvidenceExport,
  parseFirstWriteEvidencePackJson,
  validateFirstWriteEvidencePack,
  type FirstWriteCandidateDossier,
  type FirstWriteEvidencePack,
} from "./firstWriteEvidence";

const readyCandidate: FirstWriteCandidateDossier = {
  ...EXAMPLE_FIRST_WRITE_EVIDENCE_PACK.candidates[0],
  candidateId: "future-review-visual-only",
  status: "ready-for-future-Red-Team-review",
  observedRequestBytes: "AA 00 00 00",
  reportId: "0",
  requestLength: "4",
  targetInterfaceMetadata: "AK680 V2 VID 3141/PID 32956, usagePage 65384 / usage 97, exact path required.",
  expectedResponseAcknowledgement: "Documented acknowledgement shape in future evidence.",
  officialAppUserActionContext: "Single visual-only change, not save/apply/sync/profile switch.",
  mutationScope: "Visual-only",
  riskScore: 2,
  riskScoreExplanation: "Low risk only if future evidence remains visual-only and reversible.",
  reversibilityScore: 4,
  reversibilityScoreExplanation: "Rollback is documented in evidence.",
  rollbackRecoveryPlan: "Restore prior local value through future approved rollback plan.",
  preWriteBackupRequirements: "Local backup of prior value and raw evidence is documented for review.",
  readBackVerificationPlan: "Use documented approved read-back evidence in a future separate WP; no new read in WP17.",
  physicalVerificationPlan: "Visually verify lighting state after future controlled write.",
  hardwareRiskClassification: "visual-only-low-risk",
  safetyRationale: "Future review only, no WP17 execution.",
  rejectionRationale: "Not rejected; still future review only and non-executable in WP17.",
  unknownsAndUncertainties: "Future implementation still requires Red Team review.",
  futureImplementationRequirements: "Separate WP18-or-later implementation required.",
  futureRedTeamReviewRequirements: "Red Team must review exact command, rollback, backup, and verification evidence.",
};

function withCandidate(candidate: FirstWriteCandidateDossier): FirstWriteEvidencePack {
  return {
    ...EXAMPLE_FIRST_WRITE_EVIDENCE_PACK,
    candidates: [candidate],
  };
}

describe("first write evidence planning", () => {
  it("preserves the WP13/WP16 read-only command boundary", () => {
    expect(CONTROLLED_READ_REPORT_ID).toBe(0);
    expect(CONTROLLED_READ_REQUEST_LENGTH).toBe(64);
    expect(CONTROLLED_READ_REQUEST_BYTES.slice(0, 8)).toEqual([0xaa, 0x10, 0x30, 0, 0, 0, 1, 0]);
    expect(CONTROLLED_READ_REQUIRED_USAGE_PAGE).toBe(65384);
    expect(CONTROLLED_READ_REQUIRED_USAGE).toBe(97);
  });

  it("validates the example pack as evidence-only and non-executable", () => {
    const validation = validateFirstWriteEvidencePack(EXAMPLE_FIRST_WRITE_EVIDENCE_PACK);

    expect(validation.evidenceOnly).toBe(true);
    expect(validation.executionEnabled).toBe(false);
    expect(validation.writeApproved).toBe(false);
    expect(validation.writeSupportImplemented).toBe(false);
    expect(validation.candidateResults.every((result) => result.executionEnabled === false)).toBe(true);
    expect(validation.candidateResults.every((result) => result.writeApproved === false)).toBe(true);
  });

  it("allows only non-execution statuses", () => {
    expect(FIRST_WRITE_STATUSES).toEqual([
      "insufficient-evidence",
      "rejected-too-risky",
      "candidate-only",
      "ready-for-future-Red-Team-review",
    ]);
  });

  it("keeps ready-for-future-Red-Team-review non-executable", () => {
    const validation = validateFirstWriteEvidencePack(withCandidate(readyCandidate));
    const result = validation.candidateResults[0];

    expect(result.classifiedStatus).toBe("ready-for-future-Red-Team-review");
    expect(result.readyForFutureRedTeamReview).toBe(true);
    expect(result.executionEnabled).toBe(false);
    expect(result.writeApproved).toBe(false);
  });

  it("downgrades candidates missing rollback, backup, or verification evidence", () => {
    const validation = validateFirstWriteEvidencePack(
      withCandidate({
        ...readyCandidate,
        rollbackRecoveryPlan: "Missing rollback plan.",
        preWriteBackupRequirements: "Unknown backup.",
        readBackVerificationPlan: "Missing read-back.",
      }),
    );

    expect(validation.candidateResults[0].classifiedStatus).toBe("insufficient-evidence");
    expect(validation.candidateResults[0].executionEnabled).toBe(false);
  });

  it("rejects risky blocked categories for first write", () => {
    const validation = validateFirstWriteEvidencePack(
      withCandidate({
        ...readyCandidate,
        category: "blocked-keymap-write",
        riskScore: 5,
        hardwareRiskClassification: "profile-wide-high-risk",
      }),
    );

    expect(validation.candidateResults[0].classifiedStatus).toBe("rejected-too-risky");
  });

  it("rejects malformed JSON and executable-looking fields", () => {
    expect(parseFirstWriteEvidencePackJson("{bad-json").valid).toBe(false);

    const validation = validateFirstWriteEvidencePack({
      ...EXAMPLE_FIRST_WRITE_EVIDENCE_PACK,
      executeWrite: true,
      commandRegistry: { writeCommand: "AA 00" },
    });

    expect(validation.valid).toBe(false);
    expect(validation.executableFieldPaths).toEqual(["executeWrite", "commandRegistry", "commandRegistry.writeCommand"]);
  });

  it("exports local-only inert evidence shape and disabled checklist", () => {
    const exported = createFirstWriteEvidenceExport({ now: new Date("2026-06-30T00:00:00.000Z") });

    expect(exported).toMatchObject({
      exportType: "ak680-first-write-evidence-plan",
      timestamp: "2026-06-30T00:00:00.000Z",
      workPackage: "WP17",
      localOnly: true,
      evidenceOnly: true,
      writeExecutionApproved: false,
      commandExecutionEnabled: false,
      validationTouchesHidDevices: false,
    });
    expect(exported.disabledWriteReadinessChecklist).toEqual(DISABLED_WRITE_READINESS_CHECKLIST);
    expect(DISABLED_WRITE_READINESS_CHECKLIST.every((item) => item.status === "blocked")).toBe(true);
  });

  it("documents no write support and GPL cleanliness", () => {
    const safetyText = WP17_SAFETY_NOTES.join(" ");

    expect(safetyText).toContain("No setting write is implemented");
    expect(safetyText).toContain("Validation, import, and export do not touch HID devices");
    expect(safetyText).toContain("GPL-3.0 source code");
  });
});
