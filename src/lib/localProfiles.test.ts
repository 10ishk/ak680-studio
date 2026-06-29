import { describe, expect, it } from "vitest";
import {
  compareSavedProfiles,
  countActiveMagneticAxis,
  createLocalProfileBackup,
  createSavedLocalProfile,
  deleteSavedProfile,
  emptyLocalProfileStore,
  parseLocalProfileBackup,
  parseLocalProfileStore,
  renameSavedProfile,
  restoreLocalProfileBackup,
  validateLocalProfileBackup,
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

  it("rejects corrupt local storage", () => {
    expect(() => parseLocalProfileStore("{")).toThrow();
  });

  it("rejects incompatible local storage schema", () => {
    expect(() => parseLocalProfileStore(JSON.stringify({ version: 999, profiles: [] }))).toThrow(
      "Unsupported local profile storage schema.",
    );
  });

  it("validates a full library backup", () => {
    const saved = createSavedLocalProfile(importedProfile);
    const backup = createLocalProfileBackup({ version: 1, profiles: [saved], activeProfileId: saved.id });
    const result = validateLocalProfileBackup(backup);

    expect(result.valid).toBe(true);
    expect(result.backup?.profiles).toHaveLength(1);
    expect(result.backup?.activeProfileId).toBe(saved.id);
  });

  it("rejects invalid backup JSON and wrong shapes", () => {
    expect(parseLocalProfileBackup("{").valid).toBe(false);
    expect(validateLocalProfileBackup([]).valid).toBe(false);
    expect(validateLocalProfileBackup({ version: 1 }).valid).toBe(false);
    expect(validateLocalProfileBackup({ version: 999, profiles: [] }).valid).toBe(false);
  });

  it("merge restore preserves existing profiles and re-keys duplicate IDs", () => {
    const existing = createSavedLocalProfile(importedProfile);
    const incoming = { ...createSavedLocalProfile(importedProfile), id: existing.id, displayName: "Incoming" };
    const result = restoreLocalProfileBackup(
      { version: 1, profiles: [existing], activeProfileId: existing.id },
      { version: 1, exportedAt: "2026-06-29T00:00:00.000Z", profiles: [incoming], activeProfileId: incoming.id },
      "merge",
    );

    expect(result.store.profiles).toHaveLength(2);
    expect(new Set(result.store.profiles.map((profile) => profile.id)).size).toBe(2);
    expect(result.store.activeProfileId).toBe(existing.id);
    expect(result.warnings[0]).toContain("duplicate");
  });

  it("replace restore resets invalid active profile IDs safely", () => {
    const incoming = createSavedLocalProfile(importedProfile);
    const result = restoreLocalProfileBackup(
      { version: 1, profiles: [], activeProfileId: "missing" },
      { version: 1, exportedAt: "2026-06-29T00:00:00.000Z", profiles: [incoming], activeProfileId: "missing" },
      "replace",
    );

    expect(result.store.profiles).toHaveLength(1);
    expect(result.store.activeProfileId).toBeUndefined();
  });

  it("normalizes duplicate IDs inside a backup", () => {
    const first = createSavedLocalProfile(importedProfile);
    const second = { ...createSavedLocalProfile(importedProfile), id: first.id };
    const result = validateLocalProfileBackup({
      version: 1,
      exportedAt: "2026-06-29T00:00:00.000Z",
      profiles: [first, second],
    });

    expect(result.valid).toBe(true);
    expect(new Set(result.backup?.profiles.map((profile) => profile.id)).size).toBe(2);
    expect(result.warnings.join(" ")).toContain("Duplicate");
  });
});
