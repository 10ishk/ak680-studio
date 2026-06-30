import { describe, expect, it } from "vitest";
import {
  CONTROLLED_READ_REPORT_ID,
  CONTROLLED_READ_REQUEST_BYTES,
  CONTROLLED_READ_REQUEST_LENGTH,
  CONTROLLED_READ_REQUIRED_USAGE,
  CONTROLLED_READ_REQUIRED_USAGE_PAGE,
} from "./controlledReadExperiment";
import {
  EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK,
  READ_CANDIDATE_STATUSES,
  WP15_SAFETY_NOTES,
  createReadProtocolEvidencePackExport,
  parseEvidenceHexBytes,
  parseReadProtocolEvidencePackJson,
  validateReadProtocolEvidencePack,
  type CandidateReadDossier,
  type ReadProtocolEvidencePack,
} from "./readProtocolEvidence";

const completeDossier: CandidateReadDossier = {
  candidateId: "device-info-follow-up-review",
  title: "Device-info follow-up candidate for future review",
  readArea: "device-info-follow-up",
  status: "ready-for-future-Red-Team-review",
  evidenceSourceReferences: ["wp13-controlled-read-observation"],
  completenessSummary: "Evidence is organized for future review only.",
  targetDeviceMetadata: "AK680 V2 VID 3141 / PID 32956, usagePage 65384 / usage 97 where observed.",
  observedReportDetails: "Observed report details are documented as evidence data only.",
  timingUserActionContext: "Manual user action, no automatic execution.",
  readOnlyRationale: "Evidence claims device metadata only; future Red Team must review before any execution.",
  writeRiskAssessment: "No write support is claimed; write risk must be reviewed separately.",
  unknownsAndUncertainties: "Settings state, firmware, calibration, layout, memory, and profile meaning remain unknown.",
  safetyBoundaries: "No execution, no retries, no polling, no scanning, no fuzzing, no writes.",
  gplSourceCleanlinessStatement:
    "No GPL-3.0 source code, comments, constants, packet builders, structures, or implementation material copied.",
  reviewerNotes: "Ready for future Red Team review does not enable execution.",
  futureReviewRequirements: "Separate future work package and Red Team plan required before implementation.",
};

function withDossier(dossier: CandidateReadDossier): ReadProtocolEvidencePack {
  return {
    ...EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK,
    dossiers: [dossier],
  };
}

describe("read protocol evidence pack", () => {
  it("preserves the WP13 command boundary constants", () => {
    expect(CONTROLLED_READ_REPORT_ID).toBe(0);
    expect(CONTROLLED_READ_REQUEST_LENGTH).toBe(64);
    expect(CONTROLLED_READ_REQUEST_BYTES.slice(0, 8)).toEqual([0xaa, 0x10, 0x30, 0, 0, 0, 1, 0]);
    expect(CONTROLLED_READ_REQUIRED_USAGE_PAGE).toBe(65384);
    expect(CONTROLLED_READ_REQUIRED_USAGE).toBe(97);
  });

  it("validates the example pack as evidence-only and non-executable", () => {
    const validation = validateReadProtocolEvidencePack(EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK);

    expect(validation.valid).toBe(true);
    expect(validation.evidenceOnly).toBe(true);
    expect(validation.executionEnabled).toBe(false);
    expect(validation.settingsReadSupportImplemented).toBe(false);
    expect(validation.writeSupportImplemented).toBe(false);
    expect(validation.status).toBe("insufficient");
    expect(validation.dossierResults[0].executionEnabled).toBe(false);
  });

  it("classifies complete referenced dossiers without enabling execution", () => {
    const validation = validateReadProtocolEvidencePack(withDossier(completeDossier));

    expect(validation.valid).toBe(true);
    expect(validation.status).toBe("ready-for-future-Red-Team-review");
    expect(validation.dossierResults[0]).toMatchObject({
      classifiedStatus: "ready-for-future-Red-Team-review",
      readyForFutureRedTeamReview: true,
      executionEnabled: false,
    });
  });

  it("downgrades ready status when evidence references are missing", () => {
    const validation = validateReadProtocolEvidencePack(
      withDossier({ ...completeDossier, evidenceSourceReferences: ["missing-evidence-id"] }),
    );

    expect(validation.valid).toBe(false);
    expect(validation.status).toBe("insufficient");
    expect(validation.dossierResults[0].classifiedStatus).toBe("insufficient");
    expect(validation.errors.join(" ")).toContain("references evidence IDs");
  });

  it("rejects malformed JSON and suspicious executable-looking fields", () => {
    expect(parseReadProtocolEvidencePackJson("{not-json").valid).toBe(false);

    const validation = validateReadProtocolEvidencePack({
      ...EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK,
      commandRegistry: { execute: true },
    });

    expect(validation.valid).toBe(false);
    expect(validation.executableFieldPaths).toEqual(["commandRegistry", "commandRegistry.execute"]);
    expect(validation.executionEnabled).toBe(false);
  });

  it("requires parseable byte evidence or documented unknown placeholders", () => {
    expect(parseEvidenceHexBytes("AA 10 30 00")).toEqual([0xaa, 0x10, 0x30, 0]);
    expect(parseEvidenceHexBytes("AA 10 ZZ")).toBeUndefined();

    const pack = {
      ...EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK,
      records: [
        {
          ...EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK.records[0],
          observedRequestBytes: "AA 10 ZZ",
        },
      ],
    };
    expect(validateReadProtocolEvidencePack(pack).valid).toBe(false);
  });

  it("exports local-only inert evidence shape", () => {
    const exported = createReadProtocolEvidencePackExport({
      now: new Date("2026-06-30T00:00:00.000Z"),
    });

    expect(exported).toMatchObject({
      exportType: "ak680-read-protocol-evidence-pack",
      timestamp: "2026-06-30T00:00:00.000Z",
      workPackage: "WP15",
      localOnly: true,
      evidenceOnly: true,
      commandExecutionEnabled: false,
      validationTouchesHidDevices: false,
    });
    expect(exported.allowedCandidateStatuses).toEqual(READ_CANDIDATE_STATUSES);
    expect(exported.validation.executionEnabled).toBe(false);
  });

  it("documents GPL cleanliness and no settings-read/write support claims", () => {
    const safetyText = WP15_SAFETY_NOTES.join(" ");

    expect(safetyText).toContain("No settings-read support is implemented");
    expect(safetyText).toContain("No write support");
    expect(safetyText).toContain("GPL-3.0 source code");
    expect(safetyText).toContain("Validation, import, and export");
  });
});
