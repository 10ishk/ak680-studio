import { describe, expect, it } from "vitest";
import {
  BLANK_CANDIDATE_QUERY_DOSSIER,
  CANDIDATE_QUERY_STATUSES,
  EXAMPLE_CANDIDATE_QUERY_DOSSIER,
  createCandidateQueryDossierExport,
  isCandidateQueryStatus,
  validateCandidateQueryDossier,
  type CandidateQueryDossier,
} from "./protocolEvidence";

const completeDossier: CandidateQueryDossier = {
  candidateName: "Evidence-backed device-info candidate",
  evidenceSourceType: "Maintainer-authored research note",
  reportType: "Input report documented by evidence",
  reportId: "0x01 or documented not applicable",
  requestBytesOrFraming: "Documented framing reference, not executable bytes",
  expectedResponse: "Documented length and field shape",
  targetInterfacePathNotes: "AK680 V2 VID 3141/PID 32956 exact selected path/interface only",
  readOnlyJustification: "Evidence states this returns device metadata only",
  nonWriteRationale: "Evidence states it does not change settings or persistent state",
  riskAssessment: "Manual opt-in future Red Team review required",
  gplSourceCleanlinessNotes: "No GPL code, constants, structures, comments, or packet implementation copied",
  reviewerNotes: "Ready for review does not enable execution",
  status: "ready for Red Team review",
};

describe("protocol evidence dossier", () => {
  it("allows only non-execution statuses", () => {
    expect(CANDIDATE_QUERY_STATUSES).toEqual([
      "draft",
      "needs evidence",
      "rejected",
      "ready for Red Team review",
    ]);
    expect(isCandidateQueryStatus("ready to run")).toBe(false);
    expect(isCandidateQueryStatus("execute")).toBe(false);
    expect(isCandidateQueryStatus("ready for Red Team review")).toBe(true);
  });

  it("keeps a blank dossier incomplete and non-executable", () => {
    const validation = validateCandidateQueryDossier(BLANK_CANDIDATE_QUERY_DOSSIER);

    expect(validation.complete).toBe(false);
    expect(validation.readyForRedTeamReview).toBe(false);
    expect(validation.executionEnabled).toBe(false);
    expect(validation.missingFields).toContain("reportType");
    expect(validation.missingFields).toContain("requestBytesOrFraming");
  });

  it("blocks readiness when read-only or non-write rationale is missing", () => {
    const validation = validateCandidateQueryDossier({
      ...completeDossier,
      readOnlyJustification: "",
      nonWriteRationale: "",
    });

    expect(validation.complete).toBe(false);
    expect(validation.readyForRedTeamReview).toBe(false);
    expect(validation.missingFields).toEqual(expect.arrayContaining(["readOnlyJustification", "nonWriteRationale"]));
  });

  it("blocks readiness when GPL/source cleanliness notes are missing", () => {
    const validation = validateCandidateQueryDossier({
      ...completeDossier,
      gplSourceCleanlinessNotes: "",
    });

    expect(validation.complete).toBe(false);
    expect(validation.readyForRedTeamReview).toBe(false);
    expect(validation.missingFields).toContain("gplSourceCleanlinessNotes");
  });

  it("can mark a complete dossier ready for Red Team review without enabling execution", () => {
    const validation = validateCandidateQueryDossier(completeDossier);

    expect(validation.complete).toBe(true);
    expect(validation.readyForRedTeamReview).toBe(true);
    expect(validation.executionEnabled).toBe(false);
  });

  it("exports local dossier shape without guessed packet bytes or command enablement", () => {
    const exported = createCandidateQueryDossierExport({
      dossier: EXAMPLE_CANDIDATE_QUERY_DOSSIER,
      now: new Date("2026-06-30T00:00:00.000Z"),
    });

    expect(exported).toMatchObject({
      exportType: "ak680-candidate-query-dossier",
      timestamp: "2026-06-30T00:00:00.000Z",
      workPackage: "WP11",
      evidenceOnly: true,
      commandExecutionEnabled: false,
    });
    expect(exported.allowedStatuses).toEqual(CANDIDATE_QUERY_STATUSES);
    expect(exported.dossier.requestBytesOrFraming).toContain("no guessed bytes");
    expect(exported.validation.executionEnabled).toBe(false);
    expect(exported.safetyNotes.join(" ")).toContain("No HID report send is implemented");
  });
});
