import { countUserKeys, getDeviceIdentity, summarizeArray } from "./profileValidation";
import type { ImportedProfile, JsonRecord } from "../types/profile";
import type { ComparisonRow, LocalProfileStore, SavedLocalProfile } from "../types/localProfile";

export const LOCAL_PROFILE_STORAGE_KEY = "ak680-studio.localProfiles.v1";

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
  const profiles = Array.isArray(parsed.profiles) ? parsed.profiles.filter(isSavedLocalProfile) : [];
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
      version: 1,
      activeProfileId: store.activeProfileId,
      profiles: store.profiles,
    },
    null,
    2,
  );
}

export function emptyLocalProfileStore(): LocalProfileStore {
  return {
    version: 1,
    profiles: [],
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
    version: 1,
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

