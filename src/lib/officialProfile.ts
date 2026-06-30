import type { AjazzProfile, JsonRecord, KeyboardKey } from "../types/profile";
import { TARGET_DEVICE_ID, TARGET_NAME, TARGET_PID, TARGET_VID, getDeviceIdentity } from "./profileValidation";

export const OFFICIAL_AK680_PROFILE_SECTIONS = [
  "deviceId",
  "profileName",
  "deviceInfo",
  "keyList",
  "gameModeInfo",
  "ledEffect",
  "customLedData",
  "macroDataList",
  "magneticAxisRT",
  "magneticAxisRTConfig",
  "magneticAxisDKS",
] as const;

export interface OfficialProfileSummary {
  deviceId: string;
  profileName: string;
  vid: string;
  pid: string;
  keyCount: number;
  keyRows: number;
  socdCount: number;
  activeRtCount: number;
  customLedCount: number;
  activeCustomLedCount: number;
  macroCount: number;
  magneticAxisDksCount: number;
  localOnly: true;
}

export interface OfficialSocdAssignment {
  rowIndex: number;
  keyIndex: number;
  value: string;
  name: string;
  key: string;
  userKey: JsonRecord;
}

export interface OfficialActiveRtKey {
  rtIndex: number;
  source: "magneticAxisRT" | "magneticAxisRTConfig";
  mappedBy: "keyList.value" | "unmapped";
  keyValue: string;
  keyName: string;
  key: string;
  axisType: string;
  isWholeFast: boolean;
  isRampageMode: boolean;
  triggerKeyStroke: string;
  pressRT: string;
  releaseRT: string;
}

export interface OfficialLightingSummary {
  mode: string;
  color: string;
  secondaryColor: string;
  brightness: string;
  speed: string;
  direction: string;
  colorMode: string;
  customLedCount: number;
  activeCustomLedCount: number;
}

export interface OfficialGameModeSummary {
  gameMode: string;
  reportRate: string;
  keyDelay: string;
  sleepTime: string;
  stabilityMode: string;
  autoCalibration: string;
}

export interface OfficialProfileInspection {
  summary: OfficialProfileSummary;
  socdAssignments: OfficialSocdAssignment[];
  activeRtKeys: OfficialActiveRtKey[];
  lighting: OfficialLightingSummary;
  gameMode: OfficialGameModeSummary;
  warnings: string[];
}

export function inspectOfficialProfile(profile?: AjazzProfile): OfficialProfileInspection {
  const socdAssignments = getSocdAssignments(profile);
  const activeRtKeys = getActiveRapidTriggerKeys(profile);
  const lighting = getLightingSummary(profile);
  const gameMode = getGameModeSummary(profile);
  return {
    summary: getOfficialProfileSummary(profile, socdAssignments.length, activeRtKeys.length, lighting),
    socdAssignments,
    activeRtKeys,
    lighting,
    gameMode,
    warnings: getOfficialProfileWarnings(profile),
  };
}

export function getOfficialProfileSummary(
  profile?: AjazzProfile,
  socdCount = getSocdAssignments(profile).length,
  activeRtCount = getActiveRapidTriggerKeys(profile).length,
  lighting = getLightingSummary(profile),
): OfficialProfileSummary {
  const identity = profile ? getDeviceIdentity(profile) : undefined;
  const keys = flattenKeyList(profile);
  return {
    deviceId: identity?.deviceId || "Not available",
    profileName: profile?.profileName || "Not available",
    vid: identity?.vid || "Not available",
    pid: identity?.pid || "Not available",
    keyCount: keys.length,
    keyRows: profile?.keyList?.length ?? 0,
    socdCount,
    activeRtCount,
    customLedCount: lighting.customLedCount,
    activeCustomLedCount: lighting.activeCustomLedCount,
    macroCount: Array.isArray(profile?.macroDataList) ? profile.macroDataList.length : 0,
    magneticAxisDksCount: Array.isArray(profile?.magneticAxisDKS) ? profile.magneticAxisDKS.length : 0,
    localOnly: true,
  };
}

export function getSocdAssignments(profile?: AjazzProfile): OfficialSocdAssignment[] {
  return (profile?.keyList ?? []).flatMap((row, rowIndex) =>
    row.flatMap((key, keyIndex) => {
      if (key.userKey?.page !== "SOCD") {
        return [];
      }
      return [
        {
          rowIndex,
          keyIndex,
          value: formatValue(key.value),
          name: key.name ?? "Unknown",
          key: key.key ?? "Unknown",
          userKey: key.userKey,
        },
      ];
    }),
  );
}

export function getActiveRapidTriggerKeys(profile?: AjazzProfile): OfficialActiveRtKey[] {
  const keyByValue = new Map(flattenKeyList(profile).map((key) => [formatValue(key.value), key]));
  return [
    ...getActiveRtFromSection(profile?.magneticAxisRT, "magneticAxisRT", keyByValue),
    ...getActiveRtFromSection(profile?.magneticAxisRTConfig, "magneticAxisRTConfig", keyByValue),
  ];
}

export function getLightingSummary(profile?: AjazzProfile): OfficialLightingSummary {
  const effect = isRecord(profile?.ledEffect) ? profile.ledEffect : {};
  const customLedData = Array.isArray(profile?.customLedData) ? profile.customLedData : [];
  const activeCustomLedCount = customLedData.filter((entry) => hasNonZeroRgb(entry)).length;
  return {
    mode: formatValue(effect.mode),
    color: rgb(effect.red, effect.green, effect.blue),
    secondaryColor: rgb(effect.secondaryRed, effect.secondaryGreen, effect.secondaryBlue),
    brightness: formatValue(effect.brightness),
    speed: formatValue(effect.speed),
    direction: formatValue(effect.direction),
    colorMode: formatValue(effect.colorMode),
    customLedCount: customLedData.length,
    activeCustomLedCount,
  };
}

export function getGameModeSummary(profile?: AjazzProfile): OfficialGameModeSummary {
  const gameMode = isRecord(profile?.gameModeInfo) ? profile.gameModeInfo : {};
  return {
    gameMode: formatValue(gameMode.gameMode),
    reportRate: formatValue(gameMode.reportRate),
    keyDelay: formatValue(gameMode.keyDelay),
    sleepTime: formatValue(gameMode.sleepTime),
    stabilityMode: formatValue(gameMode.stabilityMode),
    autoCalibration: formatValue(gameMode.autoCalibration),
  };
}

export function getOfficialProfileWarnings(profile?: AjazzProfile): string[] {
  if (!profile) {
    return ["No valid official profile is imported."];
  }
  const warnings: string[] = [];
  const identity = getDeviceIdentity(profile);
  if (identity.deviceId !== TARGET_DEVICE_ID || identity.vid !== TARGET_VID || identity.pid !== TARGET_PID) {
    warnings.push(`Profile identity should match ${TARGET_DEVICE_ID}.`);
  }
  if (!identity.deviceId.includes(TARGET_NAME)) {
    warnings.push("Profile device ID does not include the AK680 V2 target name.");
  }
  OFFICIAL_AK680_PROFILE_SECTIONS.forEach((section) => {
    if (profile[section] === undefined && section !== "deviceId") {
      warnings.push(`Official profile section ${section} is missing.`);
    }
  });
  if (!Array.isArray(profile.keyList)) {
    warnings.push("Official profile keyList is missing or not an array.");
  }
  if (!Array.isArray(profile.customLedData)) {
    warnings.push("Official profile customLedData is missing or not an array.");
  }
  const unknownFields = Object.keys(profile).filter(
    (key) => !(OFFICIAL_AK680_PROFILE_SECTIONS as readonly string[]).includes(key) && key !== "protocol",
  );
  if (unknownFields.length > 0) {
    warnings.push(`Unknown official profile fields preserved locally: ${unknownFields.join(", ")}.`);
  }
  return warnings;
}

function getActiveRtFromSection(
  section: unknown,
  source: "magneticAxisRT" | "magneticAxisRTConfig",
  keyByValue: Map<string, KeyboardKey>,
): OfficialActiveRtKey[] {
  if (!Array.isArray(section)) {
    return [];
  }
  return section.flatMap((entry, rtIndex) => {
    if (!isRecord(entry) || !isActiveRtRecord(entry)) {
      return [];
    }
    const mappedKey = keyByValue.get(String(rtIndex));
    return [
      {
        rtIndex,
        source,
        mappedBy: mappedKey ? "keyList.value" : "unmapped",
        keyValue: mappedKey ? formatValue(mappedKey.value) : String(rtIndex),
        keyName: mappedKey?.name ?? "Unmapped",
        key: mappedKey?.key ?? "Unknown",
        axisType: formatValue(entry.axisType),
        isWholeFast: entry.isWholeFast === true,
        isRampageMode: entry.isRampageMode === true,
        triggerKeyStroke: formatValue(entry.triggerKeyStroke),
        pressRT: formatValue(entry.pressRT),
        releaseRT: formatValue(entry.releaseRT),
      },
    ];
  });
}

function isActiveRtRecord(entry: JsonRecord) {
  return (
    Number(entry.axisType ?? 0) !== 0 ||
    entry.isWholeFast === true ||
    entry.isRampageMode === true ||
    Number(entry.triggerKeyStroke ?? 0) !== 0 ||
    Number(entry.pressRT ?? 0) !== 0 ||
    Number(entry.releaseRT ?? 0) !== 0
  );
}

function flattenKeyList(profile?: AjazzProfile): KeyboardKey[] {
  return (profile?.keyList ?? []).flat();
}

function hasNonZeroRgb(entry: unknown) {
  if (!isRecord(entry)) {
    return false;
  }
  return Number(entry.red ?? 0) !== 0 || Number(entry.green ?? 0) !== 0 || Number(entry.blue ?? 0) !== 0;
}

function rgb(red: unknown, green: unknown, blue: unknown) {
  return `R ${formatValue(red)} / G ${formatValue(green)} / B ${formatValue(blue)}`;
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "Not available";
  }
  return String(value);
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
