import { describe, expect, it } from "vitest";
import type { HidDetectionResult, HidDeviceMetadata } from "../types/hid";
import {
  CONTROLLED_LIGHTING_WRITE_PACKET_BYTES,
  CONTROLLED_LIGHTING_WRITE_PACKET_HEX,
  CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH,
  CONTROLLED_LIGHTING_WRITE_REPORT_ID,
  CONTROLLED_LIGHTING_WRITE_REQUIRED_USAGE,
  CONTROLLED_LIGHTING_WRITE_REQUIRED_USAGE_PAGE,
  assertWp21BoundariesForTests,
  createCanceledControlledLightingWriteResult,
  createControlledLightingWriteBackendRequest,
  createControlledLightingWriteExperimentState,
  createControlledLightingWriteExport,
  createControlledLightingWriteResultFromBackend,
  getControlledLightingWriteCandidateInterfaces,
} from "./controlledLightingWriteExperiment";

const matchingDevice: HidDeviceMetadata = {
  vendorId: 3141,
  productId: 32956,
  matchedTarget: true,
  path: "hid-path-a",
  usagePage: 65384,
  usage: 97,
  interfaceNumber: 2,
  serialNumber: "private-serial",
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

const wrongUsageInterface: HidDeviceMetadata = {
  ...matchingDevice,
  path: "wrong-usage-path",
  usagePage: 65384,
  usage: 98,
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
  devices: [matchingDevice, keyboardInterface, consumerInterface, wrongUsageInterface, nonMatchingDevice],
};

describe("controlled lighting write experiment", () => {
  it("defines exactly the approved WP21 report id, length, and packet bytes", () => {
    expect(CONTROLLED_LIGHTING_WRITE_REPORT_ID).toBe(0);
    expect(CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH).toBe(64);
    expect(CONTROLLED_LIGHTING_WRITE_PACKET_BYTES).toEqual([
      0xaa, 0x23, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0xff, 0x00, 0x00, 0xff,
      0x00, 0x00, 0x00, 0x00, 0x05, 0x03, 0x00, 0x00, 0x00, 0xaa, 0x55, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    expect(CONTROLLED_LIGHTING_WRITE_PACKET_HEX).toContain("AA 23 10");
  });

  it("filters candidate interfaces to target devices with paths", () => {
    expect(getControlledLightingWriteCandidateInterfaces(detection)).toEqual([
      matchingDevice,
      keyboardInterface,
      consumerInterface,
      wrongUsageInterface,
    ]);
  });

  it("requires target detection, exact path, usage metadata, and manual confirmation", () => {
    const missingTarget = createControlledLightingWriteExperimentState({
      hidDetection: { ...detection, targetDetected: false, devices: [nonMatchingDevice] },
      manualConfirmation: true,
    });
    const missingPath = createControlledLightingWriteExperimentState({ hidDetection: detection, manualConfirmation: true });
    const wrongPath = createControlledLightingWriteExperimentState({
      hidDetection: detection,
      selectedPath: "hid-path-b",
      manualConfirmation: true,
    });
    const missingConfirmation = createControlledLightingWriteExperimentState({
      hidDetection: detection,
      selectedPath: "hid-path-a",
      manualConfirmation: false,
    });
    const ready = createControlledLightingWriteExperimentState({
      hidDetection: detection,
      selectedPath: "hid-path-a",
      manualConfirmation: true,
    });

    expect(missingTarget.canRun).toBe(false);
    expect(missingPath.canRun).toBe(false);
    expect(wrongPath.canRun).toBe(false);
    expect(missingConfirmation.canRun).toBe(false);
    expect(ready.canRun).toBe(true);
  });

  it("blocks keyboard, consumer-control, and wrong usage interfaces", () => {
    const keyboard = createControlledLightingWriteExperimentState({
      hidDetection: detection,
      selectedPath: "keyboard-path",
      manualConfirmation: true,
    });
    const consumer = createControlledLightingWriteExperimentState({
      hidDetection: detection,
      selectedPath: "consumer-path",
      manualConfirmation: true,
    });
    const wrongUsage = createControlledLightingWriteExperimentState({
      hidDetection: detection,
      selectedPath: "wrong-usage-path",
      manualConfirmation: true,
    });

    expect(keyboard.canRun).toBe(false);
    expect(keyboard.runDisabledReason).toContain("Keyboard interface");
    expect(consumer.canRun).toBe(false);
    expect(consumer.runDisabledReason).toContain("Consumer-control");
    expect(wrongUsage.canRun).toBe(false);
    expect(wrongUsage.runDisabledReason).toContain("usage");
  });

  it("creates backend request only from selected metadata after manual checkbox confirmation", () => {
    expect(createControlledLightingWriteBackendRequest(undefined, true)).toBeUndefined();
    expect(createControlledLightingWriteBackendRequest(matchingDevice, false)).toBeUndefined();
    expect(createControlledLightingWriteBackendRequest(matchingDevice, true)).toEqual({
      selectedPath: "hid-path-a",
      vendorId: 3141,
      productId: 32956,
      usagePage: 65384,
      usage: 97,
      manualConfirmation: true,
    });
  });

  it("creates canceled result without a write attempt", () => {
    const result = createCanceledControlledLightingWriteResult({
      selectedInterface: matchingDevice,
      now: new Date("2026-07-01T00:00:00.000Z"),
    });

    expect(result.status).toBe("canceled");
    expect(result.writeAttemptCount).toBe(0);
    expect(result.retryCount).toBe(0);
    expect(result.followUpPacketCount).toBe(0);
    expect(result.packetHex).toBe(CONTROLLED_LIGHTING_WRITE_PACKET_HEX);
  });

  it("formats backend result as one-shot evidence state", () => {
    const result = createControlledLightingWriteResultFromBackend({
      selectedInterface: matchingDevice,
      now: new Date("2026-07-01T00:00:00.000Z"),
      backendResult: {
        status: "success",
        message: "ok",
        reportId: 0,
        packetLength: 64,
        attemptedPacket: CONTROLLED_LIGHTING_WRITE_PACKET_BYTES,
        writeAttemptCount: 1,
        retryCount: 0,
        followUpPacketCount: 0,
      },
    });

    expect(result.status).toBe("success");
    expect(result.writeAttemptCount).toBe(1);
    expect(result.retryCount).toBe(0);
    expect(result.followUpPacketCount).toBe(0);
    expect(result.physicalVerificationReminder).toContain("Physically verify");
  });

  it("exports local evidence without serials or full HID paths", () => {
    const state = createControlledLightingWriteExperimentState({
      hidDetection: detection,
      selectedPath: "hid-path-a",
      manualConfirmation: true,
      result: createControlledLightingWriteResultFromBackend({
        selectedInterface: matchingDevice,
        now: new Date("2026-07-01T00:00:00.000Z"),
        backendResult: {
          status: "success",
          message: "ok",
          reportId: 0,
          packetLength: 64,
          attemptedPacket: CONTROLLED_LIGHTING_WRITE_PACKET_BYTES,
          writeAttemptCount: 1,
          retryCount: 0,
          followUpPacketCount: 0,
        },
      }),
    });
    const exported = createControlledLightingWriteExport({ state, now: new Date("2026-07-01T00:00:00.000Z") });
    const serialized = JSON.stringify(exported);

    expect(exported.exportType).toBe("ak680-wp21-controlled-lighting-write-evidence");
    expect(exported.noSensitiveData).toBe(true);
    expect(exported.selectedInterface?.pathRedacted).toBe(true);
    expect(exported.selectedInterface?.serialNumberIncluded).toBe(false);
    expect(exported.writeAttemptCount).toBe(1);
    expect(exported.retryCount).toBe(0);
    expect(exported.followUpPacketCount).toBe(0);
    expect(serialized).not.toContain("private-serial");
    expect(serialized).not.toContain("hid-path-a");
  });

  it("preserves WP13/WP16 read boundary and WP20 dry-run non-execution", () => {
    const boundaries = assertWp21BoundariesForTests();

    expect(boundaries.controlledReadReportId).toBe(0);
    expect(boundaries.controlledReadRequestLength).toBe(64);
    expect(boundaries.controlledReadRequestPrefix).toEqual([0xaa, 0x10, 0x30, 0, 0, 0, 1, 0]);
    expect(boundaries.controlledReadUsagePage).toBe(CONTROLLED_LIGHTING_WRITE_REQUIRED_USAGE_PAGE);
    expect(boundaries.controlledReadUsage).toBe(CONTROLLED_LIGHTING_WRITE_REQUIRED_USAGE);
    expect(boundaries.wp20DryRunReportId).toBe(0);
    expect(boundaries.wp20DryRunLength).toBe(64);
    expect(boundaries.wp20DryRunExecutionEnabled).toBe(false);
  });
});
