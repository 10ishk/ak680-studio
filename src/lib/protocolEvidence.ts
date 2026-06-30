export const PROTOCOL_EVIDENCE_REQUIRED_ITEMS = [
  "Exact report type",
  "Report ID if applicable",
  "Request bytes or command framing",
  "Expected response length and shape",
  "Target interface and path constraints",
  "Read-only justification",
  "Non-write rationale",
  "Evidence source",
  "GPL cleanliness statement",
];

export const CANDIDATE_QUERY_STATUSES = [
  "draft",
  "needs evidence",
  "rejected",
  "ready for Red Team review",
] as const;

export type CandidateQueryStatus = (typeof CANDIDATE_QUERY_STATUSES)[number];

export interface CandidateQueryDossier {
  candidateName: string;
  evidenceSourceType: string;
  reportType: string;
  reportId: string;
  requestBytesOrFraming: string;
  expectedResponse: string;
  targetInterfacePathNotes: string;
  readOnlyJustification: string;
  nonWriteRationale: string;
  riskAssessment: string;
  gplSourceCleanlinessNotes: string;
  reviewerNotes: string;
  status: CandidateQueryStatus;
}

export interface DossierValidationResult {
  validStatus: boolean;
  complete: boolean;
  readyForRedTeamReview: boolean;
  executionEnabled: false;
  missingFields: Array<keyof CandidateQueryDossier>;
  messages: string[];
}

export interface CandidateQueryDossierExport {
  exportType: "ak680-candidate-query-dossier";
  timestamp: string;
  workPackage: "WP11";
  evidenceOnly: true;
  commandExecutionEnabled: false;
  futureImplementationRequires: string;
  requiredEvidence: string[];
  allowedStatuses: CandidateQueryStatus[];
  dossier: CandidateQueryDossier;
  validation: DossierValidationResult;
  safetyNotes: string[];
}

export const BLANK_CANDIDATE_QUERY_DOSSIER: CandidateQueryDossier = {
  candidateName: "",
  evidenceSourceType: "",
  reportType: "",
  reportId: "",
  requestBytesOrFraming: "",
  expectedResponse: "",
  targetInterfacePathNotes: "",
  readOnlyJustification: "",
  nonWriteRationale: "",
  riskAssessment: "",
  gplSourceCleanlinessNotes: "",
  reviewerNotes: "",
  status: "draft",
};

export const EXAMPLE_CANDIDATE_QUERY_DOSSIER: CandidateQueryDossier = {
  candidateName: "Example placeholder device-info query dossier",
  evidenceSourceType: "Placeholder only; replace with documented non-GPL evidence source",
  reportType: "To be documented; no report type selected in WP11",
  reportId: "To be documented or justified as not applicable",
  requestBytesOrFraming: "To be documented; no guessed bytes or packet framing included",
  expectedResponse: "To be documented; no response interpretation claimed",
  targetInterfacePathNotes: "Must target AK680 V2 VID 3141/PID 32956 and exact selected matching HID path/interface.",
  readOnlyJustification: "To be documented from evidence before any future implementation.",
  nonWriteRationale: "To be documented from evidence before any future implementation.",
  riskAssessment: "Requires future Red Team review. WP11 does not execute this candidate.",
  gplSourceCleanlinessNotes:
    "No GPL-3.0 source code, comments, constants, structures, packet framing, or implementation material may be copied.",
  reviewerNotes: "Example dossier is for evidence collection only and does not enable command execution.",
  status: "needs evidence",
};

const REQUIRED_COMPLETENESS_FIELDS: Array<keyof CandidateQueryDossier> = [
  "candidateName",
  "evidenceSourceType",
  "reportType",
  "reportId",
  "requestBytesOrFraming",
  "expectedResponse",
  "targetInterfacePathNotes",
  "readOnlyJustification",
  "nonWriteRationale",
  "riskAssessment",
  "gplSourceCleanlinessNotes",
];

export function isCandidateQueryStatus(value: string): value is CandidateQueryStatus {
  return CANDIDATE_QUERY_STATUSES.includes(value as CandidateQueryStatus);
}

export function validateCandidateQueryDossier(dossier: CandidateQueryDossier): DossierValidationResult {
  const validStatus = isCandidateQueryStatus(dossier.status);
  const missingFields = REQUIRED_COMPLETENESS_FIELDS.filter((field) => dossier[field].trim().length === 0);
  const complete = validStatus && missingFields.length === 0;
  const readyForRedTeamReview = complete && dossier.status === "ready for Red Team review";
  const messages = [
    validStatus ? "Status is one of the allowed non-execution statuses." : "Status is not allowed.",
    complete
      ? "Required evidence fields are complete for Red Team review consideration."
      : "Required evidence fields are missing.",
    "Dossier evidence does not enable command execution in WP11.",
  ];

  return {
    validStatus,
    complete,
    readyForRedTeamReview,
    executionEnabled: false,
    missingFields,
    messages,
  };
}

export function createCandidateQueryDossierExport({
  dossier,
  now = new Date(),
}: {
  dossier: CandidateQueryDossier;
  now?: Date;
}): CandidateQueryDossierExport {
  return {
    exportType: "ak680-candidate-query-dossier",
    timestamp: now.toISOString(),
    workPackage: "WP11",
    evidenceOnly: true,
    commandExecutionEnabled: false,
    futureImplementationRequires: "A separate future work package and Red Team plan before any additional command execution.",
    requiredEvidence: [...PROTOCOL_EVIDENCE_REQUIRED_ITEMS],
    allowedStatuses: [...CANDIDATE_QUERY_STATUSES],
    dossier,
    validation: validateCandidateQueryDossier(dossier),
    safetyNotes: [
      "WP11 is evidence-only.",
      "Candidate evidence does not enable HID command execution.",
      "No device-info query execution is implemented.",
      "No HID report send is implemented.",
      "No guessed packet bytes are included.",
      "No keyboard settings are changed.",
      "This is not apply, sync, save-to-device, or write support.",
      "No fuzzing, brute forcing, command scanning, background polling, or continuous monitoring is implemented.",
      "GPL-3.0 source code, comments, constants, structures, packet framing, and implementation material were not copied.",
    ],
  };
}
