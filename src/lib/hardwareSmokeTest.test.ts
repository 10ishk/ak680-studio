import { describe, expect, it } from "vitest";
import {
  CONTROLLED_READ_REPORT_ID,
  CONTROLLED_READ_REQUEST_BYTES,
  CONTROLLED_READ_REQUEST_LENGTH,
  CONTROLLED_READ_REQUIRED_USAGE,
  CONTROLLED_READ_REQUIRED_USAGE_PAGE,
} from "./controlledReadExperiment";
import {
  WP14_HARDWARE_SMOKE_TEST_CHECKLIST,
  WP14_RELEASE_SAFETY_STATEMENTS,
  createHardwareSmokeTestTemplate,
} from "./hardwareSmokeTest";

describe("hardware smoke test safety polish", () => {
  it("keeps the WP13 command scope unchanged", () => {
    expect(CONTROLLED_READ_REPORT_ID).toBe(0);
    expect(CONTROLLED_READ_REQUEST_LENGTH).toBe(64);
    expect(CONTROLLED_READ_REQUEST_BYTES.slice(0, 8)).toEqual([0xaa, 0x10, 0x30, 0, 0, 0, 1, 0]);
    expect(CONTROLLED_READ_REQUIRED_USAGE_PAGE).toBe(65384);
    expect(CONTROLLED_READ_REQUIRED_USAGE).toBe(97);
  });

  it("exports a manual observation-only smoke test template", () => {
    const template = createHardwareSmokeTestTemplate(new Date("2026-06-30T00:00:00.000Z"));

    expect(template).toMatchObject({
      exportType: "ak680-hardware-smoke-test-template",
      timestamp: "2026-06-30T00:00:00.000Z",
      status: "not-performed",
      observationOnly: true,
      reportId: 0,
      requestLength: 64,
      requiredTarget: {
        vendorId: 3141,
        productId: 32956,
        usagePage: 65384,
        usage: 97,
        exactSelectedPathRequired: true,
      },
      resultFields: {
        runPerformed: false,
      },
    });
  });

  it("documents observations without unsupported inferences", () => {
    const safetyText = WP14_RELEASE_SAFETY_STATEMENTS.join(" ");
    const checklistText = WP14_HARDWARE_SMOKE_TEST_CHECKLIST.map((item) => `${item.label} ${item.detail}`).join(" ");

    expect(safetyText).toContain("observations only");
    expect(safetyText).toContain("No firmware, settings, calibration, layout, memory, profile state");
    expect(safetyText).toContain("No writes, apply, sync, save-to-device");
    expect(checklistText).toContain("optional and manual");
    expect(checklistText).toContain("one manual action, no retries");
    expect(checklistText).toContain("Do not use command scanning");
  });

  it("does not introduce additional protocol execution affordances", () => {
    const exportedText = JSON.stringify(createHardwareSmokeTestTemplate());

    expect(exportedText).not.toMatch(/"execute"|"payload"|"packetBytes"|"commandBytes"/i);
    expect(exportedText).not.toMatch(/fuzzing enabled|scanning enabled|polling enabled|raw command console enabled/i);
  });
});
