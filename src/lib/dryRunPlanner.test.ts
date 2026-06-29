import { describe, expect, it } from "vitest";
import { createDryRunExport, createDryRunPlan, summarizeOperations } from "./dryRunPlanner";
import { createEditorSessionFromImported, setFirstMagneticAxisValue, setKeyUserAssignment, setLightingValue } from "./localEditor";
import type { HidDetectionState } from "../types/hid";
import type { LocalProfileStorageState } from "../types/localProfile";
import type { ImportedProfile } from "../types/profile";

const importedProfile: ImportedProfile = {
  sourceName: "sample.json",
  raw: { profile: { profileName: "Original" } },
  validation: { valid: true, errors: [], warnings: [] },
  profile: {
    deviceId: "3141:32956:AJAZZ AK680 V2",
    profileName: "Original",
    deviceInfo: { vid: 3141, pid: 32956 },
    keyList: [[{ name: "A" }, { name: "S", userKey: { name: "SOCD" } }]],
    gameModeInfo: { reportRate: 8, keyDelay: 1, sleepTime: 10 },
    ledEffect: { mode: 1, brightness: 80, speed: 5, red: 10, green: 20, blue: 30 },
    macroDataList: [{ name: "macro" }],
    magneticAxisRT: [{ pressRT: 0.2, releaseRT: 0.4, triggerKeyStroke: 1 }],
  },
};

const hidDetection: HidDetectionState = {
  status: "detected",
  result: {
    targetVendorId: 3141,
    targetProductId: 32956,
    targetDetected: true,
    devices: [
      {
        vendorId: 3141,
        productId: 32956,
        matchedTarget: true,
        path: "interface-1",
      },
    ],
  },
};

const localProfileStorage: LocalProfileStorageState = {
  schemaVersion: 1,
  profiles: [],
  storageType: "Browser localStorage",
  storageHealth: "healthy",
  lastBackupMessage: "Exported full local profile library backup with 1 profile(s).",
};

const now = new Date("2026-06-30T00:00:00.000Z");

function makePlan(session = createEditorSessionFromImported(importedProfile)!) {
  return createDryRunPlan({
    editorSession: session,
    editorValidation: { valid: true, errors: [], warnings: [] },
    hidDetection,
    localProfileStorage,
    appVersion: "0.1.0",
    protocolAssumptions: ["Future writes require a separate work package."],
    now,
  });
}

describe("dry-run planner helpers", () => {
  it("returns a safe no-input state", () => {
    const plan = createDryRunPlan({
      editorValidation: { valid: false, errors: ["No active local edit session."], warnings: [] },
      hidDetection: { status: "idle" },
      localProfileStorage,
      appVersion: "0.1.0",
      protocolAssumptions: [],
      now,
    });

    expect(plan.status).toBe("no-input");
    expect(plan.operations).toEqual([]);
    expect(plan.execution.blocked).toBe(true);
  });

  it("blocks invalid edited profile state", () => {
    const session = createEditorSessionFromImported(importedProfile)!;
    const plan = createDryRunPlan({
      editorSession: session,
      editorValidation: { valid: false, errors: ["Invalid edit"], warnings: [] },
      hidDetection,
      localProfileStorage,
      appVersion: "0.1.0",
      protocolAssumptions: [],
      now,
    });

    expect(plan.status).toBe("invalid");
    expect(plan.checklist.find((item) => item.label === "Edited profile validation")?.status).toBe("blocked");
  });

  it("marks unchanged valid sessions as no-change", () => {
    const plan = makePlan();

    expect(plan.status).toBe("no-changes");
    expect(summarizeOperations(plan.operations)).toBe("No local profile changes detected.");
  });

  it("creates abstract operation summaries for local edits", () => {
    const session = setLightingValue(
      setFirstMagneticAxisValue(setKeyUserAssignment(createEditorSessionFromImported(importedProfile)!, 0, 0, "Space"), "pressRT", 0.5),
      "brightness",
      90,
    );
    const plan = makePlan(session);

    expect(plan.status).toBe("ready");
    expect(plan.operations.find((operation) => operation.category === "keymap")?.summary).toBe(
      "Would update 1 key assignment(s).",
    );
    expect(plan.operations.find((operation) => operation.category === "rt-actuation")?.summary).toBe(
      "Would update 1 RT/actuation value(s).",
    );
    expect(plan.operations.find((operation) => operation.category === "lighting")?.summary).toBe(
      "Would update 1 lighting value(s).",
    );
    expect(plan.operations.find((operation) => operation.category === "macros")?.summary).toBe(
      "Would preserve macroDataList exactly.",
    );
  });

  it("builds compatibility and safety checklist from metadata only", () => {
    const plan = makePlan();

    expect(plan.checklist.find((item) => item.label === "AK680 V2 VID/PID match")?.status).toBe("pass");
    expect(plan.checklist.find((item) => item.label === "Likely HID interface")?.status).toBe("pass");
    expect(plan.checklist.find((item) => item.label === "Hardware write support")?.status).toBe("blocked");
  });

  it("exports required dry-run fields without real packet or payload fields", () => {
    const plan = makePlan(setKeyUserAssignment(createEditorSessionFromImported(importedProfile)!, 0, 0, "Space"));
    const exported = createDryRunExport(plan);
    const exportedJson = JSON.stringify(exported);

    expect(exported).toMatchObject({
      generatedAt: "2026-06-30T00:00:00.000Z",
      validation: { valid: true },
      noPacketsSentStatement: "No packets sent. This export contains abstract dry-run planning only.",
    });
    expect(exportedJson).not.toContain('"packet"');
    expect(exportedJson).not.toContain('"payload"');
  });

  it("does not mutate editor session data", () => {
    const session = createEditorSessionFromImported(importedProfile)!;
    const before = JSON.stringify(session);

    createDryRunPlan({
      editorSession: session,
      editorValidation: { valid: true, errors: [], warnings: [] },
      hidDetection,
      localProfileStorage,
      appVersion: "0.1.0",
      protocolAssumptions: [],
      now,
    });

    expect(JSON.stringify(session)).toBe(before);
  });
});
