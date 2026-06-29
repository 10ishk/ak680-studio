import { TARGET_DEVICE_ID, getDeviceIdentity } from "./profileValidation";
import type { HidDetectionState } from "../types/hid";
import type { LocalProfileStorageState } from "../types/localProfile";
import type { AjazzProfile, KeyboardKey } from "../types/profile";
import type { EditorValidation, LocalEditorSession } from "./localEditor";

export type DryRunStatus = "no-input" | "invalid" | "ready" | "no-changes";
export type ChecklistStatus = "pass" | "warn" | "blocked" | "info";
export type OperationCategory = "keymap" | "rt-actuation" | "socd-game-mode" | "lighting" | "macros";

export interface DryRunProfileSummary {
  profileName: string;
  deviceId: string;
  keyCount: number;
  userKeyCount: number;
  rtRecords: number;
  macroRecords: number;
}

export interface DryRunOperation {
  category: OperationCategory;
  label: string;
  changed: boolean;
  changeCount: number;
  summary: string;
}

export interface DryRunChecklistItem {
  label: string;
  status: ChecklistStatus;
  detail: string;
}

export interface DryRunPlan {
  generatedAt: string;
  appVersion: string;
  status: DryRunStatus;
  sourceLabel: string;
  sourceType: string;
  originalProfile?: DryRunProfileSummary;
  editedProfile?: DryRunProfileSummary;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  operations: DryRunOperation[];
  checklist: DryRunChecklistItem[];
  protocolAssumptions: string[];
  safetyStatements: string[];
  execution: {
    blocked: true;
    status: "Not implemented";
    detail: string;
  };
}

export interface CreateDryRunPlanInput {
  editorSession?: LocalEditorSession;
  editorValidation: EditorValidation;
  hidDetection: HidDetectionState;
  localProfileStorage: LocalProfileStorageState;
  appVersion: string;
  protocolAssumptions: string[];
  now?: Date;
}

export function createDryRunPlan(input: CreateDryRunPlanInput): DryRunPlan {
  const generatedAt = (input.now ?? new Date()).toISOString();
  const operations = input.editorSession ? createOperations(input.editorSession) : [];
  const changed = operations.some((operation) => operation.changed);
  const status = getPlanStatus(Boolean(input.editorSession), input.editorValidation.valid, changed);

  return {
    generatedAt,
    appVersion: input.appVersion,
    status,
    sourceLabel: input.editorSession?.source.label ?? "No active local edit session",
    sourceType: input.editorSession?.source.kind ?? "none",
    originalProfile: input.editorSession ? summarizeProfile(input.editorSession.originalProfile) : undefined,
    editedProfile: input.editorSession ? summarizeProfile(input.editorSession.workingProfile) : undefined,
    validation: {
      valid: input.editorValidation.valid,
      errors: [...input.editorValidation.errors],
      warnings: [...input.editorValidation.warnings],
    },
    operations,
    checklist: createChecklist(input, status),
    protocolAssumptions: [...input.protocolAssumptions],
    safetyStatements: [
      "Dry run only.",
      "No packets sent.",
      "Keyboard hardware is not changed.",
      "Hardware write support requires a future work package and Red Team plan.",
    ],
    execution: {
      blocked: true,
      status: "Not implemented",
      detail: "Apply, write, sync, and save-to-device execution is blocked in WP8.",
    },
  };
}

export function createDryRunExport(plan: DryRunPlan) {
  return {
    generatedAt: plan.generatedAt,
    appVersion: plan.appVersion,
    status: plan.status,
    sourceLabel: plan.sourceLabel,
    sourceType: plan.sourceType,
    originalProfile: plan.originalProfile,
    editedProfile: plan.editedProfile,
    validation: plan.validation,
    operations: plan.operations,
    safetyChecklist: plan.checklist,
    protocolAssumptions: plan.protocolAssumptions,
    noPacketsSentStatement: "No packets sent. This export contains abstract dry-run planning only.",
    execution: plan.execution,
  };
}

export function summarizeOperations(operations: DryRunOperation[]) {
  if (operations.length === 0) {
    return "No dry-run operations are available.";
  }

  const changed = operations.filter((operation) => operation.changed);
  if (changed.length === 0) {
    return "No local profile changes detected.";
  }

  return `${changed.length} operation categor${changed.length === 1 ? "y" : "ies"} would change locally edited data.`;
}

function getPlanStatus(hasSession: boolean, valid: boolean, changed: boolean): DryRunStatus {
  if (!hasSession) {
    return "no-input";
  }

  if (!valid) {
    return "invalid";
  }

  return changed ? "ready" : "no-changes";
}

function createOperations(session: LocalEditorSession): DryRunOperation[] {
  const keymapChanges = countChangedKeys(session.originalProfile.keyList, session.workingProfile.keyList);
  const rtChanges = countChangedValues(session.originalProfile.magneticAxisRT, session.workingProfile.magneticAxisRT);
  const gameModeChanges = countChangedValues(session.originalProfile.gameModeInfo, session.workingProfile.gameModeInfo);
  const lightingChanges = countChangedValues(session.originalProfile.ledEffect, session.workingProfile.ledEffect);
  const macroChanged = stableStringify(session.originalProfile.macroDataList ?? []) !== stableStringify(session.workingProfile.macroDataList ?? []);

  return [
    {
      category: "keymap",
      label: "Keymap",
      changed: keymapChanges > 0,
      changeCount: keymapChanges,
      summary: keymapChanges > 0 ? `Would update ${keymapChanges} key assignment(s).` : "No key assignment changes detected.",
    },
    {
      category: "rt-actuation",
      label: "RT / actuation",
      changed: rtChanges > 0,
      changeCount: rtChanges,
      summary: rtChanges > 0 ? `Would update ${rtChanges} RT/actuation value(s).` : "No RT/actuation changes detected.",
    },
    {
      category: "socd-game-mode",
      label: "SOCD / game mode",
      changed: gameModeChanges > 0,
      changeCount: gameModeChanges,
      summary:
        gameModeChanges > 0
          ? `Would update ${gameModeChanges} SOCD/game-mode value(s).`
          : "No SOCD/game-mode changes detected.",
    },
    {
      category: "lighting",
      label: "Lighting",
      changed: lightingChanges > 0,
      changeCount: lightingChanges,
      summary: lightingChanges > 0 ? `Would update ${lightingChanges} lighting value(s).` : "No lighting changes detected.",
    },
    {
      category: "macros",
      label: "Macros",
      changed: macroChanged,
      changeCount: macroChanged ? 1 : 0,
      summary: macroChanged ? "Macro data changed and would remain blocked." : "Would preserve macroDataList exactly.",
    },
  ];
}

function createChecklist(input: CreateDryRunPlanInput, status: DryRunStatus): DryRunChecklistItem[] {
  const matchingInterfaces = input.hidDetection.result?.devices.filter((device) => device.matchedTarget) ?? [];
  const likelyInterface = matchingInterfaces.length === 1 ? matchingInterfaces[0] : undefined;
  const profileIdentity = input.editorSession ? getDeviceIdentity(input.editorSession.workingProfile) : undefined;

  return [
    {
      label: "AK680 V2 VID/PID match",
      status: input.hidDetection.result?.targetDetected ? "pass" : "warn",
      detail: input.hidDetection.result?.targetDetected
        ? "At least one read-only HID metadata entry matches VID 3141 and PID 32956."
        : "No matching AK680 V2 HID metadata is available from the latest detection run.",
    },
    {
      label: "Likely HID interface",
      status: likelyInterface ? "pass" : "info",
      detail: likelyInterface
        ? `Safely inferred from one matching interface; path ${likelyInterface.path || "not available"}.`
        : "Not inferred; no probing is used when zero or multiple matching interfaces are available.",
    },
    {
      label: "Profile identity",
      status: profileIdentity?.deviceId === TARGET_DEVICE_ID ? "pass" : "blocked",
      detail: profileIdentity?.deviceId
        ? `Edited profile identity is ${profileIdentity.deviceId}.`
        : "No valid edited profile identity is available.",
    },
    {
      label: "Edited profile validation",
      status: input.editorValidation.valid ? "pass" : "blocked",
      detail: input.editorValidation.valid
        ? "Edited local profile validates for dry-run planning."
        : input.editorValidation.errors.join(" ") || "Edited profile is not valid.",
    },
    {
      label: "Backup-before-write future gate",
      status: input.localProfileStorage.lastBackupMessage ? "info" : "warn",
      detail: input.localProfileStorage.lastBackupMessage
        ? `Latest local backup/export status: ${input.localProfileStorage.lastBackupMessage}`
        : "Future hardware writes would require a current local backup; backup does not unlock writing in WP8.",
    },
    {
      label: "Hardware write support",
      status: "blocked",
      detail: "Not implemented. Dry-run planning cannot apply, write, sync, or save to device.",
    },
    {
      label: "No packets sent",
      status: "pass",
      detail: `Planner status is ${status}; dry-run planning uses local profile data only.`,
    },
  ];
}

function summarizeProfile(profile: AjazzProfile): DryRunProfileSummary {
  return {
    profileName: profile.profileName ?? "Unnamed profile",
    deviceId: getDeviceIdentity(profile)?.deviceId ?? "Unknown",
    keyCount: profile.keyList?.flat().length ?? 0,
    userKeyCount: countUserKeys(profile.keyList),
    rtRecords: Array.isArray(profile.magneticAxisRT) ? profile.magneticAxisRT.length : 0,
    macroRecords: Array.isArray(profile.macroDataList) ? profile.macroDataList.length : 0,
  };
}

function countUserKeys(keyList?: KeyboardKey[][]) {
  return keyList?.flat().filter((key) => Boolean(key.userKey)).length ?? 0;
}

function countChangedKeys(left?: KeyboardKey[][], right?: KeyboardKey[][]) {
  const leftKeys = left?.flat() ?? [];
  const rightKeys = right?.flat() ?? [];
  const maxLength = Math.max(leftKeys.length, rightKeys.length);
  let count = 0;

  for (let index = 0; index < maxLength; index += 1) {
    if (stableStringify(leftKeys[index] ?? null) !== stableStringify(rightKeys[index] ?? null)) {
      count += 1;
    }
  }

  return count;
}

function countChangedValues(left: unknown, right: unknown) {
  if (stableStringify(left ?? null) === stableStringify(right ?? null)) {
    return 0;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLength = Math.max(left.length, right.length);
    let count = 0;
    for (let index = 0; index < maxLength; index += 1) {
      count += countChangedValues(left[index], right[index]);
    }
    return count;
  }

  if (isRecord(left) && isRecord(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    let count = 0;
    keys.forEach((key) => {
      if (stableStringify(left[key] ?? null) !== stableStringify(right[key] ?? null)) {
        count += 1;
      }
    });
    return count;
  }

  return 1;
}

function stableStringify(value: unknown) {
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
