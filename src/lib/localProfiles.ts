import { countUserKeys, getDeviceIdentity, summarizeArray } from "./profileValidation";
import type { ImportedProfile, JsonRecord } from "../types/profile";
import type { ComparisonRow, LocalProfileBackup, LocalProfileStore, SavedLocalProfile } from "../types/localProfile";

export const LOCAL_PROFILE_STORAGE_KEY = "ak680-studio.localProfiles.v1";
export const LOCAL_PROFILE_SCHEMA_VERSION = 1;

export interface BackupValidationResult {
  valid: boolean;
  backup?: LocalProfileBackup;
  error?: string;
  warnings: string[];
}

export interface RestoreResult {
  store: LocalProfileStore;
  message: string;
  warnings: string[];
}

export function createSavedLocalProfile(importedProfile: ImportedProfile, now = new Date()): SavedLocalProfile {
  const timestamp = now.toISOString();
  const profile = importedProfile.profile;
  const identity = getDeviceIdentity(profile);

  return {
    id: createLocalProfileId(now),
    displayName: profile.profileName || importedProfile.sourceName || "Untitled AK680 profile",
    originalProfileName: profile.profileName || "Unknown",
    deviceId: identity.deviceId,
    sourceFilename: importedProfile.sourceName,
    createdAt: timestamp,
    importedAt: timestamp,
    updatedAt: timestamp,
    raw: importedProfile.raw,
    profile,
  };
}

export function parseLocalProfileStore(text: string | null): LocalProfileStore {
  if (!text) {
    return emptyLocalProfileStore();
  }

  const parsed = JSON.parse(text) as Partial<LocalProfileStore>;
  if (parsed.version !== LOCAL_PROFILE_SCHEMA_VERSION) {
    throw new Error("Unsupported local profile storage schema.");
  }

  if (!Array.isArray(parsed.profiles)) {
    throw new Error("Local profile storage is missing a profiles list.");
  }

  const profiles = normalizeProfileIds(parsed.profiles.filter(isSavedLocalProfile));
  const activeProfileId =
    parsed.activeProfileId && profiles.some((profile) => profile.id === parsed.activeProfileId)
      ? parsed.activeProfileId
      : undefined;

  return {
    version: 1,
    activeProfileId,
    profiles,
  };
}

export function serializeLocalProfileStore(store: LocalProfileStore) {
  return JSON.stringify(
    {
      version: LOCAL_PROFILE_SCHEMA_VERSION,
      activeProfileId: store.activeProfileId,
      profiles: store.profiles,
    },
    null,
    2,
  );
}

export function emptyLocalProfileStore(): LocalProfileStore {
  return {
    version: LOCAL_PROFILE_SCHEMA_VERSION,
    profiles: [],
  };
}

export function createLocalProfileBackup(store: LocalProfileStore, now = new Date()): LocalProfileBackup {
  const activeProfileId = store.activeProfileId && store.profiles.some((profile) => profile.id === store.activeProfileId)
    ? store.activeProfileId
    : undefined;

  return {
    version: LOCAL_PROFILE_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    activeProfileId,
    profiles: normalizeProfileIds(store.profiles),
  };
}

export function validateLocalProfileBackup(raw: unknown): BackupValidationResult {
  const warnings: string[] = [];

  if (!isRecord(raw)) {
    return { valid: false, error: "Backup must be a JSON object.", warnings };
  }

  if (raw.version !== LOCAL_PROFILE_SCHEMA_VERSION) {
    return { valid: false, error: "Backup schema version is not supported.", warnings };
  }

  if (!Array.isArray(raw.profiles)) {
    return { valid: false, error: "Backup is missing a profiles list.", warnings };
  }

  const validProfiles = raw.profiles.filter(isSavedLocalProfile);
  const invalidCount = raw.profiles.length - validProfiles.length;
  if (invalidCount > 0) {
    warnings.push(`${invalidCount} malformed profile record(s) were skipped.`);
  }

  const profiles = normalizeProfileIds(validProfiles);
  if (profiles.length !== validProfiles.length || hasDuplicateIds(validProfiles)) {
    warnings.push("Duplicate profile IDs were made unique during validation.");
  }

  const activeProfileId =
    typeof raw.activeProfileId === "string" && profiles.some((profile) => profile.id === raw.activeProfileId)
      ? raw.activeProfileId
      : undefined;

  if (raw.activeProfileId && !activeProfileId) {
    warnings.push("Backup active profile selection was reset because it did not match a restored profile.");
  }

  return {
    valid: true,
    backup: {
      version: LOCAL_PROFILE_SCHEMA_VERSION,
      exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString(),
      activeProfileId,
      profiles,
    },
    warnings,
  };
}

export function parseLocalProfileBackup(text: string): BackupValidationResult {
  try {
    return validateLocalProfileBackup(JSON.parse(text));
  } catch {
    return { valid: false, error: "Backup JSON could not be parsed.", warnings: [] };
  }
}

export function restoreLocalProfileBackup(
  currentStore: LocalProfileStore,
  backup: LocalProfileBackup,
  mode: "merge" | "replace",
): RestoreResult {
  if (mode === "replace") {
    const profiles = normalizeProfileIds(backup.profiles);
    const activeProfileId =
      backup.activeProfileId && profiles.some((profile) => profile.id === backup.activeProfileId)
        ? backup.activeProfileId
        : undefined;

    return {
      store: {
        version: LOCAL_PROFILE_SCHEMA_VERSION,
        profiles,
        activeProfileId,
      },
      message: `Replaced local profile library with ${profiles.length} profile(s).`,
      warnings: activeProfileId ? [] : ["Active profile selection was reset."],
    };
  }

  const existingIds = new Set(currentStore.profiles.map((profile) => profile.id));
  const importedProfiles = backup.profiles.map((profile) => {
    if (!existingIds.has(profile.id)) {
      existingIds.add(profile.id);
      return profile;
    }

    const nextId = makeUniqueProfileId(profile.id, existingIds);
    existingIds.add(nextId);
    return { ...profile, id: nextId, updatedAt: new Date().toISOString() };
  });
  const duplicateCount = importedProfiles.filter((profile, index) => profile.id !== backup.profiles[index].id).length;
  const profiles = normalizeProfileIds([...currentStore.profiles, ...importedProfiles]);
  const activeProfileId =
    currentStore.activeProfileId && profiles.some((profile) => profile.id === currentStore.activeProfileId)
      ? currentStore.activeProfileId
      : backup.activeProfileId && profiles.some((profile) => profile.id === backup.activeProfileId)
        ? backup.activeProfileId
        : undefined;

  return {
    store: {
      version: LOCAL_PROFILE_SCHEMA_VERSION,
      profiles,
      activeProfileId,
    },
    message: `Merged ${backup.profiles.length} backup profile(s) into the local library.`,
    warnings: duplicateCount > 0 ? [`${duplicateCount} duplicate profile ID(s) were made unique.`] : [],
  };
}

export function renameSavedProfile(
  profiles: SavedLocalProfile[],
  profileId: string,
  displayName: string,
  now = new Date(),
) {
  const trimmedName = displayName.trim();
  if (!trimmedName) {
    return profiles;
  }

  return profiles.map((profile) =>
    profile.id === profileId ? { ...profile, displayName: trimmedName, updatedAt: now.toISOString() } : profile,
  );
}

export function deleteSavedProfile(store: LocalProfileStore, profileId: string): LocalProfileStore {
  const profiles = store.profiles.filter((profile) => profile.id !== profileId);

  return {
    version: LOCAL_PROFILE_SCHEMA_VERSION,
    profiles,
    activeProfileId: store.activeProfileId === profileId ? undefined : store.activeProfileId,
  };
}

export function compareSavedProfiles(left: SavedLocalProfile, right: SavedLocalProfile): ComparisonRow[] {
  return [
    comparisonRow("Profile name", valueOrFallback(left.profile.profileName), valueOrFallback(right.profile.profileName)),
    comparisonRow("Device identity", left.deviceId || "Unknown", right.deviceId || "Unknown"),
    comparisonRow("Key rows", left.profile.keyList?.length ?? 0, right.profile.keyList?.length ?? 0),
    comparisonRow("Key count", countKeys(left), countKeys(right)),
    comparisonRow("User key count", countUserKeys(left.profile), countUserKeys(right.profile)),
    comparisonRow("gameModeInfo", sectionSignature(left.profile.gameModeInfo), sectionSignature(right.profile.gameModeInfo)),
    comparisonRow("ledEffect", sectionSignature(left.profile.ledEffect), sectionSignature(right.profile.ledEffect)),
    comparisonRow("macroDataList count", summarizeArray(left.profile.macroDataList), summarizeArray(right.profile.macroDataList)),
    comparisonRow(
      "magneticAxisRT active count",
      countActiveMagneticAxis(left.profile.magneticAxisRT),
      countActiveMagneticAxis(right.profile.magneticAxisRT),
    ),
    comparisonRow(
      "magneticAxisRTConfig mode",
      getMagneticAxisMode(left.profile.magneticAxisRTConfig),
      getMagneticAxisMode(right.profile.magneticAxisRTConfig),
    ),
  ];
}

export function countActiveMagneticAxis(value: unknown) {
  if (!Array.isArray(value)) {
    return 0;
  }

  return value.filter((item) => {
    if (!isRecord(item)) {
      return false;
    }

    return Boolean(item.isWholeFast || item.isRampageMode || item.triggerKeyStroke || item.pressRT || item.releaseRT);
  }).length;
}

export function getMagneticAxisMode(value: unknown) {
  if (isRecord(value) && typeof value.currentModeName === "string") {
    return value.currentModeName;
  }

  if (Array.isArray(value)) {
    return `${value.length} config records`;
  }

  return "Not available";
}

function createLocalProfileId(now: Date) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `profile-${now.getTime()}-${randomPart}`;
}

function normalizeProfileIds(profiles: SavedLocalProfile[]) {
  const usedIds = new Set<string>();

  return profiles.map((profile) => {
    if (!usedIds.has(profile.id)) {
      usedIds.add(profile.id);
      return profile;
    }

    const nextId = makeUniqueProfileId(profile.id, usedIds);
    usedIds.add(nextId);
    return { ...profile, id: nextId };
  });
}

function hasDuplicateIds(profiles: SavedLocalProfile[]) {
  const ids = new Set<string>();
  return profiles.some((profile) => {
    if (ids.has(profile.id)) {
      return true;
    }
    ids.add(profile.id);
    return false;
  });
}

function makeUniqueProfileId(baseId: string, usedIds: Set<string>) {
  let index = 1;
  let nextId = `${baseId}-restored-${index}`;

  while (usedIds.has(nextId)) {
    index += 1;
    nextId = `${baseId}-restored-${index}`;
  }

  return nextId;
}

function isSavedLocalProfile(value: unknown): value is SavedLocalProfile {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.displayName === "string" &&
    typeof value.originalProfileName === "string" &&
    isRecord(value.profile)
  );
}

function countKeys(profile: SavedLocalProfile) {
  return (profile.profile.keyList ?? []).reduce((count, row) => count + row.length, 0);
}

function comparisonRow(label: string, left: string | number, right: string | number): ComparisonRow {
  return {
    label,
    left,
    right,
    status: left === right ? "same" : "different",
  };
}

function sectionSignature(value: unknown) {
  if (value === undefined || value === null) {
    return "Missing";
  }

  return JSON.stringify(value);
}

function valueOrFallback(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "Not available";
  }

  return String(value);
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
