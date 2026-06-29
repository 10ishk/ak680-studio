import { describe, expect, it } from "vitest";
import {
  CONTROLLED_READ_DISABLED_REASON,
  CONTROLLED_READ_OUTCOME,
  CONTROLLED_READ_QUERY_NAME,
  WP10_MISSING_DEVICE_INFO_EVIDENCE,
  createControlledReadExperimentState,
  createControlledReadExport,
  createDisabledControlledReadResult,
  formatResponseHex,
  getMatchingControlledReadInterfaces,
} from "./controlledReadExperiment";
import type { HidDetectionResult, HidDeviceMetadata } from "../types/hid";

const matchingDevice: HidDeviceMetadata = {
  vendorId: 3141,
  productId: 32956,
  matchedTarget: true,
  path: "hid-path-a",
  usagePage: 65280,
  usage: 1,
  interfaceNumber: 1,
};

const nonMatchingDevice: HidDeviceMetadata = {
  vendorId: 1,
  productId: 2,
  matchedTarget: false,
  path: "hid-path-b",
};

const detection: HidDetectionResult = {
  targetDetected: true,
  targetVendorId: 3141,
  targetProductId: 32956,
  devices: [matchingDevice, nonMatchingDevice],
};

describe("controlled read experiment harness", () => {
  it("filters selectable interfaces to matching devices with paths", () => {
    expect(getMatchingControlledReadInterfaces(detection)).toEqual([matchingDevice]);
  });

  it("blocks the harness when no AK680 V2 is detected", () => {
    const state = createControlledReadExperimentState({
      hidDetection: { ...detection, targetDetected: false, devices: [nonMatchingDevice] },
    });

    expect(state.canRun).toBe(false);
    expect(state.gates.find((gate) => gate.label === "AK680 V2 VID/PID detected")?.status).toBe("blocked");
  });

  it("requires an exact selected matching path", () => {
    const missingSelection = createControlledReadExperimentState({ hidDetection: detection });
    const wrongSelection = createControlledReadExperimentState({ hidDetection: detection, selectedPath: "hid-path-b" });
    const selected = createControlledReadExperimentState({ hidDetection: detection, selectedPath: "hid-path-a" });

    expect(missingSelection.gates.find((gate) => gate.label === "Exact target path/interface selected")?.status).toBe(
      "blocked",
    );
    expect(wrongSelection.gates.find((gate) => gate.label === "Exact target path/interface selected")?.status).toBe(
      "blocked",
    );
    expect(selected.gates.find((gate) => gate.label === "Exact target path/interface selected")?.status).toBe("pass");
  });

  it("stays disabled because no safe query is justified", () => {
    const state = createControlledReadExperimentState({ hidDetection: detection, selectedPath: "hid-path-a" });

    expect(state.implemented).toBe(false);
    expect(state.outcome).toBe(CONTROLLED_READ_OUTCOME);
    expect(state.queryName).toBe(CONTROLLED_READ_QUERY_NAME);
    expect(state.canRun).toBe(false);
    expect(state.runDisabledReason).toBe(CONTROLLED_READ_DISABLED_REASON);
    expect(state.missingEvidence).toEqual(WP10_MISSING_DEVICE_INFO_EVIDENCE);
    expect(state.gates.find((gate) => gate.label === "Device-info query evidence")?.status).toBe("blocked");
  });

  it("keeps command execution disabled even when target and path gates pass", () => {
    const state = createControlledReadExperimentState({ hidDetection: detection, selectedPath: "hid-path-a" });

    expect(state.gates.find((gate) => gate.label === "AK680 V2 VID/PID detected")?.status).toBe("pass");
    expect(state.gates.find((gate) => gate.label === "Exact target path/interface selected")?.status).toBe("pass");
    expect(state.gates.find((gate) => gate.label === "Device-info query evidence")?.status).toBe("blocked");
    expect(state.canRun).toBe(false);
  });

  it("creates an honest disabled result without fake bytes", () => {
    const result = createDisabledControlledReadResult({
      selectedInterface: matchingDevice,
      now: new Date("2026-06-30T00:00:00.000Z"),
    });

    expect(result.status).toBe("disabled");
    expect(result.outcome).toBe(CONTROLLED_READ_OUTCOME);
    expect(result.queryName).toBe(CONTROLLED_READ_QUERY_NAME);
    expect(result.missingEvidence).toEqual(WP10_MISSING_DEVICE_INFO_EVIDENCE);
    expect(result.responseLength).toBe(0);
    expect(result.responseHex).toBe("");
    expect(result.target?.path).toBe("hid-path-a");
  });

  it("formats response hex consistently for future result display", () => {
    expect(formatResponseHex([0, 1, 15, 16, 255])).toBe("00 01 0F 10 FF");
    expect(formatResponseHex([])).toBe("");
  });

  it("exports disabled harness status as local JSON shape", () => {
    const state = createControlledReadExperimentState({ hidDetection: detection, selectedPath: "hid-path-a" });
    const exported = createControlledReadExport({
      state,
      now: new Date("2026-06-30T00:00:00.000Z"),
    });

    expect(exported).toMatchObject({
      exportType: "ak680-controlled-read-experiment",
      implementationStatus: "disabled-not-implemented",
      outcome: CONTROLLED_READ_OUTCOME,
      queryName: CONTROLLED_READ_QUERY_NAME,
      resultStatus: "disabled",
      responseLength: 0,
      responseHex: "",
      rustCommandImplemented: false,
      tauriInvokeImplemented: false,
      hidReportSendImplemented: false,
      fakeResponseBytesIncluded: false,
    });
    expect(exported.fakeResponseBytesIncluded).toBe(false);
    expect(exported.responseHex).toBe("");
    expect(exported.missingEvidence).toEqual(WP10_MISSING_DEVICE_INFO_EVIDENCE);
    expect(exported.safetyNotes.join(" ")).toContain("No Rust controlled-read command is implemented");
    expect(exported.safetyNotes.join(" ")).toContain("No HID report send is implemented");
  });
});
