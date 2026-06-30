import { describe, expect, it } from "vitest";
import sampleProfile from "../../fixtures/ak680-profile.sample.json";
import { APPROVED_READ_ONLY_COMMANDS } from "./readOnlySettingsFoundation";
import {
  LIGHTING_DRY_RUN_PACKET_LENGTH,
  LIGHTING_DRY_RUN_REPORT_ID,
  LIGHTING_DRY_RUN_TARGET_METADATA,
  createLightingDryRunExport,
  createLightingDryRunPlan,
} from "./lightingDryRunPlanner";
import { parseImportedProfile } from "./profileValidation";

const importedProfile = parseImportedProfile(JSON.stringify(sampleProfile), "ak680-profile.sample.json");

describe("lightingDryRunPlanner", () => {
  it("creates a disabled 64-byte lighting preview with report ID 0", () => {
    const plan = createLightingDryRunPlan(importedProfile.profile);

    expect(plan.dryRunOnly).toBe(true);
    expect(plan.packetPreview.reportId).toBe(LIGHTING_DRY_RUN_REPORT_ID);
    expect(plan.packetPreview.reportLength).toBe(LIGHTING_DRY_RUN_PACKET_LENGTH);
    expect(plan.packetPreview.bytes).toHaveLength(64);
    expect(plan.executionState.enabled).toBe(false);
    expect(plan.executionState.commandExecutionEnabled).toBe(false);
    expect(plan.executionState.writeSupport).toBe(false);
  });

  it("records AK680 V2 target and interface metadata without HID access", () => {
    const exported = createLightingDryRunExport(importedProfile.profile, "2026-07-01T00:00:00.000Z");

    expect(exported.noHidAccess).toBe(true);
    expect(exported.localOnly).toBe(true);
    expect(exported.plan.targetMetadata).toEqual(LIGHTING_DRY_RUN_TARGET_METADATA);
    expect(exported.plan.targetMetadata.usagePage).toBe(65384);
    expect(exported.plan.targetMetadata.usage).toBe(97);
  });

  it("encodes official profile RGB values into documented preview byte indexes", () => {
    const plan = createLightingDryRunPlan(importedProfile.profile);
    const { red, green, blue } = plan.packetPreview.rgbByteIndexes;

    expect(plan.packetPreview.bytes[red]).toBe(importedProfile.profile.ledEffect?.red);
    expect(plan.packetPreview.bytes[green]).toBe(importedProfile.profile.ledEffect?.green);
    expect(plan.packetPreview.bytes[blue]).toBe(importedProfile.profile.ledEffect?.blue);
  });

  it("clamps out-of-range RGB values and records warnings", () => {
    const plan = createLightingDryRunPlan({
      ...importedProfile.profile,
      ledEffect: {
        ...importedProfile.profile.ledEffect,
        red: -5,
        green: 300,
        blue: 12,
      },
    });

    expect(plan.packetPreview.bytes[3]).toBe(0);
    expect(plan.packetPreview.bytes[4]).toBe(255);
    expect(plan.packetPreview.bytes[5]).toBe(12);
    expect(plan.warnings.join(" ")).toContain("red value -5 is outside 0..255");
    expect(plan.warnings.join(" ")).toContain("green value 300 is outside 0..255");
  });

  it("warns and defaults safely when lighting data is missing", () => {
    const plan = createLightingDryRunPlan({
      ...importedProfile.profile,
      ledEffect: undefined,
    });

    expect(plan.source.hasLedEffect).toBe(false);
    expect(plan.packetPreview.bytes[2]).toBe(0);
    expect(plan.packetPreview.bytes[3]).toBe(0);
    expect(plan.warnings.join(" ")).toContain("no ledEffect object");
    expect(plan.warnings.join(" ")).toContain("mode is missing or not numeric");
  });

  it("keeps WP13/WP16 read-only command boundary unchanged", () => {
    expect(APPROVED_READ_ONLY_COMMANDS).toHaveLength(1);
    expect(APPROVED_READ_ONLY_COMMANDS[0].id).toBe("wp13-device-info-read");
    expect(APPROVED_READ_ONLY_COMMANDS[0].requestBytes.slice(0, 8)).toEqual([0xaa, 0x10, 0x30, 0, 0, 0, 1, 0]);
  });

  it("exports no executable write support fields", () => {
    const exported = createLightingDryRunExport(importedProfile.profile, "2026-07-01T00:00:00.000Z");
    const serialized = JSON.stringify(exported);

    expect(exported.plan.executionState.status).toBe("disabled");
    expect(exported.plan.reportMetadata.retriesAllowed).toBe(false);
    expect(exported.plan.reportMetadata.pollingAllowed).toBe(false);
    expect(exported.plan.reportMetadata.automaticExecutionAllowed).toBe(false);
    expect(serialized).not.toContain("sendReport");
    expect(serialized).not.toContain("device.write");
  });
});
