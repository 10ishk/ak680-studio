import { describe, expect, it } from "vitest";
import {
  compareSavedProfiles,
  countActiveMagneticAxis,
  createSavedLocalProfile,
  deleteSavedProfile,
  emptyLocalProfileStore,
  parseLocalProfileStore,
  renameSavedProfile,
} from "./localProfiles";
import type { ImportedProfile } from "../types/profile";
import type { SavedLocalProfile } from "../types/localProfile";

const importedProfile: ImportedProfile = {
  sourceName: "sample.json",
  raw: { deviceId: "3141:32956:AJAZZ AK680 V2" },
  validation: { valid: true, errors: [], warnings: [] },
  profile: {
    deviceId: "3141:32956:AJAZZ AK680 V2",
    profileName: "Valorant (1)",
    deviceInfo: { vid: 3141, pid: 32956 },
    keyList: [[{ name: "A", userKey: { name: "SOCD" } }, { name: "S" }]],
    gameModeInfo: { reportRate: 6 },
    ledEffect: { mode: 15 },
    macroDataList: [],
    magneticAxisRT: [{ isWholeFast: true }],
    magneticAxisRTConfig: { currentModeName: "Normal" },
  },
};

describe("local profile manager helpers", () => {
  it("creates local profile metadata from an imported profile", () => {
    const saved = createSavedLocalProfile(importedProfile, new Date("2026-06-29T00:00:00.000Z"));

    expect(saved.displayName).toBe("Valorant (1)");
    expect(saved.originalProfileName).toBe("Valorant (1)");
    expect(saved.sourceFilename).toBe("sample.json");
    expect(saved.deviceId).toBe("3141:32956:AJAZZ AK680 V2");
    expect(saved.createdAt).toBe("2026-06-29T00:00:00.000Z");
  });

  it("renames display name without accepting empty names", () => {
    const saved = createSavedLocalProfile(importedProfile);
    const renamed = renameSavedProfile([saved], saved.id, "  Match profile  ", new Date("2026-06-29T00:01:00.000Z"));
    const unchanged = renameSavedProfile(renamed, saved.id, "   ");

    expect(renamed[0].displayName).toBe("Match profile");
    expect(renamed[0].updatedAt).toBe("2026-06-29T00:01:00.000Z");
    expect(unchanged[0].displayName).toBe("Match profile");
  });

  it("clears active profile when deleting active profile", () => {
    const saved = createSavedLocalProfile(importedProfile);
    const store = deleteSavedProfile({ version: 1, profiles: [saved], activeProfileId: saved.id }, saved.id);

    expect(store.profiles).toEqual([]);
    expect(store.activeProfileId).toBeUndefined();
  });

  it("compares profile names and user key counts", () => {
    const left = createSavedLocalProfile(importedProfile);
    const right: SavedLocalProfile = {
      ...left,
      id: "right",
      displayName: "Right",
      profile: {
        ...left.profile,
        profileName: "Practice",
        keyList: [[{ name: "A" }, { name: "S" }]],
      },
    };

    const comparison = compareSavedProfiles(left, right);

    expect(comparison.find((row) => row.label === "Profile name")?.status).toBe("different");
    expect(comparison.find((row) => row.label === "User key count")?.left).toBe(1);
    expect(comparison.find((row) => row.label === "User key count")?.right).toBe(0);
  });

  it("handles missing optional sections in comparison", () => {
    const left = createSavedLocalProfile(importedProfile);
    const right: SavedLocalProfile = {
      ...left,
      id: "right",
      profile: {
        deviceId: "3141:32956:AJAZZ AK680 V2",
        profileName: "Minimal",
        deviceInfo: { vid: 3141, pid: 32956 },
        keyList: [],
      },
    };

    const comparison = compareSavedProfiles(left, right);

    expect(comparison.find((row) => row.label === "gameModeInfo")?.right).toBe("Missing");
    expect(comparison.find((row) => row.label === "macroDataList count")?.right).toBe(0);
  });

  it("counts active magnetic axis records", () => {
    expect(countActiveMagneticAxis([{ isWholeFast: true }, { pressRT: 0 }, { pressRT: 0.1 }])).toBe(2);
  });

  it("falls back to an empty store when local storage is empty", () => {
    expect(parseLocalProfileStore(null)).toEqual(emptyLocalProfileStore());
  });
});

