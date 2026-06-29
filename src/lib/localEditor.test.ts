import { describe, expect, it } from "vitest";
import {
  createEditedRaw,
  createEditorDiffSummary,
  createEditorSessionFromImported,
  createEditorSessionFromSaved,
  setEditorProfileName,
  setFirstMagneticAxisValue,
  setKeyUserAssignment,
  setLightingValue,
  validateEditorSession,
} from "./localEditor";
import { createSavedLocalProfile } from "./localProfiles";
import type { ImportedProfile } from "../types/profile";

const importedProfile: ImportedProfile = {
  sourceName: "sample.json",
  raw: {
    profile: {
      deviceId: "3141:32956:AJAZZ AK680 V2",
      profileName: "Original",
    },
  },
  validation: { valid: true, errors: [], warnings: [] },
  profile: {
    deviceId: "3141:32956:AJAZZ AK680 V2",
    profileName: "Original",
    deviceInfo: { vid: 3141, pid: 32956 },
    keyList: [[{ name: "A" }, { name: "S", userKey: { name: "SOCD" } }]],
    gameModeInfo: { reportRate: 8, keyDelay: 1, sleepTime: 10 },
    ledEffect: { mode: 1, brightness: 80, speed: 5, red: 10, green: 20, blue: 30 },
    macroDataList: [{ name: "macro", steps: [1, 2, 3] }],
    magneticAxisRT: [{ pressRT: 0.2, releaseRT: 0.4, triggerKeyStroke: 1 }],
  },
};

describe("local editor helpers", () => {
  it("creates a deep-cloned edit session from a valid imported profile", () => {
    const session = createEditorSessionFromImported(importedProfile);

    expect(session).toBeDefined();
    const renamed = setEditorProfileName(session!, "Edited");

    expect(renamed.workingProfile.profileName).toBe("Edited");
    expect(importedProfile.profile.profileName).toBe("Original");
    expect(session!.originalProfile.profileName).toBe("Original");
  });

  it("does not create an edit session from an invalid import", () => {
    const session = createEditorSessionFromImported({
      ...importedProfile,
      validation: { valid: false, errors: ["Invalid"], warnings: [] },
    });

    expect(session).toBeUndefined();
  });

  it("tracks keymap edits without mutating a saved profile", () => {
    const saved = createSavedLocalProfile(importedProfile);
    const session = createEditorSessionFromSaved(saved);
    const edited = setKeyUserAssignment(session, 0, 0, "Space");
    const diff = createEditorDiffSummary(edited);

    expect(edited.workingProfile.keyList?.[0]?.[0]?.userKey?.name).toBe("Space");
    expect(saved.profile.keyList?.[0]?.[0]?.userKey).toBeUndefined();
    expect(diff.changed).toBe(true);
    expect(diff.keymapChangedCount).toBe(1);
  });

  it("blocks unsupported key assignment characters", () => {
    const session = createEditorSessionFromImported(importedProfile)!;
    const edited = setKeyUserAssignment(session, 0, 0, "Bad!Name");
    const validation = validateEditorSession(edited);

    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" ")).toContain("unsupported characters");
  });

  it("blocks out-of-range RT and lighting values", () => {
    const session = createEditorSessionFromImported(importedProfile)!;
    const invalidRt = setFirstMagneticAxisValue(session, "pressRT", 11);
    const invalidLighting = setLightingValue(session, "brightness", 300);

    expect(validateEditorSession(invalidRt).valid).toBe(false);
    expect(validateEditorSession(invalidLighting).valid).toBe(false);
  });

  it("requires macroDataList to stay exactly preserved", () => {
    const session = createEditorSessionFromImported(importedProfile)!;
    const changedMacro = {
      ...session,
      workingProfile: {
        ...session.workingProfile,
        macroDataList: [{ name: "changed" }],
      },
    };

    expect(validateEditorSession(session).valid).toBe(true);
    expect(validateEditorSession(changedMacro).errors.join(" ")).toContain("macroDataList must remain unchanged");
  });

  it("exports the edited profile while preserving wrapper shape", () => {
    const session = createEditorSessionFromImported(importedProfile)!;
    const edited = setEditorProfileName(session, "Exported");
    const raw = createEditedRaw(edited);

    expect(raw).toMatchObject({
      profile: {
        profileName: "Exported",
        macroDataList: [{ name: "macro", steps: [1, 2, 3] }],
      },
    });
  });
});
