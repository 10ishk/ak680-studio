import { useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  Cpu,
  FileJson,
  Gauge,
  Home,
  Keyboard,
  Lightbulb,
  ListChecks,
  PanelsTopLeft,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import sampleProfile from "../fixtures/ak680-profile.sample.json";
import { InfoGrid } from "./components/InfoGrid";
import { JsonPreview } from "./components/JsonPreview";
import { ReadOnlyPill } from "./components/ReadOnlyPill";
import {
  TARGET_DEVICE_ID,
  TARGET_PID,
  TARGET_VID,
  countSocdKeys,
  countUserKeys,
  getDeviceIdentity,
  parseImportedProfile,
  summarizeArray,
} from "./lib/profileValidation";
import type { HidDetectionResult, HidDetectionState } from "./types/hid";
import type { AjazzProfile, ImportedProfile, KeyboardKey } from "./types/profile";

type Screen =
  | "dashboard"
  | "device"
  | "import"
  | "inspector"
  | "layout"
  | "lighting"
  | "rapid-trigger"
  | "macros"
  | "diagnostics";

const sampleImport = parseImportedProfile(JSON.stringify(sampleProfile), "ak680-profile.sample.json");

const navigation: Array<{ id: Screen; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "device", label: "Device", icon: Cpu },
  { id: "import", label: "Profile Import", icon: FileJson },
  { id: "inspector", label: "Profile Inspector", icon: PanelsTopLeft },
  { id: "layout", label: "Keyboard Layout", icon: Keyboard },
  { id: "lighting", label: "Lighting", icon: Lightbulb },
  { id: "rapid-trigger", label: "Rapid Trigger", icon: Gauge },
  { id: "macros", label: "Macros", icon: Workflow },
  { id: "diagnostics", label: "Diagnostics", icon: ListChecks },
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [importedProfile, setImportedProfile] = useState<ImportedProfile>(sampleImport);
  const [hidDetection, setHidDetection] = useState<HidDetectionState>({ status: "idle" });
  const profile = importedProfile.validation.valid ? importedProfile.profile : undefined;

  async function refreshHidDetection() {
    setHidDetection((current) => ({ status: "checking", result: current.result }));

    try {
      const result = await invoke<HidDetectionResult>("list_hid_devices");
      setHidDetection({ status: result.targetDetected ? "detected" : "not-detected", result });
    } catch (error) {
      setHidDetection({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <div className="min-h-screen bg-cloud text-ink">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-line bg-white">
          <div className="border-b border-line p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded bg-ink text-white">
                <Keyboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold">AK680 Studio</p>
                <p className="text-xs text-slate-600">Unofficial profile inspector</p>
              </div>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible">
            {navigation.map((item) => {
              const Icon = item.icon;
              const selected = item.id === activeScreen;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveScreen(item.id)}
                  className={`flex min-w-max items-center gap-3 rounded px-3 py-2 text-left text-sm font-medium transition lg:w-full ${
                    selected ? "bg-ink text-white" : "text-slate-700 hover:bg-cloud"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 p-5 lg:p-8">
          {activeScreen === "dashboard" && <Dashboard profile={profile} importedProfile={importedProfile} />}
          {activeScreen === "device" && <Device hidDetection={hidDetection} onRefresh={refreshHidDetection} />}
          {activeScreen === "import" && (
            <ProfileImport importedProfile={importedProfile} setImportedProfile={setImportedProfile} />
          )}
          {activeScreen === "inspector" && <ProfileInspector profile={profile} importedProfile={importedProfile} />}
          {activeScreen === "layout" && <KeyboardLayout profile={profile} />}
          {activeScreen === "lighting" && <Lighting profile={profile} />}
          {activeScreen === "rapid-trigger" && <RapidTrigger profile={profile} />}
          {activeScreen === "macros" && <Macros profile={profile} />}
          {activeScreen === "diagnostics" && (
            <Diagnostics importedProfile={importedProfile} hidDetection={hidDetection} />
          )}
        </main>
      </div>
    </div>
  );
}

function PageHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <header className="mb-6 flex flex-col gap-3 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-copper">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal text-ink">{title}</h1>
      </div>
      <ReadOnlyPill />
    </header>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-3 text-lg font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Dashboard({
  profile,
  importedProfile,
}: {
  profile?: AjazzProfile;
  importedProfile: ImportedProfile;
}) {
  const identity = profile ? getDeviceIdentity(profile) : undefined;
  return (
    <>
      <PageHeader title="Dashboard" eyebrow="Native app foundation" />
      <Section title="Session Summary">
        <InfoGrid
          items={[
            { label: "Target", value: TARGET_DEVICE_ID },
            { label: "Profile", value: profile?.profileName ?? "No valid profile imported" },
            { label: "Device ID", value: identity?.deviceId ?? "Waiting for valid profile" },
            { label: "Source", value: importedProfile.sourceName },
            { label: "User key overrides", value: countUserKeys(profile) },
            { label: "SOCD keys", value: countSocdKeys(profile) },
          ]}
        />
      </Section>
      <Section title="Safety Status">
        <div className="rounded border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-moss" />
            <p className="text-sm leading-6 text-slate-700">
              This build imports local JSON and displays profile information only. It has no hardware write path, no
              cloud sync, no firmware tools, and no embedded vendor website.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}

function Device({
  hidDetection,
  onRefresh,
}: {
  hidDetection: HidDetectionState;
  onRefresh: () => Promise<void>;
}) {
  const result = hidDetection.result;
  const matchedDevices = result?.devices.filter((device) => device.matchedTarget) ?? [];
  const statusText = getHidStatusText(hidDetection);

  return (
    <>
      <PageHeader title="Device" eyebrow="Read-only HID detection" />
      <Section title="Detection">
        <div className="rounded border border-line bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-lg font-bold text-ink">{statusText.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{statusText.body}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                void onRefresh();
              }}
              disabled={hidDetection.status === "checking"}
              className="inline-flex items-center justify-center rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
            >
              {hidDetection.status === "checking" ? "Detecting..." : "Refresh Detection"}
            </button>
          </div>
          {hidDetection.status === "error" && (
            <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {hidDetection.error}
            </div>
          )}
        </div>
      </Section>
      <InfoGrid
        items={[
          { label: "Expected model", value: "AJAZZ AK680 V2" },
          { label: "Expected VID", value: TARGET_VID },
          { label: "Expected PID", value: TARGET_PID },
          { label: "Expected device ID", value: TARGET_DEVICE_ID },
          { label: "Detection", value: statusText.title },
          { label: "Connection notes", value: "USB/wired mode and OS HID permissions may affect enumeration." },
        ]}
      />
      <Section title="Matched AK680 V2 Devices">
        {matchedDevices.length === 0 ? (
          <EmptyState message="No HID device matching VID 3141 and PID 32956 has been detected in the latest result." />
        ) : (
          <DeviceTable devices={matchedDevices} />
        )}
      </Section>
      <Section title="Enumerated HID Devices">
        {!result ? (
          <EmptyState message="Run refresh detection to enumerate local HID devices." />
        ) : result.devices.length === 0 ? (
          <EmptyState message="HID enumeration completed, but no devices were returned." />
        ) : (
          <DeviceTable devices={result.devices} />
        )}
      </Section>
    </>
  );
}

function ProfileImport({
  importedProfile,
  setImportedProfile,
}: {
  importedProfile: ImportedProfile;
  setImportedProfile: (profile: ImportedProfile) => void;
}) {
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    setImportedProfile(parseImportedProfile(text, file.name));
  }

  return (
    <>
      <PageHeader title="Profile Import" eyebrow="Local JSON only" />
      <Section title="Import AJAZZ Profile JSON">
        <label className="block rounded border border-dashed border-moss bg-white p-6">
          <span className="block text-sm font-semibold text-ink">Choose a profile export</span>
          <span className="mt-1 block text-sm text-slate-600">
            The file is parsed locally in this app session and is not uploaded.
          </span>
          <input type="file" accept="application/json,.json" onChange={handleFileChange} className="mt-4 block text-sm" />
        </label>
      </Section>
      <ValidationPanel importedProfile={importedProfile} />
    </>
  );
}

function ValidationPanel({ importedProfile }: { importedProfile: ImportedProfile }) {
  const { validation } = importedProfile;
  return (
    <Section title="Validation Result">
      <div className={`rounded border p-5 ${validation.valid ? "border-moss bg-white" : "border-red-300 bg-red-50"}`}>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <p className="font-semibold">{validation.valid ? "Valid AK680 V2 profile" : "Profile rejected"}</p>
        </div>
        <p className="mt-2 text-sm text-slate-600">Source: {importedProfile.sourceName}</p>
        {validation.errors.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-700">
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        {validation.warnings.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-700">
            {validation.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

function ProfileInspector({
  profile,
  importedProfile,
}: {
  profile?: AjazzProfile;
  importedProfile: ImportedProfile;
}) {
  const identity = profile ? getDeviceIdentity(profile) : undefined;
  return (
    <>
      <PageHeader title="Profile Inspector" eyebrow="Imported profile details" />
      {!profile && <ValidationPanel importedProfile={importedProfile} />}
      {profile && (
        <>
          <Section title="Core Profile">
            <InfoGrid
              items={[
                { label: "Profile name", value: profile.profileName },
                { label: "Device ID", value: identity?.deviceId },
                { label: "VID", value: identity?.vid },
                { label: "PID", value: identity?.pid },
                { label: "Firmware/profile version", value: profile.deviceInfo?.version },
                { label: "Macro space size", value: profile.deviceInfo?.macroSpaceSize },
              ]}
            />
          </Section>
          <Section title="Device Info">
            <JsonPreview data={profile.deviceInfo} />
          </Section>
          <Section title="Game Mode Info">
            <JsonPreview data={profile.gameModeInfo} />
          </Section>
        </>
      )}
    </>
  );
}

function KeyboardLayout({ profile }: { profile?: AjazzProfile }) {
  return (
    <>
      <PageHeader title="Keyboard Layout" eyebrow="Rendered from keyList" />
      {!profile?.keyList ? (
        <EmptyState message="Import a valid AK680 V2 profile with keyList data to render the keyboard." />
      ) : (
        <div className="overflow-x-auto rounded border border-line bg-white p-4">
          <div className="min-w-[920px] space-y-2">
            {profile.keyList.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex gap-2">
                {row.map((key) => (
                  <KeyCap key={`${rowIndex}-${key.value}-${key.name}`} keyboardKey={key} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function KeyCap({ keyboardKey }: { keyboardKey: KeyboardKey }) {
  const highlighted = Boolean(keyboardKey.userKey);
  const widthClass = getKeyWidth(keyboardKey.className);
  return (
    <div
      className={`${widthClass} relative flex h-14 shrink-0 flex-col justify-between rounded border px-2 py-1 text-xs ${
        highlighted ? "border-copper bg-copper/15 text-ink" : "border-line bg-cloud text-slate-700"
      }`}
      title={`value: ${keyboardKey.value ?? "n/a"}; className: ${keyboardKey.className ?? "none"}`}
    >
      <span className="font-semibold">{keyboardKey.name ?? "Key"}</span>
      {keyboardKey.userKey?.name === "SOCD" && (
        <span className="w-fit rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">SOCD</span>
      )}
    </div>
  );
}

function Lighting({ profile }: { profile?: AjazzProfile }) {
  return (
    <>
      <PageHeader title="Lighting" eyebrow="LED data summary" />
      <Section title="LED Effect">
        <JsonPreview data={profile?.ledEffect} />
      </Section>
      <Section title="Custom LED Data">
        <InfoGrid items={[{ label: "Custom LED records", value: summarizeArray(profile?.customLedData) }]} />
      </Section>
    </>
  );
}

function RapidTrigger({ profile }: { profile?: AjazzProfile }) {
  return (
    <>
      <PageHeader title="Rapid Trigger" eyebrow="Magnetic-axis summary" />
      <Section title="Summary">
        <InfoGrid
          items={[
            { label: "magneticAxisRT records", value: summarizeArray(profile?.magneticAxisRT) },
            { label: "magneticAxisRTConfig records", value: summarizeArray(profile?.magneticAxisRTConfig) },
            { label: "Calibration", value: "Not available in Work Package 1" },
          ]}
        />
      </Section>
      <Section title="magneticAxisRT">
        <JsonPreview data={profile?.magneticAxisRT} />
      </Section>
      <Section title="magneticAxisRTConfig">
        <JsonPreview data={profile?.magneticAxisRTConfig} />
      </Section>
    </>
  );
}

function Macros({ profile }: { profile?: AjazzProfile }) {
  return (
    <>
      <PageHeader title="Macros" eyebrow="Macro data summary" />
      <InfoGrid
        items={[
          { label: "Macro records", value: summarizeArray(profile?.macroDataList) },
          { label: "Macro space size", value: profile?.deviceInfo?.macroSpaceSize ?? "Not present" },
          { label: "Editing", value: "Not available in Work Package 1" },
        ]}
      />
      <Section title="Macro Data">
        <JsonPreview data={profile?.macroDataList} />
      </Section>
    </>
  );
}

function Diagnostics({
  importedProfile,
  hidDetection,
}: {
  importedProfile: ImportedProfile;
  hidDetection: HidDetectionState;
}) {
  const profile = importedProfile.validation.valid ? importedProfile.profile : undefined;
  const hidStatus = getHidStatusText(hidDetection);
  const safetyItems = useMemo(
    () => [
      "No hardware write commands",
      "No key remapping write UI",
      "No RGB write UI",
      "No rapid trigger write UI",
      "No SOCD write UI",
      "No macro write UI",
      "No firmware flashing",
      "No calibration controls",
      "No cloud login or sync",
      "No embedded AJAZZ website",
      "No Electron wrapper",
      "HID enumeration only",
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Diagnostics" eyebrow="Validation and safety" />
      <ValidationPanel importedProfile={importedProfile} />
      <Section title="Target Identity">
        <InfoGrid
          items={[
            { label: "Expected device ID", value: TARGET_DEVICE_ID },
            { label: "Expected VID", value: TARGET_VID },
            { label: "Expected PID", value: TARGET_PID },
            { label: "Imported profile", value: profile?.profileName ?? "No valid profile" },
          ]}
        />
      </Section>
      <Section title="HID Detection Status">
        <InfoGrid
          items={[
            { label: "Last status", value: hidStatus.title },
            { label: "AK680 V2 detected", value: hidDetection.result?.targetDetected ? "Yes" : "No" },
            { label: "Enumerated HID devices", value: hidDetection.result?.devices.length ?? "No detection run" },
            { label: "Target VID", value: TARGET_VID },
            { label: "Target PID", value: TARGET_PID },
            { label: "Last error", value: hidDetection.status === "error" ? hidDetection.error : "None" },
          ]}
        />
      </Section>
      <Section title="Safety Audit">
        <ul className="grid gap-2 sm:grid-cols-2">
          {safetyItems.map((item) => (
            <li key={item} className="rounded border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

function DeviceTable({ devices }: { devices: HidDetectionResult["devices"] }) {
  return (
    <div className="overflow-x-auto rounded border border-line bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-cloud text-xs uppercase tracking-wide text-moss">
          <tr>
            <th className="border-b border-line px-3 py-3">Match</th>
            <th className="border-b border-line px-3 py-3">VID</th>
            <th className="border-b border-line px-3 py-3">PID</th>
            <th className="border-b border-line px-3 py-3">Manufacturer</th>
            <th className="border-b border-line px-3 py-3">Product</th>
            <th className="border-b border-line px-3 py-3">Serial</th>
            <th className="border-b border-line px-3 py-3">Path</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device, index) => (
            <tr key={`${device.vendorId}-${device.productId}-${device.path ?? index}`} className="align-top">
              <td className="border-b border-line px-3 py-3 font-semibold">
                {device.matchedTarget ? "AK680 V2" : "No"}
              </td>
              <td className="border-b border-line px-3 py-3">{device.vendorId}</td>
              <td className="border-b border-line px-3 py-3">{device.productId}</td>
              <td className="border-b border-line px-3 py-3">{device.manufacturer || "Not available"}</td>
              <td className="border-b border-line px-3 py-3">{device.product || "Not available"}</td>
              <td className="border-b border-line px-3 py-3">{device.serialNumber || "Not available"}</td>
              <td className="max-w-96 break-words border-b border-line px-3 py-3 text-xs">
                {device.path || "Not available"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getHidStatusText(hidDetection: HidDetectionState) {
  switch (hidDetection.status) {
    case "checking":
      return {
        title: "Detecting HID devices",
        body: "Enumerating local HID metadata through the Rust backend. This does not configure the keyboard.",
      };
    case "detected":
      return {
        title: "AK680 V2 detected",
        body: "At least one HID device matched VID 3141 and PID 32956.",
      };
    case "not-detected":
      return {
        title: "AK680 V2 not detected",
        body: "HID enumeration completed, but no device matched VID 3141 and PID 32956.",
      };
    case "error":
      return {
        title: "HID enumeration error",
        body: "The backend could not enumerate HID devices. Check OS permissions and retry.",
      };
    case "idle":
    default:
      return {
        title: "Detection not run",
        body: "Refresh detection to enumerate local HID devices using read-only metadata.",
      };
  }
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded border border-line bg-white p-6 text-sm text-slate-600">{message}</div>;
}

function getKeyWidth(className?: string) {
  if (className?.includes("flex-1")) {
    return "w-72";
  }

  const widthMatch = className?.match(/w-(\d+)/);
  if (!widthMatch) {
    return "w-14";
  }

  const width = Number(widthMatch[1]);

  if (width >= 34) return "w-36";
  if (width >= 31) return "w-32";
  if (width >= 27) return "w-28";
  if (width >= 22) return "w-24";
  if (width >= 18) return "w-20";
  return "w-14";
}
