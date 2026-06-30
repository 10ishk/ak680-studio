import type { AjazzProfile, ImportedProfile, JsonRecord, ValidationResult } from "../types/profile";

export const TARGET_DEVICE_ID = "3141:32956:AJAZZ AK680 V2";
export const TARGET_VID = "3141";
export const TARGET_PID = "32956";
export const TARGET_NAME = "AJAZZ AK680 V2";

const optionalSections = [
  "gameModeInfo",
  "ledEffect",
  "customLedData",
  "macroDataList",
  "magneticAxisRT",
  "magneticAxisRTConfig",
  "magneticAxisDKS",
] as const;

export function parseImportedProfile(text: string, sourceName: string): ImportedProfile {
  let raw: unknown;

  try {
    raw = JSON.parse(text);
  } catch {
    return {
      sourceName,
      raw: null,
      profile: {},
      validation: {
        valid: false,
        errors: ["JSON could not be parsed."],
        warnings: [],
      },
    };
  }

  const profile = normalizeProfile(raw);
  const validation = validateAjazzProfile(profile);

  return {
    sourceName,
    raw,
    profile,
    validation,
  };
}

export function normalizeProfile(raw: unknown): AjazzProfile {
  if (!isRecord(raw)) {
    return {};
  }

  const wrappedProfile = isRecord(raw.profile) ? raw.profile : {};
  const profile: AjazzProfile = {
    ...wrappedProfile,
    deviceId: stringValue(wrappedProfile.deviceId ?? raw.deviceId),
  };

  if (isRecord(profile.deviceInfo)) {
    profile.deviceInfo = {
      ...profile.deviceInfo,
      deviceId: stringValue(profile.deviceInfo.deviceId ?? profile.deviceId),
    };
  }

  return profile;
}

export function validateAjazzProfile(profile: AjazzProfile): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!profile.profileName || typeof profile.profileName !== "string") {
    errors.push("Missing required profileName.");
  }

  if (!isRecord(profile.deviceInfo)) {
    errors.push("Missing required deviceInfo object.");
  }

  if (!Array.isArray(profile.keyList)) {
    errors.push("Missing required keyList array.");
  }

  const identity = getDeviceIdentity(profile);
  const deviceIdMatches = identity.deviceId === TARGET_DEVICE_ID;
  const vidPidMatch = identity.vid === TARGET_VID && identity.pid === TARGET_PID;
  const nameMatches = !identity.deviceId || identity.deviceId.includes(TARGET_NAME);

  if (!(deviceIdMatches || (vidPidMatch && nameMatches))) {
    errors.push("Profile does not match AJAZZ AK680 V2 identity.");
  }

  optionalSections.forEach((section) => {
    if (profile[section] === undefined) {
      warnings.push(`Optional section ${section} is missing.`);
    }
  });

  if (Array.isArray(profile.keyList) && profile.keyList.some((row) => !Array.isArray(row))) {
    errors.push("keyList must contain rows of keys.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function getDeviceIdentity(profile: AjazzProfile) {
  const deviceInfo = isRecord(profile.deviceInfo) ? profile.deviceInfo : {};
  const deviceId = stringValue(profile.deviceId ?? deviceInfo.deviceId);

  return {
    deviceId,
    vid: stringValue(deviceInfo.vid),
    pid: stringValue(deviceInfo.pid),
  };
}

export function countUserKeys(profile?: AjazzProfile) {
  return (profile?.keyList ?? []).flat().filter((key) => Boolean(key.userKey)).length;
}

export function countSocdKeys(profile?: AjazzProfile) {
  return (profile?.keyList ?? []).flat().filter((key) => key.userKey?.page === "SOCD").length;
}

export function summarizeArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}
