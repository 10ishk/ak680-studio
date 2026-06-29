import { describe, expect, it } from "vitest";
import {
  PROTOCOL_ASSUMPTIONS,
  PROTOCOL_SAFETY_STATUS,
  createProtocolDiagnosticsSnapshot,
  formatOptionalMetadata,
  getMatchingResearchInterfaces,
  inferLikelyResearchInterface,
} from "./protocolResearch";
import type { HidDetectionResult, HidDeviceMetadata } from "../types/hid";
import type { LocalProfileStorageState } from "../types/localProfile";
import type { ImportedProfile } from "../types/profile";

const matchingDevice: HidDeviceMetadata = {
  vendorId: 3141,
  productId: 32956,
  manufacturer: "AJAZZ",
  product: "AK680 V2",
  serialNumber: null,
  path: "hid-path-a",
  usagePage: 1,
  usage: 6,
  interfaceNumber: 1,
  releaseNumber: 256,
  matchedTarget: true,
};

const nonMatchingDevice: HidDeviceMetadata = {
  vendorId: 1,
  productId: 2,
  matchedTarget: false,
};

const importedProfile: ImportedProfile = {
  sourceName: "sample.json",
  raw: {},
  validation: { valid: true, errors: [], warnings: [] },
  profile: {
    deviceId: "3141:32956:AJAZZ AK680 V2",
    profileName: "Valorant (1)",
    deviceInfo: { vid: 3141, pid: 32956 },
    keyList: [[{ name: "A", userKey: { name: "SOCD" } }, { name: "B" }]],
  },
};

const localProfileStorage: LocalProfileStorageState = {
  schemaVersion: 1,
  profiles: [],
  storageType: "Browser localStorage",
  storageHealth: "healthy",
};

describe("protocol research helpers", () => {
  it("filters matching AK680 V2 interfaces only", () => {
    const result: HidDetectionResult = {
      devices: [matchingDevice, nonMatchingDevice],
      targetDetected: true,
      targetVendorId: 3141,
      targetProductId: 32956,
    };

    expect(getMatchingResearchInterfaces(result)).toEqual([matchingDevice]);
  });

  it("formats missing metadata safely", () => {
    expect(formatOptionalMetadata(undefined)).toBe("Not available");
    expect(formatOptionalMetadata(null)).toBe("Not available");
    expect(formatOptionalMetadata("")).toBe("Not available");
    expect(formatOptionalMetadata(0)).toBe("0");
  });

  it("infers likely research interface only when one matching interface exists", () => {
    expect(inferLikelyResearchInterface([matchingDevice])).toBe(matchingDevice);
    expect(inferLikelyResearchInterface([matchingDevice, { ...matchingDevice, path: "hid-path-b" }])).toBeUndefined();
  });

  it("creates a no-device snapshot with assumptions and safety notes", () => {
    const snapshot = createProtocolDiagnosticsSnapshot({
      importedProfile,
      localProfileStorage,
      appVersion: "0.1.0",
      now: new Date("2026-06-29T00:00:00.000Z"),
    });

    expect(snapshot.timestamp).toBe("2026-06-29T00:00:00.000Z");
    expect(snapshot.matchingInterfaceCount).toBe(0);
    expect(snapshot.hidDetectionStatus).toBe("No HID detection run");
    expect(snapshot.assumptions).toEqual(PROTOCOL_ASSUMPTIONS);
    expect(snapshot.safetyStatus).toEqual(PROTOCOL_SAFETY_STATUS);
  });

  it("creates a snapshot with multiple matching interfaces without over-inference", () => {
    const secondDevice = { ...matchingDevice, path: "hid-path-b", interfaceNumber: null };
    const snapshot = createProtocolDiagnosticsSnapshot({
      hidDetection: {
        devices: [matchingDevice, secondDevice],
        targetDetected: true,
        targetVendorId: 3141,
        targetProductId: 32956,
      },
      importedProfile,
      localProfileStorage,
      appVersion: "0.1.0",
    });

    expect(snapshot.matchingInterfaceCount).toBe(2);
    expect(snapshot.matchingInterfaces.every((device) => !device.likelyResearchInterface)).toBe(true);
    expect(snapshot.matchingInterfaces[1].interfaceNumber).toBe("Not available");
  });
});
