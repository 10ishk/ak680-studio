import { validateAjazzProfile } from "./profileValidation";
import type { AjazzProfile, ImportedProfile, JsonRecord, KeyboardKey } from "../types/profile";
import type { SavedLocalProfile } from "../types/localProfile";

export type EditorSource =
  | { kind: "imported"; label: string }
  | { kind: "saved"; label: string; savedProfileId: string };

export interface LocalEditorSession {
  source: EditorSource;
  originalRaw: unknown;
  originalProfile: AjazzProfile;
  workingProfile: AjazzProfile;
}

export interface EditorDiffSummary {
  changed: boolean;
  keymapChangedCount: number;
  rtStatus: string;
  gameModeStatus: string;
  lightingStatus: string;
  macroStatus: string;
}

export interface EditorValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function createEditorSessionFromImported(importedProfile: ImportedProfile): LocalEditorSession | undefined {
  if (!importedProfile.validation.valid) {
    return undefined;
  }

  return {
    source: { kind: "imported", label: importedProfile.sourceName },
    originalRaw: deepClone(importedProfile.raw),
    originalProfile: deepClone(importedProfile.profile),
    workingProfile: deepClone(importedProfile.profile),
  };
}

export function createEditorSessionFromSaved(savedProfile: SavedLocalProfile): LocalEditorSession {
  return {
    source: { kind: "saved", label: savedProfile.displayName, savedProfileId: savedProfile.id },
    originalRaw: deepClone(savedProfile.raw),
    originalProfile: deepClone(savedProfile.profile),
    workingProfile: deepClone(savedProfile.profile),
  };
}

export function resetEditorSession(session: LocalEditorSession): LocalEditorSession {
  return {
    ...session,
    workingProfile: deepClone(session.originalProfile),
  };
}

export function setEditorProfileName(session: LocalEditorSession, profileName: string): LocalEditorSession {
  return updateWorkingProfile(session, (profile) => {
    profile.profileName = profileName;
  });
}

export function setKeyUserAssignment(
  session: LocalEditorSession,
  rowIndex: number,
  keyIndex: number,
  assignmentName: string,
): LocalEditorSession {
  return updateWorkingProfile(session, (profile) => {
    const key = profile.keyList?.[rowIndex]?.[keyIndex];
    if (!key) {
      return;
    }

    const trimmed = assignmentName.trim();
    if (!trimmed) {
      delete key.userKey;
      return;
    }

    key.userKey = {
      ...(key.userKey ?? {}),
      name: trimmed,
    };
  });
}

export function setFirstMagneticAxisValue(
  session: LocalEditorSession,
  field: "pressRT" | "releaseRT" | "triggerKeyStroke",
  value: number,
): LocalEditorSession {
  return updateWorkingProfile(session, (profile) => {
    if (!Array.isArray(profile.magneticAxisRT) || !isRecord(profile.magneticAxisRT[0])) {
      return;
    }

    profile.magneticAxisRT[0] = {
      ...profile.magneticAxisRT[0],
      [field]: value,
    };
  });
}

export function setGameModeValue(session: LocalEditorSession, field: "reportRate" | "keyDelay" | "sleepTime", value: number) {
  return updateWorkingProfile(session, (profile) => {
    if (!isRecord(profile.gameModeInfo)) {
      return;
    }

    profile.gameModeInfo = {
      ...profile.gameModeInfo,
      [field]: value,
    };
  });
}

export function setLightingValue(
  session: LocalEditorSession,
  field: "mode" | "brightness" | "speed" | "red" | "green" | "blue",
  value: number,
) {
  return updateWorkingProfile(session, (profile) => {
    if (!isRecord(profile.ledEffect)) {
      return;
    }

    profile.ledEffect = {
      ...profile.ledEffect,
      [field]: value,
    };
  });
}

export function validateEditorSession(session?: LocalEditorSession): EditorValidation {
  if (!session) {
    return { valid: false, errors: ["No active local edit session."], warnings: [] };
  }

  const baseValidation = validateAjazzProfile(session.workingProfile);
  const errors = [...baseValidation.errors];
  const warnings = [...baseValidation.warnings];

  if (!Array.isArray(session.workingProfile.keyList)) {
    errors.push("Edited keyList must remain an array.");
  } else {
    session.workingProfile.keyList.forEach((row, rowIndex) => {
      if (!Array.isArray(row)) {
        errors.push(`Edited keyList row ${rowIndex + 1} must remain an array.`);
        return;
      }

      row.forEach((key, keyIndex) => {
        if (!isRecord(key) || typeof key.name !== "string" || !key.name.trim()) {
          errors.push(`Key ${rowIndex + 1}.${keyIndex + 1} must keep a visible name.`);
        }

        const userKeyName = key.userKey?.name;
        if (userKeyName !== undefined && !isSafeAssignmentName(userKeyName)) {
          errors.push(`Key ${rowIndex + 1}.${keyIndex + 1} assignment contains unsupported characters.`);
        }
      });
    });
  }

  validateNumberRecord(session.workingProfile.gameModeInfo, ["reportRate", "keyDelay", "sleepTime"], 0, 1000, errors, "gameModeInfo");
  validateNumberRecord(session.workingProfile.ledEffect, ["mode", "brightness", "speed", "red", "green", "blue"], 0, 255, errors, "ledEffect");
  validateMagneticAxis(session.workingProfile.magneticAxisRT, errors);

  if (stableStringify(session.originalProfile.macroDataList ?? []) !== stableStringify(session.workingProfile.macroDataList ?? [])) {
    errors.push("macroDataList must remain unchanged in this public alpha editor.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function createEditorDiffSummary(session?: LocalEditorSession): EditorDiffSummary {
  if (!session) {
    return {
      changed: false,
      keymapChangedCount: 0,
      rtStatus: "No active edit session",
      gameModeStatus: "No active edit session",
      lightingStatus: "No active edit session",
      macroStatus: "No active edit session",
    };
  }

  const keymapChangedCount = countChangedKeys(session.originalProfile.keyList, session.workingProfile.keyList);
  const rtChanged = sectionChanged(session.originalProfile.magneticAxisRT, session.workingProfile.magneticAxisRT);
  const gameModeChanged = sectionChanged(session.originalProfile.gameModeInfo, session.workingProfile.gameModeInfo);
  const lightingChanged = sectionChanged(session.originalProfile.ledEffect, session.workingProfile.ledEffect);
  const macroChanged = sectionChanged(session.originalProfile.macroDataList ?? [], session.workingProfile.macroDataList ?? []);
  const changed = keymapChangedCount > 0 || rtChanged || gameModeChanged || lightingChanged || macroChanged;

  return {
    changed,
    keymapChangedCount,
    rtStatus: sectionStatus(session.originalProfile.magneticAxisRT, session.workingProfile.magneticAxisRT, "RT/actuation"),
    gameModeStatus: sectionStatus(session.originalProfile.gameModeInfo, session.workingProfile.gameModeInfo, "SOCD/game mode"),
    lightingStatus: sectionStatus(session.originalProfile.ledEffect, session.workingProfile.ledEffect, "Lighting"),
    macroStatus: macroChanged ? "Macro data changed unexpectedly" : "Macro data preserved exactly",
  };
}

export function createEditedRaw(session: LocalEditorSession): unknown {
  const raw = deepClone(session.originalRaw);
  const profile = deepClone(session.workingProfile);

  if (isRecord(raw) && isRecord(raw.profile)) {
    return {
      ...raw,
      profile,
    };
  }

  return profile;
}

export function createEditedImportedProfile(session: LocalEditorSession, sourceName = "local-editor.json"): ImportedProfile {
  const raw = createEditedRaw(session);
  return {
    sourceName,
    raw,
    profile: deepClone(session.workingProfile),
    validation: validateAjazzProfile(session.workingProfile),
  };
}

export function getEditableKeyEntries(profile: AjazzProfile) {
  return (profile.keyList ?? []).flatMap((row, rowIndex) =>
    row.map((key, keyIndex) => ({
      rowIndex,
      keyIndex,
      label: key.name ?? `Key ${rowIndex + 1}.${keyIndex + 1}`,
      originalName: key.name ?? "",
      assignment: key.userKey?.name ?? "",
    })),
  );
}

export function getFirstEditableMagneticAxis(profile: AjazzProfile) {
  return Array.isArray(profile.magneticAxisRT) && isRecord(profile.magneticAxisRT[0]) ? profile.magneticAxisRT[0] : undefined;
}

function updateWorkingProfile(session: LocalEditorSession, updater: (profile: AjazzProfile) => void): LocalEditorSession {
  const workingProfile = deepClone(session.workingProfile);
  updater(workingProfile);
  return {
    ...session,
    workingProfile,
  };
}

function countChangedKeys(left?: KeyboardKey[][], right?: KeyboardKey[][]) {
  const leftKeys = left?.flat() ?? [];
  const rightKeys = right?.flat() ?? [];
  const maxLength = Math.max(leftKeys.length, rightKeys.length);
  let changed = 0;

  for (let index = 0; index < maxLength; index += 1) {
    if (stableStringify(leftKeys[index] ?? null) !== stableStringify(rightKeys[index] ?? null)) {
      changed += 1;
    }
  }

  return changed;
}

function sectionChanged(left: unknown, right: unknown) {
  return stableStringify(left ?? null) !== stableStringify(right ?? null);
}

function sectionStatus(original: unknown, working: unknown, label: string) {
  if (original === undefined && working === undefined) {
    return `${label} section not present`;
  }

  return sectionChanged(original, working) ? `${label} changed locally` : `${label} unchanged`;
}

function validateNumberRecord(
  value: unknown,
  fields: string[],
  min: number,
  max: number,
  errors: string[],
  label: string,
) {
  if (value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    errors.push(`${label} must remain an object.`);
    return;
  }

  fields.forEach((field) => {
    const fieldValue = value[field];
    if (fieldValue === undefined) {
      return;
    }

    if (typeof fieldValue !== "number" || !Number.isFinite(fieldValue) || fieldValue < min || fieldValue > max) {
      errors.push(`${label}.${field} must be a number from ${min} to ${max}.`);
    }
  });
}

function validateMagneticAxis(value: unknown, errors: string[]) {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    errors.push("magneticAxisRT must remain an array when edited.");
    return;
  }

  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`magneticAxisRT record ${index + 1} must remain an object.`);
      return;
    }

    ["pressRT", "releaseRT", "triggerKeyStroke"].forEach((field) => {
      const fieldValue = item[field];
      if (fieldValue === undefined) {
        return;
      }

      if (typeof fieldValue !== "number" || !Number.isFinite(fieldValue) || fieldValue < 0 || fieldValue > 10) {
        errors.push(`magneticAxisRT[${index + 1}].${field} must be a number from 0 to 10.`);
      }
    });
  });
}

function isSafeAssignmentName(value: string) {
  return value.length <= 32 && /^[A-Za-z0-9 _+./()-]+$/.test(value);
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function stableStringify(value: unknown) {
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
