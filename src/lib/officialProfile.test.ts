import { describe, expect, it } from "vitest";
import fullOfficialProfile from "../../fixtures/ak680-profile.sample.json";
import sanitizedOfficialProfile from "../../fixtures/ak680-official-profile.sanitized.json";
import { parseImportedProfile } from "./profileValidation";
import {
  getActiveRapidTriggerKeys,
  getGameModeSummary,
  getLightingSummary,
  getOfficialProfileWarnings,
  getSocdAssignments,
  inspectOfficialProfile,
} from "./officialProfile";

function parseFixture(fixture: unknown, sourceName = "fixture.json") {
  return parseImportedProfile(JSON.stringify(fixture), sourceName);
}

describe("official AK680 V2 profile model", () => {
  it("imports the official AK680 V2 profile shape", () => {
    const imported = parseFixture(fullOfficialProfile, "ak680-profile.sample.json");

    expect(imported.validation.valid).toBe(true);
    expect(imported.profile.deviceId).toBe("3141:32956:AJAZZ AK680 V2");
    expect(imported.profile.profileName).toBe("Valorant (1)");
    expect(imported.profile.deviceInfo?.vid).toBe(3141);
    expect(imported.profile.deviceInfo?.pid).toBe(32956);
    expect(imported.profile.keyList).toHaveLength(5);
    expect(imported.profile.magneticAxisDKS).toEqual([]);
  });

  it("imports the sanitized official-profile fixture", () => {
    const imported = parseFixture(sanitizedOfficialProfile, "ak680-official-profile.sanitized.json");
    const inspection = inspectOfficialProfile(imported.profile);

    expect(imported.validation.valid).toBe(true);
    expect(inspection.summary.profileName).toBe("Valorant (sanitized)");
    expect(inspection.summary.keyCount).toBe(5);
    expect(inspection.summary.customLedCount).toBe(2);
    expect(inspection.summary.localOnly).toBe(true);
  });

  it("detects SOCD assignments from userKey.page only", () => {
    const imported = parseFixture(fullOfficialProfile);
    const socd = getSocdAssignments(imported.profile);

    expect(socd).toHaveLength(2);
    expect(socd.map((entry) => entry.name)).toEqual(["A", "D"]);
    expect(socd.every((entry) => entry.userKey.page === "SOCD")).toBe(true);

    const renamed = structuredClone(imported.profile);
    const aKey = renamed.keyList?.flat().find((key) => key.name === "A");
    if (aKey?.userKey) {
      aKey.userKey.name = "Not SOCD";
    }
    expect(getSocdAssignments(renamed).map((entry) => entry.name)).toEqual(["A", "D"]);
  });

  it("detects active RT keys and maps RT indexes to keyList value", () => {
    const imported = parseFixture(fullOfficialProfile);
    const activeRt = getActiveRapidTriggerKeys(imported.profile);

    expect(activeRt).toHaveLength(5);
    expect(activeRt.map((entry) => entry.keyName)).toEqual(["W", "A", "S", "D", "Spacebar"]);
    expect(activeRt.every((entry) => entry.mappedBy === "keyList.value")).toBe(true);
    expect(activeRt.every((entry) => entry.pressRT === "0.1")).toBe(true);
    expect(activeRt.every((entry) => entry.releaseRT === "0.15")).toBe(true);
  });

  it("parses lighting and custom LED summaries", () => {
    const imported = parseFixture(fullOfficialProfile);
    const lighting = getLightingSummary(imported.profile);

    expect(lighting.mode).toBe("15");
    expect(lighting.color).toBe("R 255 / G 255 / B 255");
    expect(lighting.brightness).toBe("5");
    expect(lighting.speed).toBe("3");
    expect(lighting.customLedCount).toBe(128);
    expect(lighting.activeCustomLedCount).toBe(0);
  });

  it("parses game mode summary", () => {
    const imported = parseFixture(fullOfficialProfile);
    const gameMode = getGameModeSummary(imported.profile);

    expect(gameMode.gameMode).toBe("0");
    expect(gameMode.reportRate).toBe("6");
    expect(gameMode.sleepTime).toBe("3");
    expect(gameMode.stabilityMode).toBe("1");
    expect(gameMode.autoCalibration).toBe("1");
  });

  it("warns for missing or unknown official profile fields without touching HID", () => {
    const imported = parseFixture({
      deviceId: "3141:32956:AJAZZ AK680 V2",
      profile: {
        profileName: "Partial",
        deviceInfo: { vid: 3141, pid: 32956 },
        keyList: [],
        mysterySection: true,
      },
    });
    const warnings = getOfficialProfileWarnings(imported.profile);

    expect(warnings.join(" ")).toContain("gameModeInfo");
    expect(warnings.join(" ")).toContain("customLedData");
    expect(warnings.join(" ")).toContain("mysterySection");
    expect(inspectOfficialProfile(imported.profile).summary.localOnly).toBe(true);
  });
});
