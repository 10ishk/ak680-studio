import { describe, expect, it } from "vitest";
import {
  CONTROLLED_READ_OUTCOME,
  CONTROLLED_READ_QUERY_NAME,
  CONTROLLED_READ_REPORT_ID,
  CONTROLLED_READ_REQUEST_BYTES,
  CONTROLLED_READ_REQUEST_HEX,
  CONTROLLED_READ_REQUEST_LENGTH,
  createCanceledControlledReadResult,
  createControlledReadBackendRequest,
  createControlledReadExperimentState,
  createControlledReadExport,
  createControlledReadResultFromBackend,
  formatResponseHex,
  getMatchingControlledReadInterfaces,
  parseControlledReadResponse,
} from "./controlledReadExperiment";
import type { HidDetectionResult, HidDeviceMetadata } from "../types/hid";

const matchingDevice: HidDeviceMetadata = {
  vendorId: 3141,
  productId: 32956,
  matchedTarget: true,
  path: "hid-path-a",
  usagePage: 65384,
  usage: 97,
  interfaceNumber: 2,
};

const keyboardInterface: HidDeviceMetadata = {
  ...matchingDevice,
  path: "keyboard-path",
  usagePage: 1,
  usage: 6,
};

const consumerInterface: HidDeviceMetadata = {
  ...matchingDevice,
  path: "consumer-path",
  usagePage: 12,
  usage: 1,
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

describe("controlled read experiment", () => {
  it("defines exactly the approved report id, length, and request bytes", () => {
    expect(CONTROLLED_READ_REPORT_ID).toBe(0);
    expect(CONTROLLED_READ_REQUEST_LENGTH).toBe(64);
    expect(CONTROLLED_READ_REQUEST_BYTES).toEqual([
      0xaa, 0x10, 0x30, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    expect(CONTROLLED_READ_REQUEST_HEX.startsWith("AA 10 30")).toBe(true);
  });

  it("filters selectable interfaces to matching devices with paths", () => {
    expect(getMatchingControlledReadInterfaces(detection)).toEqual([matchingDevice]);
  });

  it("blocks when no AK680 V2 is detected", () => {
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

    expect(missingSelection.canRun).toBe(false);
    expect(wrongSelection.canRun).toBe(false);
    expect(selected.canRun).toBe(true);
  });

  it("blocks keyboard and consumer-control interfaces", () => {
    const keyboardState = createControlledReadExperimentState({
      hidDetection: { ...detection, devices: [keyboardInterface] },
      selectedPath: "keyboard-path",
    });
    const consumerState = createControlledReadExperimentState({
      hidDetection: { ...detection, devices: [consumerInterface] },
      selectedPath: "consumer-path",
    });

    expect(keyboardState.canRun).toBe(false);
    expect(keyboardState.runDisabledReason).toContain("Keyboard interface");
    expect(consumerState.canRun).toBe(false);
    expect(consumerState.runDisabledReason).toContain("Consumer-control");
  });

  it("creates backend request only from selected metadata", () => {
    expect(createControlledReadBackendRequest(undefined)).toBeUndefined();
    expect(createControlledReadBackendRequest(matchingDevice)).toEqual({
      selectedPath: "hid-path-a",
      vendorId: 3141,
      productId: 32956,
      usagePage: 65384,
      usage: 97,
    });
  });

  it("creates canceled result without response bytes", () => {
    const result = createCanceledControlledReadResult({
      selectedInterface: matchingDevice,
      now: new Date("2026-06-30T00:00:00.000Z"),
    });

    expect(result.status).toBe("canceled");
    expect(result.responseLength).toBe(0);
    expect(result.responseHex).toBe("");
    expect(result.reportId).toBe(0);
    expect(result.requestLength).toBe(64);
  });

  it("formats success response and minimal parse without unsupported claims", () => {
    const result = createControlledReadResultFromBackend({
      selectedInterface: matchingDevice,
      now: new Date("2026-06-30T00:00:00.000Z"),
      backendResult: {
        status: "success",
        message: "ok",
        reportId: 0,
        requestLength: 64,
        responseLength: 16,
        responseBytes: [0x55, 0x10, 0x30, 0, 0, 0, 1, 0, 0, 0, 0, 0x92, 0x45, 0x0c, 0xbc, 0x80],
      },
    });

    expect(result.status).toBe("success");
    expect(result.responseHex).toBe("55 10 30 00 00 00 01 00 00 00 00 92 45 0C BC 80");
    expect(result.minimalParse.prefixMatchesExpected).toBe(true);
    expect(result.minimalParse.observedVidPidLikeBytes).toBe("45 0C BC 80");
    expect(result.minimalParse.notes.join(" ")).not.toMatch(/firmware version|settings state/i);
  });

  it("exports implemented single-query status as local JSON shape", () => {
    const state = createControlledReadExperimentState({ hidDetection: detection, selectedPath: "hid-path-a" });
    const exported = createControlledReadExport({
      state,
      now: new Date("2026-06-30T00:00:00.000Z"),
    });

    expect(exported).toMatchObject({
      exportType: "ak680-controlled-read-experiment",
      implementationStatus: "implemented-single-approved-query",
      outcome: CONTROLLED_READ_OUTCOME,
      queryName: CONTROLLED_READ_QUERY_NAME,
      reportId: 0,
      requestLength: 64,
      retryCount: 0,
      resultStatus: "never-run",
    });
    expect(exported.requestHex).toBe(CONTROLLED_READ_REQUEST_HEX);
    expect(exported.safetyNotes.join(" ")).toContain("No other official-driver connect commands");
    expect(exported.safetyNotes.join(" ")).toContain("No arbitrary command entry");
  });

  it("formats response hex consistently", () => {
    expect(formatResponseHex([0, 1, 15, 16, 255])).toBe("00 01 0F 10 FF");
    expect(formatResponseHex([])).toBe("");
    expect(parseControlledReadResponse([]).prefix).toBe("Not available");
  });
});
