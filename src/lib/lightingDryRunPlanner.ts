import type { AjazzProfile, LedEffect } from "../types/profile";
import { TARGET_NAME, TARGET_PID, TARGET_VID } from "./profileValidation";

export const LIGHTING_DRY_RUN_REPORT_ID = 0;
export const LIGHTING_DRY_RUN_PACKET_LENGTH = 64;
export const LIGHTING_DRY_RUN_PREVIEW_FORMAT = "sanitized-global-static-lighting-preview-v1";

export const LIGHTING_DRY_RUN_TARGET_METADATA = {
  device: TARGET_NAME,
  vendorId: Number(TARGET_VID),
  productId: Number(TARGET_PID),
  usagePage: 65384,
  usage: 97,
  reportId: LIGHTING_DRY_RUN_REPORT_ID,
  reportLength: LIGHTING_DRY_RUN_PACKET_LENGTH,
} as const;

export const WP21_LIGHTING_SAFETY_CHECKLIST = [
  "Confirm AK680 V2 only with VID 3141 and PID 32956.",
  "Confirm selected HID interface uses usagePage 65384 and usage 97 where metadata is available.",
  "Confirm report ID 0 and 64-byte report length before any future execution work.",
  "Review exact future bytes against independent evidence, not this dry-run preview alone.",
  "Back up the current lighting/profile state before any future write package.",
  "Document rollback or recovery steps before any future write package.",
  "Physically verify the keyboard state after any future Red-Team-approved write.",
  "Require explicit manual confirmation in the future write package.",
  "Run one-shot only with no retry, polling, or automatic execution.",
  "Require a separate future work package and Red Team plan before real writing.",
] as const;

export interface LightingDryRunSource {
  profileName: string;
  hasLedEffect: boolean;
  ledEffect: Partial<LedEffect>;
}

export interface LightingDryRunPacketPreview {
  format: typeof LIGHTING_DRY_RUN_PREVIEW_FORMAT;
  reportId: typeof LIGHTING_DRY_RUN_REPORT_ID;
  reportLength: typeof LIGHTING_DRY_RUN_PACKET_LENGTH;
  bytes: number[];
  hex: string;
  rgbByteIndexes: {
    red: number;
    green: number;
    blue: number;
  };
  unknownOrReservedByteRanges: string[];
}

export interface LightingDryRunExecutionState {
  enabled: false;
  status: "disabled";
  hidAccessDuringPlanning: false;
  commandExecutionEnabled: false;
  writeSupport: false;
  reason: string;
}

export interface LightingDryRunChecklistItem {
  item: string;
  state: "future-manual-check";
}

export interface LightingDryRunPlan {
  package: "WP20";
  title: "First Lighting Write Candidate Dry-Run Planner";
  dryRunOnly: true;
  source: LightingDryRunSource;
  targetMetadata: typeof LIGHTING_DRY_RUN_TARGET_METADATA;
  reportMetadata: {
    reportId: typeof LIGHTING_DRY_RUN_REPORT_ID;
    reportLength: typeof LIGHTING_DRY_RUN_PACKET_LENGTH;
    oneShotFutureRequirement: true;
    retriesAllowed: false;
    pollingAllowed: false;
    automaticExecutionAllowed: false;
  };
  packetPreview: LightingDryRunPacketPreview;
  warnings: string[];
  executionState: LightingDryRunExecutionState;
  futureWp21Checklist: LightingDryRunChecklistItem[];
}

export interface LightingDryRunExport {
  exportedAt: string;
  exportType: "ak680-lighting-write-candidate-dry-run";
  localOnly: true;
  noHidAccess: true;
  plan: LightingDryRunPlan;
}

export function createLightingDryRunPlan(profile?: AjazzProfile): LightingDryRunPlan {
  const source = createLightingSource(profile);
  const warnings = createLightingWarnings(source);
  const bytes = createPreviewBytes(source.ledEffect, warnings);

  return {
    package: "WP20",
    title: "First Lighting Write Candidate Dry-Run Planner",
    dryRunOnly: true,
    source,
    targetMetadata: LIGHTING_DRY_RUN_TARGET_METADATA,
    reportMetadata: {
      reportId: LIGHTING_DRY_RUN_REPORT_ID,
      reportLength: LIGHTING_DRY_RUN_PACKET_LENGTH,
      oneShotFutureRequirement: true,
      retriesAllowed: false,
      pollingAllowed: false,
      automaticExecutionAllowed: false,
    },
    packetPreview: {
      format: LIGHTING_DRY_RUN_PREVIEW_FORMAT,
      reportId: LIGHTING_DRY_RUN_REPORT_ID,
      reportLength: LIGHTING_DRY_RUN_PACKET_LENGTH,
      bytes,
      hex: formatHex(bytes),
      rgbByteIndexes: {
        red: 3,
        green: 4,
        blue: 5,
      },
      unknownOrReservedByteRanges: ["10..63 are reserved/unknown and zero-filled for this non-executable preview."],
    },
    warnings,
    executionState: {
      enabled: false,
      status: "disabled",
      hidAccessDuringPlanning: false,
      commandExecutionEnabled: false,
      writeSupport: false,
      reason:
        "WP20 creates a local dry-run preview only. Real lighting writes require a separate work package and Red Team plan.",
    },
    futureWp21Checklist: WP21_LIGHTING_SAFETY_CHECKLIST.map((item) => ({ item, state: "future-manual-check" })),
  };
}

export function createLightingDryRunExport(profile?: AjazzProfile, exportedAt = new Date().toISOString()): LightingDryRunExport {
  return {
    exportedAt,
    exportType: "ak680-lighting-write-candidate-dry-run",
    localOnly: true,
    noHidAccess: true,
    plan: createLightingDryRunPlan(profile),
  };
}

function createLightingSource(profile?: AjazzProfile): LightingDryRunSource {
  const ledEffect = profile?.ledEffect && typeof profile.ledEffect === "object" ? profile.ledEffect : {};
  return {
    profileName: profile?.profileName || "No valid imported profile",
    hasLedEffect: Boolean(profile?.ledEffect && typeof profile.ledEffect === "object"),
    ledEffect: {
      mode: ledEffect.mode,
      red: ledEffect.red,
      green: ledEffect.green,
      blue: ledEffect.blue,
      brightness: ledEffect.brightness,
      speed: ledEffect.speed,
      direction: ledEffect.direction,
      colorMode: ledEffect.colorMode,
    },
  };
}

function createPreviewBytes(ledEffect: Partial<LedEffect>, warnings: string[]) {
  const bytes = new Array<number>(LIGHTING_DRY_RUN_PACKET_LENGTH).fill(0);
  bytes[0] = 0xa0;
  bytes[1] = 0x20;
  bytes[2] = numberByte(ledEffect.mode, "mode", warnings);
  bytes[3] = numberByte(ledEffect.red, "red", warnings);
  bytes[4] = numberByte(ledEffect.green, "green", warnings);
  bytes[5] = numberByte(ledEffect.blue, "blue", warnings);
  bytes[6] = numberByte(ledEffect.brightness, "brightness", warnings);
  bytes[7] = numberByte(ledEffect.speed, "speed", warnings);
  bytes[8] = numberByte(ledEffect.direction, "direction", warnings);
  bytes[9] = numberByte(ledEffect.colorMode, "colorMode", warnings);
  return bytes;
}

function createLightingWarnings(source: LightingDryRunSource) {
  const warnings = [
    "Packet bytes are a sanitized local preview, not an approved executable HID command.",
    "WP20 does not infer firmware, settings, calibration, layout, memory, profile state, or write capability.",
  ];

  if (!source.hasLedEffect) {
    warnings.push("Imported profile has no ledEffect object; missing lighting fields default to zero in the preview.");
  }

  return warnings;
}

function numberByte(value: unknown, field: string, warnings: string[]) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    warnings.push(`Lighting field ${field} is missing or not numeric; preview byte defaults to 0.`);
    return 0;
  }

  const rounded = Math.round(value);
  const clamped = Math.min(255, Math.max(0, rounded));
  if (clamped !== rounded) {
    warnings.push(`Lighting field ${field} value ${value} is outside 0..255; preview byte is clamped to ${clamped}.`);
  }
  return clamped;
}

function formatHex(bytes: number[]) {
  return bytes.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}
