import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  Cpu,
  FileJson,
  Gauge,
  Home,
  Info,
  Keyboard,
  Lightbulb,
  ListChecks,
  PanelsTopLeft,
  ShieldCheck,
  SquareStack,
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
import {
  LOCAL_PROFILE_STORAGE_KEY,
  LOCAL_PROFILE_SCHEMA_VERSION,
  compareSavedProfiles,
  createLocalProfileBackup,
  createSavedLocalProfile,
  deleteSavedProfile,
  emptyLocalProfileStore,
  parseLocalProfileBackup,
  parseLocalProfileStore,
  renameSavedProfile,
  restoreLocalProfileBackup,
  serializeLocalProfileStore,
} from "./lib/localProfiles";
import type { HidDetectionResult, HidDetectionState } from "./types/hid";
import type { LocalProfileStorageState, LocalProfileStore, SavedLocalProfile } from "./types/localProfile";
import type { AjazzProfile, ImportedProfile, KeyboardKey } from "./types/profile";

type Screen =
  | "dashboard"
  | "device"
  | "profiles"
  | "import"
  | "inspector"
  | "layout"
  | "lighting"
  | "rapid-trigger"
  | "macros"
  | "diagnostics"
  | "about";

const sampleImport = parseImportedProfile(JSON.stringify(sampleProfile), "ak680-profile.sample.json");

const navigation: Array<{ id: Screen; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "device", label: "Device", icon: Cpu },
  { id: "profiles", label: "Profiles", icon: SquareStack },
  { id: "import", label: "Profile Import", icon: FileJson },
  { id: "inspector", label: "Profile Inspector", icon: PanelsTopLeft },
  { id: "layout", label: "Keyboard Layout", icon: Keyboard },
  { id: "lighting", label: "Lighting", icon: Lightbulb },
  { id: "rapid-trigger", label: "Rapid Trigger", icon: Gauge },
  { id: "macros", label: "Macros", icon: Workflow },
  { id: "diagnostics", label: "Diagnostics", icon: ListChecks },
  { id: "about", label: "About", icon: Info },
];

export default function App() {
  const [initialLocalProfileLoad] = useState(loadInitialLocalProfileStore);
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [importedProfile, setImportedProfile] = useState<ImportedProfile>(sampleImport);
  const [hidDetection, setHidDetection] = useState<HidDetectionState>({ status: "idle" });
  const [localProfileStore, setLocalProfileStore] = useState<LocalProfileStore>(initialLocalProfileLoad.store);
  const [storageError, setStorageError] = useState<string | undefined>(initialLocalProfileLoad.error);
  const [backupMessage, setBackupMessage] = useState<string | undefined>(initialLocalProfileLoad.error);
  const [storageHealth, setStorageHealth] = useState<LocalProfileStorageState["storageHealth"]>(() =>
    initialLocalProfileLoad.error ? "recovered" : "healthy",
  );
  const profile = importedProfile.validation.valid ? importedProfile.profile : undefined;
  const localProfileStorage: LocalProfileStorageState = {
    schemaVersion: LOCAL_PROFILE_SCHEMA_VERSION,
    profiles: localProfileStore.profiles,
    activeProfileId: localProfileStore.activeProfileId,
    storageType: "Browser localStorage",
    storageHealth,
    lastStorageError: storageError,
    lastBackupMessage: backupMessage,
  };

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, serializeLocalProfileStore(localProfileStore));
      setStorageError((currentError) => (storageHealth === "recovered" ? currentError : undefined));
      setStorageHealth((currentHealth) => (currentHealth === "recovered" ? "recovered" : "healthy"));
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : String(error));
      setStorageHealth("error");
    }
  }, [localProfileStore, storageHealth]);

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

  function saveImportedProfileLocally() {
    if (!importedProfile.validation.valid) {
      return;
    }

    const savedProfile = createSavedLocalProfile(importedProfile);
    setLocalProfileStore((current) => ({
      version: 1,
      profiles: [savedProfile, ...current.profiles],
      activeProfileId: current.activeProfileId ?? savedProfile.id,
    }));
  }

  function selectActiveLocalProfile(profileId: string) {
    setLocalProfileStore((current) => ({ ...current, activeProfileId: profileId }));
  }

  function renameLocalProfile(profileId: string) {
    const profileToRename = localProfileStore.profiles.find((profile) => profile.id === profileId);
    if (!profileToRename) {
      return;
    }

    const nextName = window.prompt("Rename local profile display name", profileToRename.displayName);
    if (nextName === null) {
      return;
    }

    setLocalProfileStore((current) => ({
      ...current,
      profiles: renameSavedProfile(current.profiles, profileId, nextName),
    }));
  }

  function deleteLocalProfile(profileId: string) {
    const profileToDelete = localProfileStore.profiles.find((profile) => profile.id === profileId);
    if (!profileToDelete) {
      return;
    }

    const confirmed = window.confirm(`Delete local profile "${profileToDelete.displayName}"?`);
    if (!confirmed) {
      return;
    }

    setLocalProfileStore((current) => deleteSavedProfile(current, profileId));
  }

  function exportLocalProfile(profileId: string) {
    const profileToExport = localProfileStore.profiles.find((profile) => profile.id === profileId);
    if (!profileToExport) {
      return;
    }

    const json = JSON.stringify(profileToExport.raw, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFilename(profileToExport.displayName)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupMessage(`Exported profile "${profileToExport.displayName}" as JSON.`);
  }

  function exportProfileLibraryBackup() {
    const backup = createLocalProfileBackup(localProfileStore);
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-profile-library-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupMessage(`Exported full local profile library backup with ${backup.profiles.length} profile(s).`);
  }

  async function restoreProfileLibraryBackup(file: File, mode: "merge" | "replace") {
    const text = await file.text();
    const validation = parseLocalProfileBackup(text);

    if (!validation.valid || !validation.backup) {
      setBackupMessage(validation.error ?? "Backup could not be validated.");
      return;
    }

    if (mode === "replace") {
      const confirmed = window.confirm("Replace all saved local profiles with this backup?");
      if (!confirmed) {
        setBackupMessage("Replace restore canceled. Existing local profiles were preserved.");
        return;
      }
    }

    const restore = restoreLocalProfileBackup(localProfileStore, validation.backup, mode);
    setLocalProfileStore(restore.store);
    setBackupMessage([restore.message, ...validation.warnings, ...restore.warnings].join(" "));
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
                <p className="text-xs text-slate-600">Public alpha, read-only</p>
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
          {activeScreen === "dashboard" && (
            <Dashboard
              profile={profile}
              importedProfile={importedProfile}
              localProfileStorage={localProfileStorage}
            />
          )}
          {activeScreen === "device" && <Device hidDetection={hidDetection} onRefresh={refreshHidDetection} />}
          {activeScreen === "profiles" && (
            <Profiles
              importedProfile={importedProfile}
              localProfileStorage={localProfileStorage}
              onSaveImported={saveImportedProfileLocally}
              onSelectActive={selectActiveLocalProfile}
              onRename={renameLocalProfile}
              onDelete={deleteLocalProfile}
              onExport={exportLocalProfile}
              onExportBackup={exportProfileLibraryBackup}
              onRestoreBackup={restoreProfileLibraryBackup}
            />
          )}
          {activeScreen === "import" && (
            <ProfileImport
              importedProfile={importedProfile}
              setImportedProfile={setImportedProfile}
              onSaveImported={saveImportedProfileLocally}
            />
          )}
          {activeScreen === "inspector" && <ProfileInspector profile={profile} importedProfile={importedProfile} />}
          {activeScreen === "layout" && <KeyboardLayout profile={profile} />}
          {activeScreen === "lighting" && <Lighting profile={profile} />}
          {activeScreen === "rapid-trigger" && <RapidTrigger profile={profile} />}
          {activeScreen === "macros" && <Macros profile={profile} />}
          {activeScreen === "diagnostics" && (
            <Diagnostics
              importedProfile={importedProfile}
              hidDetection={hidDetection}
              localProfileStorage={localProfileStorage}
            />
          )}
          {activeScreen === "about" && <About />}
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

function AlphaSafetyNotice() {
  return (
    <div className="rounded border border-copper/40 bg-copper/10 p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
        <div>
          <p className="font-bold text-ink">Public alpha, local-only, and read-only for hardware</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            AK680 Studio is an unofficial community project for the AJAZZ AK680 V2. It is not affiliated with,
            endorsed by, or maintained by AJAZZ. This alpha stores data locally, enumerates HID devices with
            read-only metadata, and does not write settings to keyboard hardware.
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  profile,
  importedProfile,
  localProfileStorage,
}: {
  profile?: AjazzProfile;
  importedProfile: ImportedProfile;
  localProfileStorage: LocalProfileStorageState;
}) {
  const identity = profile ? getDeviceIdentity(profile) : undefined;
  const activeProfile = localProfileStorage.profiles.find((saved) => saved.id === localProfileStorage.activeProfileId);
  return (
    <>
      <PageHeader title="Dashboard" eyebrow="Public alpha overview" />
      <Section title="Alpha Safety Notice">
        <AlphaSafetyNotice />
      </Section>
      <Section title="Session Summary">
        <InfoGrid
          items={[
            { label: "Target", value: TARGET_DEVICE_ID },
            { label: "Profile", value: profile?.profileName ?? "No valid profile imported" },
            { label: "Device ID", value: identity?.deviceId ?? "Waiting for valid profile" },
            { label: "Source", value: importedProfile.sourceName },
            { label: "User key overrides", value: countUserKeys(profile) },
            { label: "SOCD keys", value: countSocdKeys(profile) },
            { label: "Saved local profiles", value: localProfileStorage.profiles.length },
            { label: "Active local profile", value: activeProfile?.displayName ?? "None selected" },
          ]}
        />
      </Section>
      <Section title="Safety Status">
        <div className="rounded border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-moss" />
            <p className="text-sm leading-6 text-slate-700">
              This public alpha imports local JSON, stores saved profiles locally, and displays profile information
              only. It has no hardware write path, no cloud sync, no account system, no firmware tools, and no
              embedded vendor website.
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
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-moss">
                Detection reads HID metadata only. It does not configure the keyboard.
              </p>
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
              HID enumeration failed locally: {hidDetection.error}
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
          <EmptyState message="No AK680 V2 match was found in the latest read-only HID enumeration. Check USB/wired mode and OS HID permissions if the keyboard is connected." />
        ) : (
          <DeviceTable devices={matchedDevices} />
        )}
      </Section>
      <Section title="Enumerated HID Devices">
        {!result ? (
          <EmptyState message="Run refresh detection to enumerate local HID device metadata. No settings are read from or written to the keyboard." />
        ) : result.devices.length === 0 ? (
          <EmptyState message="HID enumeration completed, but no devices were returned by the operating system." />
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
  onSaveImported,
}: {
  importedProfile: ImportedProfile;
  setImportedProfile: (profile: ImportedProfile) => void;
  onSaveImported: () => void;
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
      <Section title="Local Profile Save">
        <div className="rounded border border-line bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-ink">Save valid import locally</p>
              <p className="mt-1 text-sm text-slate-600">
                Saved profiles stay in browser localStorage on this machine.
              </p>
            </div>
            <button
              type="button"
              onClick={onSaveImported}
              disabled={!importedProfile.validation.valid}
              className="inline-flex items-center justify-center rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Imported Profile Locally
            </button>
          </div>
        </div>
      </Section>
      <ValidationPanel importedProfile={importedProfile} />
    </>
  );
}

function Profiles({
  importedProfile,
  localProfileStorage,
  onSaveImported,
  onSelectActive,
  onRename,
  onDelete,
  onExport,
  onExportBackup,
  onRestoreBackup,
}: {
  importedProfile: ImportedProfile;
  localProfileStorage: LocalProfileStorageState;
  onSaveImported: () => void;
  onSelectActive: (profileId: string) => void;
  onRename: (profileId: string) => void;
  onDelete: (profileId: string) => void;
  onExport: (profileId: string) => void;
  onExportBackup: () => void;
  onRestoreBackup: (file: File, mode: "merge" | "replace") => Promise<void>;
}) {
  const [leftCompareId, setLeftCompareId] = useState("");
  const [rightCompareId, setRightCompareId] = useState("");
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const savedProfiles = localProfileStorage.profiles;
  const activeProfile = savedProfiles.find((profile) => profile.id === localProfileStorage.activeProfileId);
  const leftProfile = savedProfiles.find((profile) => profile.id === leftCompareId);
  const rightProfile = savedProfiles.find((profile) => profile.id === rightCompareId);
  const comparisonRows = leftProfile && rightProfile ? compareSavedProfiles(leftProfile, rightProfile) : [];

  useEffect(() => {
    if (!leftCompareId && savedProfiles[0]) {
      setLeftCompareId(savedProfiles[0].id);
    }
    if (!rightCompareId && savedProfiles[1]) {
      setRightCompareId(savedProfiles[1].id);
    }
  }, [leftCompareId, rightCompareId, savedProfiles]);

  return (
    <>
      <PageHeader title="Profiles" eyebrow="Local profile manager" />
      <Section title="Save Current Import">
        <div className="rounded border border-line bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-ink">
                {importedProfile.validation.valid ? importedProfile.profile.profileName : "No valid AK680 V2 import"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Source: {importedProfile.sourceName}. Local storage only, no account or remote upload.
              </p>
            </div>
            <button
              type="button"
              onClick={onSaveImported}
              disabled={!importedProfile.validation.valid}
              className="inline-flex items-center justify-center rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Imported Profile Locally
            </button>
          </div>
        </div>
      </Section>
      <Section title="Saved Local Profiles">
        {savedProfiles.length === 0 ? (
          <EmptyState message="No local profiles are saved yet. Import a valid AK680 V2 profile, then save it to this machine only." />
        ) : (
          <div className="space-y-3">
            {savedProfiles.map((savedProfile) => (
              <SavedProfileCard
                key={savedProfile.id}
                savedProfile={savedProfile}
                active={savedProfile.id === localProfileStorage.activeProfileId}
                onSelectActive={onSelectActive}
                onRename={onRename}
                onDelete={onDelete}
                onExport={onExport}
              />
            ))}
          </div>
        )}
      </Section>
      <Section title="Active Local Profile">
        <InfoGrid
          items={[
            { label: "Active profile", value: activeProfile?.displayName ?? "None selected" },
            { label: "Storage type", value: localProfileStorage.storageType },
            { label: "Schema version", value: localProfileStorage.schemaVersion },
            { label: "Saved profile count", value: savedProfiles.length },
            { label: "Storage health", value: localProfileStorage.storageHealth },
            { label: "Last storage error", value: localProfileStorage.lastStorageError ?? "None" },
            { label: "Last backup message", value: localProfileStorage.lastBackupMessage ?? "None" },
          ]}
        />
      </Section>
      <Section title="Full Library Backup">
        <div className="rounded border border-line bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div>
              <h3 className="font-bold text-ink">Export full local library</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Exports every saved local profile, schema version, metadata, and active profile selection as a local
                JSON file. Nothing is uploaded.
              </p>
              <button
                type="button"
                onClick={onExportBackup}
                className="mt-3 inline-flex items-center justify-center rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
              >
                Export Library Backup
              </button>
            </div>
            <div>
              <h3 className="font-bold text-ink">Import or restore backup</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Backup shape is validated before restore. Merge keeps existing local profiles; replace asks for
                confirmation first.
              </p>
              <label className="mt-3 block text-sm font-semibold text-ink">
                Restore mode
                <select
                  className="mt-2 w-full rounded border border-line bg-white px-3 py-2 text-sm"
                  value={restoreMode}
                  onChange={(event) => setRestoreMode(event.target.value as "merge" | "replace")}
                >
                  <option value="merge">Merge into existing local profiles</option>
                  <option value="replace">Replace local profiles after confirmation</option>
                </select>
              </label>
              <input
                type="file"
                accept="application/json,.json"
                className="mt-3 block text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onRestoreBackup(file, restoreMode);
                    event.target.value = "";
                  }
                }}
              />
            </div>
          </div>
          {localProfileStorage.lastBackupMessage && (
            <div className="mt-4 rounded border border-moss/30 bg-moss/10 p-3 text-sm text-moss">
              {localProfileStorage.lastBackupMessage}
            </div>
          )}
        </div>
      </Section>
      <Section title="Read-Only Profile Comparison">
        {savedProfiles.length < 2 ? (
          <EmptyState message="Save at least two local profiles to compare high-level profile data. Comparison is read-only." />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <ProfileSelect
                label="Left profile"
                value={leftCompareId}
                profiles={savedProfiles}
                onChange={setLeftCompareId}
              />
              <ProfileSelect
                label="Right profile"
                value={rightCompareId}
                profiles={savedProfiles}
                onChange={setRightCompareId}
              />
            </div>
            {leftProfile && rightProfile ? (
              <ComparisonTable rows={comparisonRows} />
            ) : (
              <EmptyState message="Choose two saved local profiles to view a comparison." />
            )}
          </div>
        )}
      </Section>
    </>
  );
}

function SavedProfileCard({
  savedProfile,
  active,
  onSelectActive,
  onRename,
  onDelete,
  onExport,
}: {
  savedProfile: SavedLocalProfile;
  active: boolean;
  onSelectActive: (profileId: string) => void;
  onRename: (profileId: string) => void;
  onDelete: (profileId: string) => void;
  onExport: (profileId: string) => void;
}) {
  return (
    <div className="rounded border border-line bg-white p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-bold text-ink">{savedProfile.displayName}</h3>
            {active && (
              <span className="rounded border border-moss/40 bg-moss/10 px-2 py-1 text-xs font-semibold uppercase text-moss">
                Active local
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">Original profile: {savedProfile.originalProfileName}</p>
          <p className="mt-1 text-sm text-slate-600">Device: {savedProfile.deviceId || "Unknown"}</p>
          <p className="mt-1 text-sm text-slate-600">
            Source: {savedProfile.sourceFilename || "Not available"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded border border-line px-3 py-2 text-sm" onClick={() => onSelectActive(savedProfile.id)}>
            Set Active
          </button>
          <button type="button" className="rounded border border-line px-3 py-2 text-sm" onClick={() => onRename(savedProfile.id)}>
            Rename
          </button>
          <button type="button" className="rounded border border-line px-3 py-2 text-sm" onClick={() => onExport(savedProfile.id)}>
            Export JSON
          </button>
          <button
            type="button"
            className="rounded border border-red-300 px-3 py-2 text-sm text-red-700"
            onClick={() => onDelete(savedProfile.id)}
          >
            Delete
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Timestamp label="Created" value={savedProfile.createdAt} />
        <Timestamp label="Imported" value={savedProfile.importedAt} />
        <Timestamp label="Updated" value={savedProfile.updatedAt} />
      </div>
    </div>
  );
}

function Timestamp({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded border border-line bg-cloud p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-moss">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-700">{formatTimestamp(value)}</p>
    </div>
  );
}

function ProfileSelect({
  label,
  value,
  profiles,
  onChange,
}: {
  label: string;
  value: string;
  profiles: SavedLocalProfile[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded border border-line bg-white p-4">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select
        className="mt-2 w-full rounded border border-line bg-white px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose a local profile</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComparisonTable({ rows }: { rows: ReturnType<typeof compareSavedProfiles> }) {
  return (
    <div className="overflow-x-auto rounded border border-line bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-cloud text-xs uppercase tracking-wide text-moss">
          <tr>
            <th className="border-b border-line px-3 py-3">Summary</th>
            <th className="border-b border-line px-3 py-3">Left</th>
            <th className="border-b border-line px-3 py-3">Right</th>
            <th className="border-b border-line px-3 py-3">Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="border-b border-line px-3 py-3 font-semibold">{row.label}</td>
              <td className="max-w-sm break-words border-b border-line px-3 py-3">{row.left}</td>
              <td className="max-w-sm break-words border-b border-line px-3 py-3">{row.right}</td>
              <td className="border-b border-line px-3 py-3">{row.status === "same" ? "Same" : "Different"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
            { label: "Calibration", value: "Calibration is not available in this public alpha" },
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
          { label: "Editing", value: "Editing is not available in this public alpha" },
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
  localProfileStorage,
}: {
  importedProfile: ImportedProfile;
  hidDetection: HidDetectionState;
  localProfileStorage: LocalProfileStorageState;
}) {
  const profile = importedProfile.validation.valid ? importedProfile.profile : undefined;
  const hidStatus = getHidStatusText(hidDetection);
  const activeProfile = localProfileStorage.profiles.find((saved) => saved.id === localProfileStorage.activeProfileId);
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
      "No remote upload",
      "No database service",
      "No embedded AJAZZ website",
      "No Electron wrapper",
      "HID enumeration only",
      "Local profile storage only",
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Diagnostics" eyebrow="Validation and safety" />
      <Section title="Public Alpha Status">
        <AlphaSafetyNotice />
      </Section>
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
      <Section title="Local Profile Storage">
        <InfoGrid
          items={[
            { label: "Storage type", value: localProfileStorage.storageType },
            { label: "Schema version", value: localProfileStorage.schemaVersion },
            { label: "Storage health", value: localProfileStorage.storageHealth },
            { label: "Saved profile count", value: localProfileStorage.profiles.length },
            { label: "Active local profile", value: activeProfile?.displayName ?? "None selected" },
            { label: "Last storage error", value: localProfileStorage.lastStorageError ?? "None" },
            { label: "Last backup/import message", value: localProfileStorage.lastBackupMessage ?? "None" },
            { label: "Persistence", value: "Browser localStorage on this machine" },
            { label: "Remote services", value: "Not used" },
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

function About() {
  return (
    <>
      <PageHeader title="About" eyebrow="Public alpha safety" />
      <Section title="AK680 Studio">
        <AlphaSafetyNotice />
      </Section>
      <Section title="Current Capabilities">
        <InfoGrid
          items={[
            { label: "Project status", value: "Public alpha" },
            { label: "Target keyboard", value: "AJAZZ AK680 V2" },
            { label: "Device identity", value: TARGET_DEVICE_ID },
            { label: "Hardware detection", value: "Read-only HID metadata enumeration" },
            { label: "Profile storage", value: "Local browser storage on this machine" },
            { label: "Profile backups", value: "Local JSON import/export only" },
            { label: "Hardware writes", value: "Not implemented" },
            { label: "Vendor affiliation", value: "Unofficial; no AJAZZ affiliation" },
          ]}
        />
      </Section>
      <Section title="Safety Summary">
        <div className="rounded border border-line bg-white p-5">
          <p className="text-sm leading-6 text-slate-700">
            AK680 Studio can inspect imported profile JSON, list local HID device metadata, manage saved local profiles,
            and export or restore local backup files. It is not a complete keyboard control suite yet. Hardware-write,
            firmware, calibration, keymap editing, RGB editing, rapid trigger editing, SOCD editing, and macro editing
            work requires future protocol research, Red Team review, and explicit maintainer approval before
            implementation.
          </p>
        </div>
      </Section>
      <Section title="Reporting and Contributions">
        <div className="rounded border border-line bg-white p-5">
          <p className="text-sm leading-6 text-slate-700">
            Please use the GitHub issue templates for bugs, feature requests, and device detection reports. Do not share
            sensitive serial numbers, private profile data, or local paths unless you are comfortable making them public.
            Contributions should keep the public alpha local-only and read-only for keyboard hardware unless a future
            work package explicitly changes that scope.
          </p>
        </div>
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
        body: "At least one HID device matched VID 3141 and PID 32956. Detection remains read-only.",
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
        body: "Refresh detection to enumerate local HID device metadata.",
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

function loadInitialLocalProfileStore(): { store: LocalProfileStore; error?: string } {
  try {
    return {
      store: parseLocalProfileStore(localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY)),
    };
  } catch (error) {
    return {
      store: emptyLocalProfileStore(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function formatTimestamp(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

function sanitizeFilename(value: string) {
  const sanitized = value.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return sanitized || "ak680-profile";
}
