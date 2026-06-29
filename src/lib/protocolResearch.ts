import { TARGET_DEVICE_ID, TARGET_PID, TARGET_VID, countSocdKeys, countUserKeys, getDeviceIdentity } from "./profileValidation";
import type { HidDetectionResult, HidDeviceMetadata } from "../types/hid";
import type { LocalProfileStorageState, SavedLocalProfile } from "../types/localProfile";
import type { ImportedProfile } from "../types/profile";

export const PROTOCOL_ASSUMPTIONS = [
  "Target VID/PID is 3141/32956.",
  "USB/wired mode is likely required for useful HID enumeration.",
  "Bluetooth configuration is not supported.",
  "The AK680 V2 protocol is treated as proprietary HID, not QMK/VIA.",
  "Future writes require a separate work package and Red Team plan.",
  "GPL-3.0 protocol repositories may be studied for behavior only; do not copy code.",
];

export const PROTOCOL_SAFETY_STATUS = [
  "Research Mode is read-only and experimental.",
  "No keyboard settings are changed.",
  "No keyboard configuration writes are implemented.",
  "No unknown HID command packets are sent.",
  "Only existing HID enumeration metadata is displayed or exported.",
];

export interface ProtocolMetadataSummary {
  vendorId: number;
  productId: number;
  path: string;
  manufacturer: string;
  product: string;
  serialNumber: string;
  usagePage: string;
  usage: string;
  interfaceNumber: string;
  releaseNumber: string;
  matchedTarget: boolean;
  likelyResearchInterface: boolean;
}

export interface ProtocolDiagnosticsSnapshot {
  snapshotType: "ak680-protocol-research";
  timestamp: string;
  appVersion: string;
  appCommit: string;
  target: {
    deviceId: string;
    vendorId: number;
    productId: number;
  };
  hidDetectionStatus: string;
  matchingInterfaceCount: number;
  matchingInterfaces: ProtocolMetadataSummary[];
  importedProfile?: {
    sourceName: string;
    profileName: string;
    deviceId: string;
    userKeyCount: number;
    socdKeyCount: number;
  };
  activeLocalProfile?: {
    id: string;
    displayName: string;
    originalProfileName: string;
    deviceId: string;
    sourceFilename: string;
    updatedAt: string;
  };
  assumptions: string[];
  safetyStatus: string[];
}

export function getMatchingResearchInterfaces(result?: HidDetectionResult): HidDeviceMetadata[] {
  return result?.devices.filter((device) => device.matchedTarget) ?? [];
}

export function inferLikelyResearchInterface(devices: HidDeviceMetadata[]): HidDeviceMetadata | undefined {
  const matchingDevices = devices.filter((device) => device.matchedTarget);
  return matchingDevices.length === 1 ? matchingDevices[0] : undefined;
}

export function formatOptionalMetadata(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return String(value);
}

export function summarizeProtocolDevice(
  device: HidDeviceMetadata,
  likelyResearchInterface?: HidDeviceMetadata,
): ProtocolMetadataSummary {
  return {
    vendorId: device.vendorId,
    productId: device.productId,
    path: formatOptionalMetadata(device.path),
    manufacturer: formatOptionalMetadata(device.manufacturer),
    product: formatOptionalMetadata(device.product),
    serialNumber: formatOptionalMetadata(device.serialNumber),
    usagePage: formatOptionalMetadata(device.usagePage),
    usage: formatOptionalMetadata(device.usage),
    interfaceNumber: formatOptionalMetadata(device.interfaceNumber),
    releaseNumber: formatOptionalMetadata(device.releaseNumber),
    matchedTarget: device.matchedTarget,
    likelyResearchInterface: Boolean(likelyResearchInterface && likelyResearchInterface === device),
  };
}

export function createProtocolDiagnosticsSnapshot({
  hidDetection,
  importedProfile,
  localProfileStorage,
  appVersion,
  appCommit = "Not available",
  now = new Date(),
}: {
  hidDetection?: HidDetectionResult;
  importedProfile: ImportedProfile;
  localProfileStorage: LocalProfileStorageState;
  appVersion: string;
  appCommit?: string;
  now?: Date;
}): ProtocolDiagnosticsSnapshot {
  const matchingInterfaces = getMatchingResearchInterfaces(hidDetection);
  const likelyResearchInterface = inferLikelyResearchInterface(matchingInterfaces);
  const importedProfileSummary = importedProfile.validation.valid
    ? summarizeImportedProfile(importedProfile)
    : undefined;
  const activeLocalProfile = localProfileStorage.profiles.find(
    (profile) => profile.id === localProfileStorage.activeProfileId,
  );

  return {
    snapshotType: "ak680-protocol-research",
    timestamp: now.toISOString(),
    appVersion,
    appCommit,
    target: {
      deviceId: TARGET_DEVICE_ID,
      vendorId: Number(TARGET_VID),
      productId: Number(TARGET_PID),
    },
    hidDetectionStatus: hidDetection
      ? hidDetection.targetDetected
        ? "AK680 V2 metadata detected"
        : "No matching AK680 V2 interfaces found"
      : "No HID detection run",
    matchingInterfaceCount: matchingInterfaces.length,
    matchingInterfaces: matchingInterfaces.map((device) => summarizeProtocolDevice(device, likelyResearchInterface)),
    importedProfile: importedProfileSummary,
    activeLocalProfile: activeLocalProfile ? summarizeActiveLocalProfile(activeLocalProfile) : undefined,
    assumptions: [...PROTOCOL_ASSUMPTIONS],
    safetyStatus: [...PROTOCOL_SAFETY_STATUS],
  };
}

function summarizeImportedProfile(importedProfile: ImportedProfile) {
  const profile = importedProfile.profile;
  const identity = getDeviceIdentity(profile);

  return {
    sourceName: importedProfile.sourceName,
    profileName: profile.profileName ?? "Unknown",
    deviceId: identity.deviceId,
    userKeyCount: countUserKeys(profile),
    socdKeyCount: countSocdKeys(profile),
  };
}

function summarizeActiveLocalProfile(profile: SavedLocalProfile) {
  return {
    id: profile.id,
    displayName: profile.displayName,
    originalProfileName: profile.originalProfileName,
    deviceId: profile.deviceId,
    sourceFilename: profile.sourceFilename ?? "Not available",
    updatedAt: profile.updatedAt,
  };
}
