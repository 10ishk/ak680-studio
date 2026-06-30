import {
  CONTROLLED_READ_QUERY_NAME,
  CONTROLLED_READ_REPORT_ID,
  CONTROLLED_READ_REQUEST_LENGTH,
  CONTROLLED_READ_REQUIRED_USAGE,
  CONTROLLED_READ_REQUIRED_USAGE_PAGE,
} from "./controlledReadExperiment";

export type HardwareSmokeTestStatus = "not-performed" | "observation-recorded";

export interface HardwareSmokeTestChecklistItem {
  id: string;
  label: string;
  detail: string;
}

export interface HardwareSmokeTestTemplate {
  exportType: "ak680-hardware-smoke-test-template";
  timestamp: string;
  status: HardwareSmokeTestStatus;
  observationOnly: true;
  controlledReadQueryName: string;
  reportId: number;
  requestLength: number;
  requiredTarget: {
    vendorId: 3141;
    productId: 32956;
    usagePage: number;
    usage: number;
    exactSelectedPathRequired: true;
  };
  resultFields: {
    runPerformed: boolean;
    observedStatus: string;
    responseLength: string;
    responseHexPrefix: string;
    observedVidPidLikeBytes: string;
    notes: string;
  };
  safetyBoundaries: string[];
  checklist: HardwareSmokeTestChecklistItem[];
}

export const WP14_RELEASE_SAFETY_STATEMENTS = [
  "WP13 has exactly one controlled device-info read/query.",
  "No additional protocol execution is enabled by the hardware smoke-test checklist.",
  "Hardware smoke-test results are observations only.",
  "No firmware, settings, calibration, layout, memory, profile state, or write capability is inferred from a response.",
  "No writes, apply, sync, save-to-device, retries, polling, scanning, fuzzing, raw command console, arbitrary payload input, or packet editing are implemented.",
];

export const WP14_HARDWARE_SMOKE_TEST_CHECKLIST: HardwareSmokeTestChecklistItem[] = [
  {
    id: "connect-target",
    label: "Connect the physical AK680 V2 in USB/wired mode",
    detail: "The checklist is optional and manual; opening the app or this screen does not run a command.",
  },
  {
    id: "refresh-metadata",
    label: "Refresh read-only HID metadata",
    detail: "Confirm the target VID/PID 3141/32956 appears before considering a controlled read.",
  },
  {
    id: "select-interface",
    label: "Select the exact matching HID path/interface",
    detail: `Use only the selected AK680 V2 path/interface with usagePage ${CONTROLLED_READ_REQUIRED_USAGE_PAGE} and usage ${CONTROLLED_READ_REQUIRED_USAGE} where metadata is available.`,
  },
  {
    id: "confirm-one-query",
    label: "Confirm the single approved controlled read",
    detail: `${CONTROLLED_READ_QUERY_NAME}, report ID ${CONTROLLED_READ_REPORT_ID}, request length ${CONTROLLED_READ_REQUEST_LENGTH} bytes, one manual action, no retries.`,
  },
  {
    id: "record-observation",
    label: "Record the result as an observation only",
    detail: "Record status, response length, response hex prefix, observed VID/PID-like bytes when present, and plain notes without inferring device state.",
  },
  {
    id: "confirm-boundaries",
    label: "Confirm no additional execution path was used",
    detail: "Do not use command scanning, fuzzing, polling, packet editing, arbitrary payload input, raw command consoles, writes, apply, sync, or save-to-device behavior.",
  },
];

export function createHardwareSmokeTestTemplate(now = new Date()): HardwareSmokeTestTemplate {
  return {
    exportType: "ak680-hardware-smoke-test-template",
    timestamp: now.toISOString(),
    status: "not-performed",
    observationOnly: true,
    controlledReadQueryName: CONTROLLED_READ_QUERY_NAME,
    reportId: CONTROLLED_READ_REPORT_ID,
    requestLength: CONTROLLED_READ_REQUEST_LENGTH,
    requiredTarget: {
      vendorId: 3141,
      productId: 32956,
      usagePage: CONTROLLED_READ_REQUIRED_USAGE_PAGE,
      usage: CONTROLLED_READ_REQUIRED_USAGE,
      exactSelectedPathRequired: true,
    },
    resultFields: {
      runPerformed: false,
      observedStatus: "",
      responseLength: "",
      responseHexPrefix: "",
      observedVidPidLikeBytes: "",
      notes: "",
    },
    safetyBoundaries: WP14_RELEASE_SAFETY_STATEMENTS,
    checklist: WP14_HARDWARE_SMOKE_TEST_CHECKLIST,
  };
}
