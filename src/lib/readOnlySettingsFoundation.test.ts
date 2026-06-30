import { describe, expect, it } from "vitest";
import {
  CONTROLLED_READ_REPORT_ID,
  CONTROLLED_READ_REQUEST_BYTES,
  CONTROLLED_READ_REQUEST_LENGTH,
  createControlledReadExperimentState,
  createControlledReadResultFromBackend,
} from "./controlledReadExperiment";
import {
  APPROVED_READ_ONLY_COMMANDS,
  FUTURE_WRITE_GATE,
  createReadOnlyDeviceSnapshot,
  createReadOnlySnapshotExport,
  createSnapshotProfileComparison,
  parseApprovedReadOnlyResponse,
} from "./readOnlySettingsFoundation";
import type { HidDetectionResult, HidDeviceMetadata } from "../types/hid";
import type { AjazzProfile } from "../types/profile";

const matchingDevice: HidDeviceMetadata = {
  vendorId: 3141,
  productId: 32956,
  matchedTarget: true,
  path: "safe-selected-path",
  usagePage: 65384,
  usage: 97,
  interfaceNumber: 2,
};

const detection: HidDetectionResult = {
  targetDetected: true,
  targetVendorId: 3141,
  targetProductId: 32956,
  devices: [matchingDevice],
};

const responseBytes = [0x55, 0x10, 0x30, 0, 0, 0, 1, 0, 0, 0, 0, 0x92, 0x45, 0x0c, 0xbc, 0x80];
const selectedPath = "safe-selected-path";

describe("read-only settings foundation", () => {
  it("approves only the existing WP13 controlled read command", () => {
    expect(APPROVED_READ_ONLY_COMMANDS).toHaveLength(1);
    const command = APPROVED_READ_ONLY_COMMANDS[0];

    expect(command.id).toBe("wp13-device-info-read");
    expect(command.reportId).toBe(CONTROLLED_READ_REPORT_ID);
    expect(command.requestLength).toBe(CONTROLLED_READ_REQUEST_LENGTH);
    expect(command.requestBytes).toEqual(CONTROLLED_READ_REQUEST_BYTES);
    expect(command.requestBytes.slice(0, 8)).toEqual([0xaa, 0x10, 0x30, 0, 0, 0, 1, 0]);
    expect(command.requiredInterface).toMatchObject({
      usagePage: 65384,
      usage: 97,
      exactSelectedPathRequired: true,
      keyboardInterfaceBlocked: true,
      consumerControlInterfaceBlocked: true,
    });
    expect(command.manualConfirmationRequired).toBe(true);
    expect(command.oneShotOnly).toBe(true);
    expect(command.retryCount).toBe(0);
    expect(command.pollingEnabled).toBe(false);
    expect(command.automaticExecutionEnabled).toBe(false);
  });

  it("separates known fields, unknown fields, raw bytes, warnings, and confidence", () => {
    const parsed = parseApprovedReadOnlyResponse({
      commandId: "wp13-device-info-read",
      responseBytes,
    });

    expect(parsed.status).toBe("parsed");
    expect(parsed.rawHex).toBe("55 10 30 00 00 00 01 00 00 00 00 92 45 0C BC 80");
    expect(parsed.knownFields.map((field) => field.key)).toEqual(["responsePrefix", "observedVidPidLikeBytes"]);
    expect(parsed.unknownFields[0].label).toBe("Unparsed response bytes");
    expect(parsed.parserWarnings).toEqual([]);
    expect(parsed.confidence).toBe("medium");
  });

  it("treats invalid or partial responses conservatively", () => {
    const parsed = parseApprovedReadOnlyResponse({
      commandId: "wp13-device-info-read",
      responseBytes: [0x01, 0x02],
    });

    expect(parsed.status).toBe("invalid");
    expect(parsed.confidence).toBe("low");
    expect(parsed.parserWarnings.join(" ")).toContain("Response prefix does not match");
    expect(parsed.parserWarnings.join(" ")).toContain("too short");
  });

  it("creates a local read-only snapshot from existing state without hidden execution", () => {
    const result = createControlledReadResultFromBackend({
      selectedInterface: matchingDevice,
      now: new Date("2026-06-30T00:00:00.000Z"),
      backendResult: {
        status: "success",
        message: "ok",
        reportId: 0,
        requestLength: 64,
        responseLength: responseBytes.length,
        responseBytes,
      },
    });
    const state = createControlledReadExperimentState({
      hidDetection: detection,
      selectedPath,
      result,
    });
    const snapshot = createReadOnlyDeviceSnapshot({
      controlledReadState: state,
      selectedInterface: matchingDevice,
      appVersion: "0.1.0",
      now: new Date("2026-06-30T00:01:00.000Z"),
    });

    expect(snapshot.readOnly).toBe(true);
    expect(snapshot.writeSupport).toBe(false);
    expect(snapshot.applySyncSaveToDeviceSupport).toBe(false);
    expect(snapshot.hardwareReadPerformed).toBe(true);
    expect(snapshot.commandResults[0].status).toBe("success");
    expect(snapshot.commandResults[0].parsed.knownFields[0].value).toBe("55 10 30");
  });

  it("exports snapshots as local inert JSON shape", () => {
    const state = createControlledReadExperimentState({
      hidDetection: detection,
      selectedPath,
    });
    const snapshot = createReadOnlyDeviceSnapshot({
      controlledReadState: state,
      selectedInterface: matchingDevice,
      appVersion: "0.1.0",
    });
    const exported = createReadOnlySnapshotExport({ snapshot, now: new Date("2026-06-30T00:02:00.000Z") });

    expect(exported).toMatchObject({
      exportType: "ak680-read-only-device-snapshot",
      workPackage: "WP16",
      localOnly: true,
      readOnly: true,
      hidAccessDuringExport: false,
      commandExecutionDuringExport: false,
      writeSupport: false,
      applySyncSaveToDeviceSupport: false,
    });
    expect(JSON.stringify(exported)).not.toContain("payloadExecution");
    expect(JSON.stringify(exported)).not.toContain("commandRegistry");
  });

  it("compares conservatively and marks unsupported fields as unsupported rather than differences", () => {
    const state = createControlledReadExperimentState({
      hidDetection: detection,
      selectedPath,
    });
    const snapshot = createReadOnlyDeviceSnapshot({
      controlledReadState: state,
      selectedInterface: matchingDevice,
      appVersion: "0.1.0",
    });
    const profile: AjazzProfile = {
      deviceId: "3141:32956:AJAZZ AK680 V2",
      ledEffect: { mode: 1 },
      keyList: [],
    };
    const comparison = createSnapshotProfileComparison({ snapshot, profile });

    expect(comparison.rows.find((row) => row.field === "Device identity")?.category).toBe("match");
    expect(comparison.rows.find((row) => row.field === "Lighting state")?.category).toBe(
      "unsupported by current read-only command pack",
    );
    expect(comparison.safetyNotes.join(" ")).toContain("Differences cannot be applied");
  });

  it("keeps future write gate disabled and non-bypassable", () => {
    expect(FUTURE_WRITE_GATE).toMatchObject({
      enabled: false,
      status: "disabled",
      requiresSeparateWorkPackage: true,
      requiresRedTeamPlan: true,
      bypassAvailable: false,
      hidAccessAllowed: false,
    });
    expect(FUTURE_WRITE_GATE.checklist.every((item) => item.status === "blocked")).toBe(true);
  });
});
