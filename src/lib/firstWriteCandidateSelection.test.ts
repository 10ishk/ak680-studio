import { describe, expect, it } from "vitest";
import {
  CONTROLLED_READ_REPORT_ID,
  CONTROLLED_READ_REQUEST_BYTES,
  CONTROLLED_READ_REQUEST_LENGTH,
  CONTROLLED_READ_REQUIRED_USAGE,
  CONTROLLED_READ_REQUIRED_USAGE_PAGE,
} from "./controlledReadExperiment";
import {
  EXAMPLE_FIRST_WRITE_EVIDENCE_PACK,
  type FirstWriteCandidateDossier,
  type FirstWriteEvidencePack,
} from "./firstWriteEvidence";
import { FUTURE_WRITE_GATE } from "./readOnlySettingsFoundation";
import {
  FIRST_WRITE_SELECTION_STATUSES,
  WP18_SAFETY_NOTES,
  createFirstWriteCandidateSelectionExport,
  parseFirstWriteCandidateSelectionJson,
  reviewFirstWriteCandidateSelection,
} from "./firstWriteCandidateSelection";

const qualifiedCandidate: FirstWriteCandidateDossier = {
  ...EXAMPLE_FIRST_WRITE_EVIDENCE_PACK.candidates[0],
  candidateId: "qualified-visual-lighting-candidate",
  title: "Qualified visual-only lighting candidate for future review",
  category: "simple-lighting-setting-write",
  status: "ready-for-future-Red-Team-review",
  observedRequestBytes: "AA 00 01 02",
  reportId: "0",
  requestLength: "4",
  targetInterfaceMetadata: "AK680 V2 VID 3141/PID 32956, usagePage 65384 / usage 97, exact selected path required.",
  expectedResponseAcknowledgement: "Documented acknowledgement bytes from clean evidence.",
  officialAppUserActionContext: "Single visual-only lighting value change, not save/apply/sync/profile switch.",
  mutationScope: "visual-only single-setting",
  riskScore: 2,
  riskScoreExplanation: "Low risk because the future evidence is visual-only and narrow.",
  reversibilityScore: 4,
  reversibilityScoreExplanation: "Rollback is documented and physically verifiable.",
  rollbackRecoveryPlan: "Restore the documented prior visual lighting value through future approved rollback plan.",
  preWriteBackupRequirements: "Local backup of prior visual lighting value and evidence summary is documented.",
  readBackVerificationPlan: "Future read-back approval is deferred to a separate WP; physical verification is documented.",
  physicalVerificationPlan: "Human tester can verify the visible lighting state and restore the prior value.",
  hardwareRiskClassification: "visual-only-low-risk",
  safetyRationale: "Future review only; no WP18 execution.",
  rejectionRationale: "Not rejected; still future review only.",
  unknownsAndUncertainties: "Future implementation requires pinned command gates and Red Team review.",
  gplSourceCleanlinessStatement:
    "No GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material copied.",
  futureImplementationRequirements: "Separate future implementation WP and Red Team plan.",
  futureRedTeamReviewRequirements: "Review exact command, backup, rollback, verification, and failure handling.",
  reviewerNotes: "Synthetic test candidate only.",
};

function packWithCandidates(candidates: FirstWriteCandidateDossier[]): FirstWriteEvidencePack {
  return {
    ...EXAMPLE_FIRST_WRITE_EVIDENCE_PACK,
    candidates,
  };
}

describe("first write candidate selection", () => {
  it("preserves the WP13/WP16 read-only command boundary", () => {
    expect(CONTROLLED_READ_REPORT_ID).toBe(0);
    expect(CONTROLLED_READ_REQUEST_LENGTH).toBe(64);
    expect(CONTROLLED_READ_REQUEST_BYTES.slice(0, 8)).toEqual([0xaa, 0x10, 0x30, 0, 0, 0, 1, 0]);
    expect(CONTROLLED_READ_REQUIRED_USAGE_PAGE).toBe(65384);
    expect(CONTROLLED_READ_REQUIRED_USAGE).toBe(97);
    expect(FUTURE_WRITE_GATE.enabled).toBe(false);
    expect(FUTURE_WRITE_GATE.status).toBe("disabled");
  });

  it("selects Outcome A for the current WP17 placeholder evidence", () => {
    const review = reviewFirstWriteCandidateSelection(EXAMPLE_FIRST_WRITE_EVIDENCE_PACK);

    expect(review.outcome).toBe("Outcome A - no candidate selected");
    expect(review.selectedCandidateCount).toBe(0);
    expect(review.writeCommandApproved).toBe(false);
    expect(review.writeSupportImplemented).toBe(false);
    expect(review.commandExecutionEnabled).toBe(false);
    expect(review.candidateSelectionEnablesExecution).toBe(false);
    expect(review.rejectionSummary).toContain("No candidate satisfies");
    expect(review.records.map((record) => record.selectionStatus)).toEqual([
      "rejected-too-risky",
      "rejected-too-risky",
    ]);
  });

  it("allows only WP18 non-execution selection statuses", () => {
    expect(FIRST_WRITE_SELECTION_STATUSES).toEqual([
      "not-selected",
      "rejected-insufficient-evidence",
      "rejected-too-risky",
      "rejected-not-first-write-appropriate",
      "selected-for-future-WP-review",
    ]);
  });

  it("selects exactly one fully qualified candidate for future WP review only", () => {
    const review = reviewFirstWriteCandidateSelection(packWithCandidates([qualifiedCandidate]));
    const selected = review.records[0];

    expect(review.outcome).toBe("Outcome B - exactly one candidate selected");
    expect(review.selectedCandidateCount).toBe(1);
    expect(review.selectedCandidateId).toBe("qualified-visual-lighting-candidate");
    expect(selected.selectionStatus).toBe("selected-for-future-WP-review");
    expect(selected.executionEnabled).toBe(false);
    expect(selected.writeApproved).toBe(false);
    expect(selected.exactSelectedPathInterfaceRequired).toBe(true);
    expect(selected.futureImplementationConstraints.join(" ")).toContain("Separate future work package");
  });

  it("rejects multiple selected candidates instead of enabling execution", () => {
    const review = reviewFirstWriteCandidateSelection(
      packWithCandidates([
        qualifiedCandidate,
        { ...qualifiedCandidate, candidateId: "second-qualified-candidate" },
      ]),
    );

    expect(review.errors).toContain("WP18 cannot select more than one future first-write candidate.");
    expect(review.records.filter((record) => record.selectionStatus === "selected-for-future-WP-review")).toHaveLength(1);
    expect(review.records.every((record) => record.executionEnabled === false)).toBe(true);
    expect(review.writeCommandApproved).toBe(false);
  });

  it("enforces risk and reversibility thresholds", () => {
    const highRisk = reviewFirstWriteCandidateSelection(
      packWithCandidates([{ ...qualifiedCandidate, riskScore: 3 }]),
    );
    const lowReversibility = reviewFirstWriteCandidateSelection(
      packWithCandidates([{ ...qualifiedCandidate, reversibilityScore: 3 }]),
    );

    expect(highRisk.records[0].selectionStatus).toBe("rejected-too-risky");
    expect(lowReversibility.records[0].selectionStatus).toBe("rejected-insufficient-evidence");
  });

  it("requires backup, rollback, and read-back or physical verification evidence", () => {
    const noBackup = reviewFirstWriteCandidateSelection(
      packWithCandidates([{ ...qualifiedCandidate, preWriteBackupRequirements: "Missing backup." }]),
    );
    const noVerification = reviewFirstWriteCandidateSelection(
      packWithCandidates([
        {
          ...qualifiedCandidate,
          readBackVerificationPlan: "Missing read-back.",
          physicalVerificationPlan: "Unknown physical verification.",
        },
      ]),
    );

    expect(noBackup.records[0].selectionStatus).toBe("rejected-insufficient-evidence");
    expect(noVerification.records[0].selectionStatus).toBe("rejected-insufficient-evidence");
    expect(noVerification.records[0].errors.join(" ")).toContain("Read-back or physical verification");
  });

  it("rejects unsuitable first-write categories", () => {
    const review = reviewFirstWriteCandidateSelection(
      packWithCandidates([
        {
          ...qualifiedCandidate,
          category: "blocked-keymap-write",
          hardwareRiskClassification: "profile-wide-high-risk",
        },
      ]),
    );

    expect(review.records[0].selectionStatus).toBe("rejected-too-risky");
  });

  it("rejects suspicious executable-looking fields in imported selection data", () => {
    const parsed = parseFirstWriteCandidateSelectionJson(
      JSON.stringify({
        schemaVersion: 1,
        writeCommandApproved: false,
        writeSupportImplemented: false,
        commandExecutionEnabled: false,
        candidateSelectionEnablesExecution: false,
        futureWriteGate: "disabled",
        records: [{ candidateId: "bad", executeWrite: true, commandRegistry: { writeCommand: "AA 00" } }],
      }),
    );

    expect(parsed.errors).toContain("Executable-looking fields are not allowed in WP18 selection data.");
    expect(parsed.executableFieldPaths).toEqual([
      "records[0].executeWrite",
      "records[0].commandRegistry",
      "records[0].commandRegistry.writeCommand",
    ]);
  });

  it("exports inert local candidate-selection data", () => {
    const exported = createFirstWriteCandidateSelectionExport({ now: new Date("2026-06-30T00:00:00.000Z") });

    expect(exported).toMatchObject({
      exportType: "ak680-first-write-candidate-selection",
      timestamp: "2026-06-30T00:00:00.000Z",
      workPackage: "WP18",
      localOnly: true,
      candidateSelectionOnly: true,
      writeCommandApproved: false,
      writeSupportImplemented: false,
      commandExecutionEnabled: false,
      validationTouchesHidDevices: false,
    });
    expect(JSON.stringify(exported)).not.toContain("payloadExecution");
    expect(exported.review.outcome).toBe("Outcome A - no candidate selected");
  });

  it("documents safety boundaries and GPL cleanliness", () => {
    const safetyText = WP18_SAFETY_NOTES.join(" ");

    expect(safetyText).toContain("candidate-selection only");
    expect(safetyText).toContain("does not implement, approve, enable, or execute any write command");
    expect(safetyText).toContain("WP13/WP16 read-only command boundary remains unchanged");
    expect(safetyText).toContain("GPL-3.0 source code");
  });
});
