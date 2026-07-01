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
  ClipboardCheck,
  ShieldCheck,
  SlidersHorizontal,
  SquareStack,
  Workflow,
} from "lucide-react";
import sampleProfile from "../fixtures/ak680-profile.sample.json";
import { InfoGrid } from "./components/InfoGrid";
import { JsonPreview } from "./components/JsonPreview";
import { ReadOnlyPill } from "./components/ReadOnlyPill";
import packageJson from "../package.json";
import {
  TARGET_DEVICE_ID,
  TARGET_PID,
  TARGET_VID,
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
import {
  createEditedImportedProfile,
  createEditedRaw,
  createEditorDiffSummary,
  createEditorSessionFromImported,
  createEditorSessionFromSaved,
  getEditableKeyEntries,
  getFirstEditableMagneticAxis,
  resetEditorSession,
  setEditorProfileName,
  setFirstMagneticAxisValue,
  setGameModeValue,
  setKeyUserAssignment,
  setLightingValue,
  validateEditorSession,
} from "./lib/localEditor";
import { createDryRunExport, createDryRunPlan, summarizeOperations } from "./lib/dryRunPlanner";
import {
  createCanceledControlledReadResult,
  createControlledReadBackendRequest,
  createControlledReadExperimentState,
  createControlledReadExport,
  createControlledReadResultFromBackend,
  getMatchingControlledReadInterfaces,
} from "./lib/controlledReadExperiment";
import {
  PROTOCOL_ASSUMPTIONS,
  PROTOCOL_SAFETY_STATUS,
  createProtocolDiagnosticsSnapshot,
  formatOptionalMetadata,
  getMatchingResearchInterfaces,
  inferLikelyResearchInterface,
  summarizeProtocolDevice,
} from "./lib/protocolResearch";
import {
  EXAMPLE_CANDIDATE_QUERY_DOSSIER,
  PROTOCOL_EVIDENCE_REQUIRED_ITEMS,
  createCandidateQueryDossierExport,
  validateCandidateQueryDossier,
} from "./lib/protocolEvidence";
import {
  WP14_HARDWARE_SMOKE_TEST_CHECKLIST,
  WP14_RELEASE_SAFETY_STATEMENTS,
  createHardwareSmokeTestTemplate,
} from "./lib/hardwareSmokeTest";
import {
  EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK,
  READ_CANDIDATE_AREAS,
  READ_CANDIDATE_STATUSES,
  WP15_SAFETY_NOTES,
  createReadProtocolEvidencePackExport,
  validateReadProtocolEvidencePack,
} from "./lib/readProtocolEvidence";
import {
  APPROVED_READ_ONLY_COMMANDS,
  FUTURE_WRITE_GATE,
  READ_ONLY_COMMAND_PACK_VERSION,
  READ_ONLY_FOUNDATION_SAFETY_NOTES,
  createReadOnlyDeviceSnapshot,
  createReadOnlySnapshotExport,
  createSnapshotProfileComparison,
} from "./lib/readOnlySettingsFoundation";
import {
  DISABLED_WRITE_READINESS_CHECKLIST,
  EXAMPLE_FIRST_WRITE_EVIDENCE_PACK,
  WP17_SAFETY_NOTES,
  createFirstWriteEvidenceExport,
  validateFirstWriteEvidencePack,
} from "./lib/firstWriteEvidence";
import {
  WP18_SAFETY_NOTES,
  createFirstWriteCandidateSelectionExport,
  reviewFirstWriteCandidateSelection,
} from "./lib/firstWriteCandidateSelection";
import {
  CONTROLLED_LIGHTING_WRITE_PACKET_BYTES,
  CONTROLLED_LIGHTING_WRITE_PACKET_HEX,
  CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH,
  CONTROLLED_LIGHTING_WRITE_REPORT_ID,
  WP22_PHYSICAL_VERIFICATION_REMINDER,
  buildFunctionalLightingPacket,
  WP21_PHYSICAL_VERIFICATION_REMINDER,
  createCanceledControlledLightingWriteResult,
  createControlledLightingWriteBackendRequest,
  createControlledLightingWriteExperimentState,
  createControlledLightingWriteExport,
  createControlledLightingWriteResultFromBackend,
  createFunctionalLightingSettingsFromLedEffect,
  createFunctionalLightingWriteBackendRequest,
  createFunctionalLightingWriteExport,
  getControlledLightingWriteCandidateInterfaces,
} from "./lib/controlledLightingWriteExperiment";
import { createLightingDryRunExport, createLightingDryRunPlan } from "./lib/lightingDryRunPlanner";
import {
  getActiveRapidTriggerKeys,
  getGameModeSummary,
  getLightingSummary,
  inspectOfficialProfile,
} from "./lib/officialProfile";
import type { HidDetectionResult, HidDetectionState } from "./types/hid";
import type { LocalProfileStorageState, LocalProfileStore, SavedLocalProfile } from "./types/localProfile";
import type { AjazzProfile, ImportedProfile, KeyboardKey } from "./types/profile";
import type { EditorDiffSummary, EditorValidation, LocalEditorSession } from "./lib/localEditor";
import type { DryRunPlan } from "./lib/dryRunPlanner";
import type {
  ControlledReadBackendResult,
  ControlledReadExperimentState,
  ControlledReadResult,
} from "./lib/controlledReadExperiment";
import type {
  ControlledLightingWriteBackendResult,
  ControlledLightingWriteExperimentState,
  ControlledLightingWriteResult,
  FunctionalLightingSettings,
} from "./lib/controlledLightingWriteExperiment";

type Screen =
  | "dashboard"
  | "device"
  | "profiles"
  | "editor"
  | "write-safety"
  | "import"
  | "inspector"
  | "layout"
  | "lighting"
  | "rapid-trigger"
  | "macros"
  | "protocol"
  | "diagnostics"
  | "about";

const sampleImport = parseImportedProfile(JSON.stringify(sampleProfile), "ak680-profile.sample.json");

const navigation: Array<{ id: Screen; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "device", label: "Device", icon: Cpu },
  { id: "profiles", label: "Profiles", icon: SquareStack },
  { id: "editor", label: "Local Editor", icon: SlidersHorizontal },
  { id: "write-safety", label: "Write Safety", icon: ClipboardCheck },
  { id: "import", label: "Profile Import", icon: FileJson },
  { id: "inspector", label: "Profile Inspector", icon: PanelsTopLeft },
  { id: "layout", label: "Keyboard Layout", icon: Keyboard },
  { id: "lighting", label: "Lighting", icon: Lightbulb },
  { id: "rapid-trigger", label: "Rapid Trigger", icon: Gauge },
  { id: "macros", label: "Macros", icon: Workflow },
  { id: "protocol", label: "Protocol Research", icon: Activity },
  { id: "diagnostics", label: "Diagnostics", icon: ListChecks },
  { id: "about", label: "About", icon: Info },
];

const APP_VERSION = packageJson.version ?? "Not available";

export default function App() {
  const [initialLocalProfileLoad] = useState(loadInitialLocalProfileStore);
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [importedProfile, setImportedProfile] = useState<ImportedProfile>(sampleImport);
  const [hidDetection, setHidDetection] = useState<HidDetectionState>({ status: "idle" });
  const [localProfileStore, setLocalProfileStore] = useState<LocalProfileStore>(initialLocalProfileLoad.store);
  const [storageError, setStorageError] = useState<string | undefined>(initialLocalProfileLoad.error);
  const [backupMessage, setBackupMessage] = useState<string | undefined>(initialLocalProfileLoad.error);
  const [editorSession, setEditorSession] = useState<LocalEditorSession | undefined>();
  const [controlledReadSelectedPath, setControlledReadSelectedPath] = useState("");
  const [controlledReadResult, setControlledReadResult] = useState<ControlledReadResult | undefined>();
  const [controlledLightingWriteSelectedPath, setControlledLightingWriteSelectedPath] = useState("");
  const [controlledLightingWriteConfirmed, setControlledLightingWriteConfirmed] = useState(false);
  const [controlledLightingWriteResult, setControlledLightingWriteResult] = useState<
    ControlledLightingWriteResult | undefined
  >();
  const [functionalLightingSettings, setFunctionalLightingSettings] = useState<FunctionalLightingSettings>(() =>
    createFunctionalLightingSettingsFromLedEffect(sampleImport.profile.ledEffect),
  );
  const [functionalLightingConfirmed, setFunctionalLightingConfirmed] = useState(false);
  const [functionalLightingResult, setFunctionalLightingResult] = useState<ControlledLightingWriteResult | undefined>();
  const editorValidation = useMemo(() => validateEditorSession(editorSession), [editorSession]);
  const editorDiff = useMemo(() => createEditorDiffSummary(editorSession), [editorSession]);
  const [storageHealth, setStorageHealth] = useState<LocalProfileStorageState["storageHealth"]>(() =>
    initialLocalProfileLoad.error ? "recovered" : "healthy",
  );
  const profile = importedProfile.validation.valid ? importedProfile.profile : undefined;
  const localProfileStorage: LocalProfileStorageState = useMemo(
    () => ({
      schemaVersion: LOCAL_PROFILE_SCHEMA_VERSION,
      profiles: localProfileStore.profiles,
      activeProfileId: localProfileStore.activeProfileId,
      storageType: "Browser localStorage",
      storageHealth,
      lastStorageError: storageError,
      lastBackupMessage: backupMessage,
    }),
    [backupMessage, localProfileStore.activeProfileId, localProfileStore.profiles, storageError, storageHealth],
  );
  const dryRunPlan = useMemo(
    () =>
      createDryRunPlan({
        editorSession,
        editorValidation,
        hidDetection,
        localProfileStorage,
        appVersion: APP_VERSION,
        protocolAssumptions: PROTOCOL_ASSUMPTIONS,
      }),
    [editorSession, editorValidation, hidDetection, localProfileStorage],
  );
  const controlledReadState = useMemo(
    () =>
      createControlledReadExperimentState({
        hidDetection: hidDetection.result,
        selectedPath: controlledReadSelectedPath || undefined,
        result: controlledReadResult,
      }),
    [controlledReadResult, controlledReadSelectedPath, hidDetection.result],
  );
  const controlledLightingWriteState = useMemo(
    () =>
      createControlledLightingWriteExperimentState({
        hidDetection: hidDetection.result,
        selectedPath: controlledLightingWriteSelectedPath || undefined,
        manualConfirmation: controlledLightingWriteConfirmed,
        result: controlledLightingWriteResult,
      }),
    [
      controlledLightingWriteConfirmed,
      controlledLightingWriteResult,
      controlledLightingWriteSelectedPath,
      hidDetection.result,
    ],
  );
  const functionalLightingWriteState = useMemo(
    () =>
      createControlledLightingWriteExperimentState({
        hidDetection: hidDetection.result,
        selectedPath: controlledLightingWriteSelectedPath || undefined,
        manualConfirmation: functionalLightingConfirmed,
        result: functionalLightingResult,
      }),
    [controlledLightingWriteSelectedPath, functionalLightingConfirmed, functionalLightingResult, hidDetection.result],
  );

  useEffect(() => {
    if (importedProfile.validation.valid) {
      setFunctionalLightingSettings(createFunctionalLightingSettingsFromLedEffect(importedProfile.profile.ledEffect));
      setFunctionalLightingConfirmed(false);
    }
  }, [importedProfile]);

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

  function startEditingImportedProfile() {
    const session = createEditorSessionFromImported(importedProfile);
    if (!session) {
      return;
    }

    setEditorSession(session);
    setActiveScreen("editor");
  }

  function startEditingSavedProfile(profileId: string) {
    const savedProfile = localProfileStore.profiles.find((profile) => profile.id === profileId);
    if (!savedProfile) {
      return;
    }

    setEditorSession(createEditorSessionFromSaved(savedProfile));
    setActiveScreen("editor");
  }

  function exportEditedProfile() {
    if (!editorSession || !editorValidation.valid) {
      return;
    }

    const json = JSON.stringify(createEditedRaw(editorSession), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFilename(editorSession.workingProfile.profileName || "ak680-edited-profile")}-edited.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function saveEditedProfileAsNew() {
    if (!editorSession || !editorValidation.valid) {
      return;
    }

    const editedImport = createEditedImportedProfile(editorSession, "local-editor.json");
    const savedProfile = createSavedLocalProfile(editedImport);
    setLocalProfileStore((current) => ({
      ...current,
      profiles: [savedProfile, ...current.profiles],
      activeProfileId: current.activeProfileId ?? savedProfile.id,
    }));
    setBackupMessage(`Saved edited profile "${savedProfile.displayName}" as a new local profile.`);
  }

  function updateEditedSavedProfile() {
    if (!editorSession || editorSession.source.kind !== "saved" || !editorValidation.valid) {
      return;
    }

    const savedSource = editorSession.source;
    const savedProfile = localProfileStore.profiles.find((profile) => profile.id === savedSource.savedProfileId);
    if (!savedProfile) {
      return;
    }

    const confirmed = window.confirm(`Update saved local profile "${savedProfile.displayName}" with local edits?`);
    if (!confirmed) {
      return;
    }

    const updatedProfile: SavedLocalProfile = {
      ...savedProfile,
      displayName: editorSession.workingProfile.profileName || savedProfile.displayName,
      originalProfileName: editorSession.workingProfile.profileName || savedProfile.originalProfileName,
      deviceId: getDeviceIdentity(editorSession.workingProfile)?.deviceId ?? savedProfile.deviceId,
      updatedAt: new Date().toISOString(),
      raw: createEditedRaw(editorSession),
      profile: createEditedImportedProfile(editorSession).profile,
    };

    setLocalProfileStore((current) => ({
      ...current,
      profiles: current.profiles.map((profile) => (profile.id === updatedProfile.id ? updatedProfile : profile)),
    }));
    setEditorSession(createEditorSessionFromSaved(updatedProfile));
    setBackupMessage(`Updated saved local profile "${updatedProfile.displayName}".`);
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

  function exportProtocolDiagnosticsSnapshot() {
    const snapshot = createProtocolDiagnosticsSnapshot({
      hidDetection: hidDetection.result,
      importedProfile,
      localProfileStorage,
      appVersion: APP_VERSION,
    });
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-protocol-research-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportDryRunPlan() {
    if (!editorSession || !editorValidation.valid) {
      return;
    }

    const exportedPlan = createDryRunExport(dryRunPlan);
    const json = JSON.stringify(exportedPlan, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-dry-run-plan-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportControlledReadStatus() {
    const exportedStatus = createControlledReadExport({ state: controlledReadState });
    const json = JSON.stringify(exportedStatus, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-controlled-read-status-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCandidateQueryDossier() {
    const exportedDossier = createCandidateQueryDossierExport({ dossier: EXAMPLE_CANDIDATE_QUERY_DOSSIER });
    const json = JSON.stringify(exportedDossier, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-candidate-query-dossier-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportHardwareSmokeTestTemplate() {
    const exportedTemplate = createHardwareSmokeTestTemplate();
    const json = JSON.stringify(exportedTemplate, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-hardware-smoke-test-template-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportReadProtocolEvidencePack() {
    const exportedPack = createReadProtocolEvidencePackExport();
    const json = JSON.stringify(exportedPack, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-read-protocol-evidence-pack-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportReadOnlySnapshot() {
    const snapshot = createReadOnlyDeviceSnapshot({
      controlledReadState,
      appVersion: APP_VERSION,
    });
    const comparison = createSnapshotProfileComparison({ snapshot, profile });
    const exportedSnapshot = createReadOnlySnapshotExport({ snapshot, comparison });
    const json = JSON.stringify(exportedSnapshot, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-read-only-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportFirstWriteEvidencePlan() {
    const exportedPlan = createFirstWriteEvidenceExport();
    const json = JSON.stringify(exportedPlan, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-first-write-evidence-plan-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportFirstWriteCandidateSelection() {
    const exportedSelection = createFirstWriteCandidateSelectionExport();
    const json = JSON.stringify(exportedSelection, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-first-write-candidate-selection-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportLightingDryRunPreview() {
    const exportedPreview = createLightingDryRunExport(profile);
    const json = JSON.stringify(exportedPreview, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-lighting-dry-run-preview-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportControlledLightingWriteEvidence() {
    const exportedEvidence = createControlledLightingWriteExport({ state: controlledLightingWriteState });
    const json = JSON.stringify(exportedEvidence, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-wp21-lighting-write-evidence-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportFunctionalLightingWriteEvidence() {
    const exportedEvidence = createFunctionalLightingWriteExport({
      state: functionalLightingWriteState,
      settings: functionalLightingSettings,
    });
    const json = JSON.stringify(exportedEvidence, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ak680-wp22-functional-lighting-evidence-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function runControlledDeviceInfoRead() {
    const selectedInterface = controlledReadState.selectedInterface;
    const request = createControlledReadBackendRequest(selectedInterface);

    if (!controlledReadState.canRun || !request) {
      return;
    }

    const confirmed = window.confirm(
      [
        "Run exactly one controlled device-info read/query?",
        "",
        "Command scope: AA 10 30 only.",
        "Report ID: 0.",
        "Request length: 64 bytes.",
        "Target: AK680 V2 VID/PID 3141/32956.",
        "Required interface metadata: usagePage 65384, usage 97.",
        "",
        "This does not apply, sync, save to device, or change keyboard settings.",
      ].join("\n"),
    );

    if (!confirmed) {
      setControlledReadResult(createCanceledControlledReadResult({ selectedInterface }));
      return;
    }

    try {
      const backendResult = await invoke<ControlledReadBackendResult>("run_controlled_device_info_read", { request });
      setControlledReadResult(createControlledReadResultFromBackend({ backendResult, selectedInterface }));
    } catch (error) {
      setControlledReadResult(
        createControlledReadResultFromBackend({
          selectedInterface,
          backendResult: {
            status: "error",
            message: error instanceof Error ? error.message : String(error),
            reportId: 0,
            requestLength: 64,
            responseLength: 0,
            responseBytes: [],
          },
        }),
      );
    }
  }

  async function runControlledLightingWrite() {
    const selectedInterface = controlledLightingWriteState.selectedInterface;
    const request = createControlledLightingWriteBackendRequest(
      selectedInterface,
      controlledLightingWriteState.manualConfirmation,
    );

    if (!controlledLightingWriteState.canRun || !request) {
      return;
    }

    const confirmed = window.confirm(
      [
        "Run the WP21 experimental one-shot lighting write?",
        "",
        "This may change keyboard lighting.",
        "This is experimental and not full lighting support.",
        "Exactly one packet will be attempted.",
        "No automatic rollback will occur.",
        "Recovery/rollback is manual.",
        "",
        `Report ID: ${CONTROLLED_LIGHTING_WRITE_REPORT_ID}.`,
        `Packet length: ${CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH} bytes.`,
        "Target: AK680 V2 VID/PID 3141/32956.",
        "Required interface metadata: usagePage 65384, usage 97.",
        `Selected path/interface: ${selectedInterface?.path ?? "None"}.`,
        "",
        CONTROLLED_LIGHTING_WRITE_PACKET_HEX,
      ].join("\n"),
    );

    if (!confirmed) {
      setControlledLightingWriteResult(createCanceledControlledLightingWriteResult({ selectedInterface }));
      setControlledLightingWriteConfirmed(false);
      return;
    }

    try {
      const backendResult = await invoke<ControlledLightingWriteBackendResult>("run_controlled_lighting_write", {
        request,
      });
      setControlledLightingWriteResult(
        createControlledLightingWriteResultFromBackend({ backendResult, selectedInterface }),
      );
    } catch (error) {
      setControlledLightingWriteResult(
        createControlledLightingWriteResultFromBackend({
          selectedInterface,
          backendResult: {
            status: "failure",
            message: error instanceof Error ? error.message : String(error),
            reportId: CONTROLLED_LIGHTING_WRITE_REPORT_ID,
            packetLength: CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH,
            attemptedPacket: CONTROLLED_LIGHTING_WRITE_PACKET_BYTES,
            writeAttemptCount: 0,
            retryCount: 0,
            followUpPacketCount: 0,
          },
        }),
      );
    } finally {
      setControlledLightingWriteConfirmed(false);
    }
  }

  async function runFunctionalLightingWrite() {
    const selectedInterface = functionalLightingWriteState.selectedInterface;
    const packet = buildFunctionalLightingPacket(functionalLightingSettings);
    const packetHex = packet.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
    const request = createFunctionalLightingWriteBackendRequest(
      selectedInterface,
      functionalLightingWriteState.manualConfirmation,
      functionalLightingSettings,
    );

    if (!functionalLightingWriteState.canRun || !request) {
      return;
    }

    const confirmed = window.confirm(
      [
        "Write lighting to AK680 V2?",
        "",
        "This writes keyboard lighting using the approved AA 23 10 global lighting packet family.",
        "It is not profile apply, sync, save-to-device, or arbitrary packet execution.",
        "One packet will be attempted. No retry, polling, probing, hidden follow-up, or automatic rollback.",
        "",
        `RGB: ${functionalLightingSettings.red}, ${functionalLightingSettings.green}, ${functionalLightingSettings.blue}.`,
        `Brightness: ${functionalLightingSettings.brightness}.`,
        `Speed: ${functionalLightingSettings.speed}.`,
        `Direction: ${functionalLightingSettings.direction}.`,
        `Color mode/effect: ${functionalLightingSettings.colorMode}.`,
        `Report ID: ${CONTROLLED_LIGHTING_WRITE_REPORT_ID}.`,
        `Packet length: ${CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH} bytes.`,
        "Target: AK680 V2 VID/PID 3141/32956.",
        "Required interface metadata: usagePage 65384, usage 97.",
        `Selected path/interface: ${selectedInterface?.path ?? "None"}.`,
        "",
        packetHex,
      ].join("\n"),
    );

    if (!confirmed) {
      setFunctionalLightingResult(createCanceledControlledLightingWriteResult({ selectedInterface }));
      setFunctionalLightingConfirmed(false);
      return;
    }

    try {
      const backendResult = await invoke<ControlledLightingWriteBackendResult>("run_functional_lighting_write", {
        request,
      });
      setFunctionalLightingResult(
        createControlledLightingWriteResultFromBackend({ backendResult, selectedInterface }),
      );
    } catch (error) {
      setFunctionalLightingResult(
        createControlledLightingWriteResultFromBackend({
          selectedInterface,
          backendResult: {
            status: "failure",
            message: error instanceof Error ? error.message : String(error),
            reportId: CONTROLLED_LIGHTING_WRITE_REPORT_ID,
            packetLength: CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH,
            attemptedPacket: packet,
            writeAttemptCount: 0,
            retryCount: 0,
            followUpPacketCount: 0,
          },
        }),
      );
    } finally {
      setFunctionalLightingConfirmed(false);
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
                <p className="text-xs text-slate-600">Public alpha, gated lighting writes</p>
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
              onEditImported={startEditingImportedProfile}
              onEditSaved={startEditingSavedProfile}
              onSelectActive={selectActiveLocalProfile}
              onRename={renameLocalProfile}
              onDelete={deleteLocalProfile}
              onExport={exportLocalProfile}
              onExportBackup={exportProfileLibraryBackup}
              onRestoreBackup={restoreProfileLibraryBackup}
            />
          )}
          {activeScreen === "editor" && (
            <LocalEditor
              importedProfile={importedProfile}
              localProfileStorage={localProfileStorage}
              editorSession={editorSession}
              validation={editorValidation}
              diff={editorDiff}
              onStartImported={startEditingImportedProfile}
              onStartSaved={startEditingSavedProfile}
              onUpdateSession={setEditorSession}
              onExportEdited={exportEditedProfile}
              onSaveAsNew={saveEditedProfileAsNew}
              onUpdateExisting={updateEditedSavedProfile}
            />
          )}
          {activeScreen === "write-safety" && (
            <WriteSafety
              dryRunPlan={dryRunPlan}
              hidDetection={hidDetection}
              onExportPlan={exportDryRunPlan}
              onOpenEditor={() => setActiveScreen("editor")}
              onRefreshDetection={refreshHidDetection}
            />
          )}
          {activeScreen === "import" && (
            <ProfileImport
              importedProfile={importedProfile}
              setImportedProfile={setImportedProfile}
              onSaveImported={saveImportedProfileLocally}
              onEditImported={startEditingImportedProfile}
            />
          )}
          {activeScreen === "inspector" && <ProfileInspector profile={profile} importedProfile={importedProfile} />}
          {activeScreen === "layout" && <KeyboardLayout profile={profile} />}
          {activeScreen === "lighting" && (
            <Lighting
              profile={profile}
              hidDetection={hidDetection}
              controlledLightingWriteState={controlledLightingWriteState}
              functionalLightingWriteState={functionalLightingWriteState}
              functionalLightingSettings={functionalLightingSettings}
              onFunctionalLightingSettingsChange={setFunctionalLightingSettings}
              controlledLightingWriteSelectedPath={controlledLightingWriteSelectedPath}
              onControlledLightingWriteSelectedPathChange={setControlledLightingWriteSelectedPath}
              controlledLightingWriteConfirmed={controlledLightingWriteConfirmed}
              onControlledLightingWriteConfirmedChange={setControlledLightingWriteConfirmed}
              functionalLightingConfirmed={functionalLightingConfirmed}
              onFunctionalLightingConfirmedChange={setFunctionalLightingConfirmed}
              onRunControlledLightingWrite={runControlledLightingWrite}
              onRunFunctionalLightingWrite={runFunctionalLightingWrite}
              onExportDryRunPreview={exportLightingDryRunPreview}
              onExportControlledLightingWriteEvidence={exportControlledLightingWriteEvidence}
              onExportFunctionalLightingWriteEvidence={exportFunctionalLightingWriteEvidence}
              onRefreshDetection={refreshHidDetection}
            />
          )}
          {activeScreen === "rapid-trigger" && <RapidTrigger profile={profile} />}
          {activeScreen === "macros" && <Macros profile={profile} />}
          {activeScreen === "protocol" && (
            <ProtocolResearch
              importedProfile={importedProfile}
              hidDetection={hidDetection}
              localProfileStorage={localProfileStorage}
              controlledReadState={controlledReadState}
              controlledReadSelectedPath={controlledReadSelectedPath}
              onControlledReadSelectedPathChange={setControlledReadSelectedPath}
              onRunControlledDeviceInfoRead={runControlledDeviceInfoRead}
              onExportControlledReadStatus={exportControlledReadStatus}
              onExportCandidateQueryDossier={exportCandidateQueryDossier}
              onExportHardwareSmokeTestTemplate={exportHardwareSmokeTestTemplate}
              onExportReadProtocolEvidencePack={exportReadProtocolEvidencePack}
              onExportReadOnlySnapshot={exportReadOnlySnapshot}
              onExportFirstWriteEvidencePlan={exportFirstWriteEvidencePlan}
              onExportFirstWriteCandidateSelection={exportFirstWriteCandidateSelection}
              onRefresh={refreshHidDetection}
              onExportSnapshot={exportProtocolDiagnosticsSnapshot}
            />
          )}
          {activeScreen === "diagnostics" && (
            <Diagnostics
              importedProfile={importedProfile}
              hidDetection={hidDetection}
              localProfileStorage={localProfileStorage}
              editorSession={editorSession}
              editorValidation={editorValidation}
              editorDiff={editorDiff}
              dryRunPlan={dryRunPlan}
              controlledReadState={controlledReadState}
              controlledLightingWriteState={controlledLightingWriteState}
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
          <p className="font-bold text-ink">Public alpha, local-only, and gated lighting writes</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            AK680 Studio is an unofficial community project for the AJAZZ AK680 V2. It is not affiliated with,
            endorsed by, or maintained by AJAZZ. This alpha stores data locally, enumerates HID devices with
            read-only metadata, allows one approved controlled device-info read/query, and writes only AK680 V2 global
            lighting through the gated WP22 packet family.
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
  const officialProfile = inspectOfficialProfile(profile);
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
            { label: "SOCD keys", value: officialProfile.summary.socdCount },
            { label: "Active RT keys", value: officialProfile.summary.activeRtCount },
            { label: "Custom LED slots", value: officialProfile.summary.customLedCount },
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
              locally. The only hardware-write path is the manually gated WP21 fixed-packet lighting experiment. It
              has no cloud sync, no account system, no firmware tools, and no embedded vendor website.
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
  onEditImported,
}: {
  importedProfile: ImportedProfile;
  setImportedProfile: (profile: ImportedProfile) => void;
  onSaveImported: () => void;
  onEditImported: () => void;
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onEditImported}
                disabled={!importedProfile.validation.valid}
                className="inline-flex items-center justify-center rounded border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60"
              >
                Edit Local Copy
              </button>
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
  onEditImported,
  onEditSaved,
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
  onEditImported: () => void;
  onEditSaved: (profileId: string) => void;
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onEditImported}
                disabled={!importedProfile.validation.valid}
                className="inline-flex items-center justify-center rounded border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60"
              >
                Edit Local Copy
              </button>
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
                onEdit={onEditSaved}
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
  onEdit,
}: {
  savedProfile: SavedLocalProfile;
  active: boolean;
  onSelectActive: (profileId: string) => void;
  onRename: (profileId: string) => void;
  onDelete: (profileId: string) => void;
  onExport: (profileId: string) => void;
  onEdit: (profileId: string) => void;
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
          <button type="button" className="rounded border border-line px-3 py-2 text-sm" onClick={() => onEdit(savedProfile.id)}>
            Edit Local Copy
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

function WriteSafety({
  dryRunPlan,
  hidDetection,
  onExportPlan,
  onOpenEditor,
  onRefreshDetection,
}: {
  dryRunPlan: DryRunPlan;
  hidDetection: HidDetectionState;
  onExportPlan: () => void;
  onOpenEditor: () => void;
  onRefreshDetection: () => Promise<void>;
}) {
  const exportDisabled = dryRunPlan.status === "no-input" || dryRunPlan.status === "invalid";

  return (
    <>
      <PageHeader title="Write Safety" eyebrow="Dry-run planner" />
      <Section title="Dry-Run Warning">
        <div className="rounded border border-copper/40 bg-copper/10 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
            <div>
              <p className="font-bold text-ink">Dry-run only: no packets are sent and the keyboard is not changed</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                This screen previews abstract operation categories from the WP7 local editor. It exports local planning
                JSON only. Real hardware writes require a future work package, backup-before-write design, explicit
                maintainer approval, and Red Team review.
              </p>
            </div>
          </div>
        </div>
      </Section>
      <Section title="Planner Input">
        <div className="rounded border border-line bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-lg font-bold text-ink">{getDryRunStatusTitle(dryRunPlan)}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Source: {dryRunPlan.sourceLabel}. {summarizeOperations(dryRunPlan.operations)}
              </p>
              {dryRunPlan.validation.errors.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-700">
                  {dryRunPlan.validation.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenEditor}
                className="rounded border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cloud"
              >
                Open Local Editor
              </button>
              <button
                type="button"
                onClick={() => {
                  void onRefreshDetection();
                }}
                disabled={hidDetection.status === "checking"}
                className="rounded border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60"
              >
                {hidDetection.status === "checking" ? "Refreshing..." : "Refresh Detection"}
              </button>
            </div>
          </div>
        </div>
      </Section>
      {dryRunPlan.status === "no-input" ? (
        <EmptyState message="No active WP7 local edit session is available. Start a valid edit in Local Editor to generate a dry-run plan." />
      ) : (
        <>
          <Section title="Original vs Edited Profile">
            <div className="grid gap-4 lg:grid-cols-2">
              <ProfileSummaryPanel title="Original/source profile" summary={dryRunPlan.originalProfile} />
              <ProfileSummaryPanel title="Edited local profile" summary={dryRunPlan.editedProfile} />
            </div>
          </Section>
          <Section title="Abstract Operation Summary">
            <OperationSummaryTable operations={dryRunPlan.operations} />
          </Section>
          <Section title="Device Compatibility and Safety Checklist">
            <ChecklistList checklist={dryRunPlan.checklist} />
          </Section>
          <Section title="Backup-Before-Write Future Gate">
            <div className="rounded border border-line bg-white p-5 text-sm leading-6 text-slate-700">
              A current local backup is required before any future hardware-write work. In WP8 this is a planning gate
              only: backup status does not unlock writing, and hardware write support remains not implemented.
            </div>
          </Section>
          <Section title="Planner Actions">
            <div className="flex flex-wrap gap-2 rounded border border-line bg-white p-5">
              <button
                type="button"
                onClick={onExportPlan}
                disabled={exportDisabled}
                className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
              >
                Export Dry-Run Plan
              </button>
              <button
                type="button"
                disabled
                className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 opacity-60"
              >
                Future Hardware Write: Not Implemented
              </button>
            </div>
          </Section>
        </>
      )}
    </>
  );
}

function ProfileSummaryPanel({ title, summary }: { title: string; summary?: DryRunPlan["originalProfile"] }) {
  if (!summary) {
    return <EmptyState message={`${title} is not available.`} />;
  }

  return (
    <div className="rounded border border-line bg-white p-5">
      <h3 className="mb-3 text-base font-bold text-ink">{title}</h3>
      <InfoGrid
        items={[
          { label: "Profile name", value: summary.profileName },
          { label: "Device ID", value: summary.deviceId },
          { label: "Keys", value: summary.keyCount },
          { label: "User key overrides", value: summary.userKeyCount },
          { label: "RT records", value: summary.rtRecords },
          { label: "Macro records", value: summary.macroRecords },
        ]}
      />
    </div>
  );
}

function OperationSummaryTable({ operations }: { operations: DryRunPlan["operations"] }) {
  if (operations.length === 0) {
    return <EmptyState message="No abstract operations are available until a local edit session exists." />;
  }

  return (
    <div className="overflow-x-auto rounded border border-line bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-cloud text-xs uppercase tracking-wide text-moss">
          <tr>
            <th className="border-b border-line px-3 py-3">Category</th>
            <th className="border-b border-line px-3 py-3">Changed</th>
            <th className="border-b border-line px-3 py-3">Count</th>
            <th className="border-b border-line px-3 py-3">Abstract summary</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((operation) => (
            <tr key={operation.category}>
              <td className="border-b border-line px-3 py-3 font-semibold">{operation.label}</td>
              <td className="border-b border-line px-3 py-3">{operation.changed ? "Yes" : "No"}</td>
              <td className="border-b border-line px-3 py-3">{operation.changeCount}</td>
              <td className="border-b border-line px-3 py-3">{operation.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChecklistList({ checklist }: { checklist: DryRunPlan["checklist"] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {checklist.map((item) => (
        <div key={item.label} className="rounded border border-line bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-ink">{item.label}</p>
            <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase ${getChecklistClass(item.status)}`}>
              {item.status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

function getChecklistClass(status: DryRunPlan["checklist"][number]["status"]) {
  switch (status) {
    case "pass":
      return "border-moss/40 bg-moss/10 text-moss";
    case "blocked":
      return "border-red-300 bg-red-50 text-red-700";
    case "warn":
      return "border-copper/40 bg-copper/10 text-copper";
    case "info":
    default:
      return "border-line bg-cloud text-slate-700";
  }
}

function getControlledReadGateClass(status: ControlledReadExperimentState["gates"][number]["status"]) {
  switch (status) {
    case "pass":
      return "border-moss/40 bg-moss/10 text-moss";
    case "blocked":
      return "border-red-300 bg-red-50 text-red-700";
    case "info":
    default:
      return "border-line bg-white text-slate-700";
  }
}

function getDryRunStatusTitle(plan: DryRunPlan) {
  switch (plan.status) {
    case "ready":
      return "Valid dry-run plan ready for local export";
    case "no-changes":
      return "Valid local profile with no detected changes";
    case "invalid":
      return "Dry-run plan blocked by invalid local edit";
    case "no-input":
    default:
      return "No local edited profile selected";
  }
}

function LocalEditor({
  importedProfile,
  localProfileStorage,
  editorSession,
  validation,
  diff,
  onStartImported,
  onStartSaved,
  onUpdateSession,
  onExportEdited,
  onSaveAsNew,
  onUpdateExisting,
}: {
  importedProfile: ImportedProfile;
  localProfileStorage: LocalProfileStorageState;
  editorSession?: LocalEditorSession;
  validation: EditorValidation;
  diff: EditorDiffSummary;
  onStartImported: () => void;
  onStartSaved: (profileId: string) => void;
  onUpdateSession: (session: LocalEditorSession | undefined) => void;
  onExportEdited: () => void;
  onSaveAsNew: () => void;
  onUpdateExisting: () => void;
}) {
  const keyEntries = editorSession ? getEditableKeyEntries(editorSession.workingProfile) : [];
  const firstAxis = editorSession ? getFirstEditableMagneticAxis(editorSession.workingProfile) : undefined;
  const gameMode = editorSession?.workingProfile.gameModeInfo;
  const lighting = editorSession?.workingProfile.ledEffect;

  function resetEdits() {
    if (!editorSession) {
      return;
    }

    if (diff.changed && !window.confirm("Discard all unsaved local edits and reset to the original profile copy?")) {
      return;
    }

    onUpdateSession(resetEditorSession(editorSession));
  }

  return (
    <>
      <PageHeader title="Local Editor" eyebrow="Local profile JSON editing" />
      <Section title="Local-Only Safety Notice">
        <div className="rounded border border-copper/40 bg-copper/10 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
            <div>
              <p className="font-bold text-ink">Edits stay in local profile JSON</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                This editor works on a deep-cloned local copy. It can export JSON, save a new local profile, or update a
                saved local profile after confirmation. It does not change the keyboard, send HID packets, or provide
                apply/sync/save-to-device behavior.
              </p>
            </div>
          </div>
        </div>
      </Section>
      <Section title="Start Editing">
        <div className="rounded border border-line bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="font-semibold text-ink">Current imported profile</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Source: {importedProfile.sourceName}. Invalid imports cannot start a local edit session.
              </p>
              <button
                type="button"
                onClick={onStartImported}
                disabled={!importedProfile.validation.valid}
                className="mt-3 inline-flex items-center justify-center rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
              >
                Edit Imported Copy
              </button>
            </div>
            <div>
              <p className="font-semibold text-ink">Saved local profiles</p>
              {localProfileStorage.profiles.length === 0 ? (
                <p className="mt-1 text-sm leading-6 text-slate-600">No saved local profiles are available.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {localProfileStorage.profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => onStartSaved(profile.id)}
                      className="rounded border border-line px-3 py-2 text-sm transition hover:bg-cloud"
                    >
                      {profile.displayName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>
      {!editorSession ? (
        <EmptyState message="Start from a valid imported profile or a saved local profile to edit a cloned local copy." />
      ) : (
        <>
          <Section title="Edit Session">
            <InfoGrid
              items={[
                { label: "Source", value: editorSession.source.label },
                { label: "Source type", value: editorSession.source.kind === "saved" ? "Saved local profile" : "Imported profile" },
                { label: "Validation", value: validation.valid ? "Valid for local export/save" : "Blocked until errors are fixed" },
                { label: "Unsaved local changes", value: diff.changed ? "Yes" : "No" },
                { label: "Changed keys", value: diff.keymapChangedCount },
                { label: "RT/actuation", value: diff.rtStatus },
                { label: "SOCD/game mode", value: diff.gameModeStatus },
                { label: "Lighting", value: diff.lightingStatus },
                { label: "Macros", value: diff.macroStatus },
              ]}
            />
          </Section>
          {!validation.valid && (
            <Section title="Validation Errors">
              <ul className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                {validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </Section>
          )}
          <Section title="Profile Name">
            <label className="block rounded border border-line bg-white p-4 text-sm font-semibold text-ink">
              Local profile name
              <input
                className="mt-2 w-full rounded border border-line px-3 py-2 text-sm font-normal"
                value={editorSession.workingProfile.profileName}
                onChange={(event) => onUpdateSession(setEditorProfileName(editorSession, event.target.value))}
              />
            </label>
          </Section>
          <Section title="Keymap Local Editing">
            {keyEntries.length === 0 ? (
              <EmptyState message="This profile does not include a keyList section. Other sections remain editable where present." />
            ) : (
              <div className="overflow-x-auto rounded border border-line bg-white">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-cloud text-xs uppercase tracking-wide text-moss">
                    <tr>
                      <th className="border-b border-line px-3 py-3">Position</th>
                      <th className="border-b border-line px-3 py-3">Physical key</th>
                      <th className="border-b border-line px-3 py-3">Local assignment name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keyEntries.map((key) => (
                      <tr key={`${key.rowIndex}-${key.keyIndex}`}>
                        <td className="border-b border-line px-3 py-3">
                          Row {key.rowIndex + 1}, key {key.keyIndex + 1}
                        </td>
                        <td className="border-b border-line px-3 py-3 font-semibold">{key.label}</td>
                        <td className="border-b border-line px-3 py-3">
                          <input
                            className="w-full min-w-40 rounded border border-line px-3 py-2"
                            value={key.assignment}
                            placeholder="Default"
                            onChange={(event) =>
                              onUpdateSession(
                                setKeyUserAssignment(editorSession, key.rowIndex, key.keyIndex, event.target.value),
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
          <Section title="RT / Actuation Local Editing">
            {!firstAxis ? (
              <EmptyState message="This profile does not include editable magneticAxisRT records. The missing section is preserved." />
            ) : (
              <NumberFieldGrid
                fields={[
                  ["pressRT", "Press RT"],
                  ["releaseRT", "Release RT"],
                  ["triggerKeyStroke", "Trigger keystroke"],
                ]}
                source={firstAxis}
                onChange={(field, value) =>
                  onUpdateSession(
                    setFirstMagneticAxisValue(
                      editorSession,
                      field as "pressRT" | "releaseRT" | "triggerKeyStroke",
                      value,
                    ),
                  )
                }
              />
            )}
          </Section>
          <Section title="SOCD / Game Mode Local Editing">
            {!gameMode ? (
              <EmptyState message="This profile does not include gameModeInfo. The missing section is preserved." />
            ) : (
              <NumberFieldGrid
                fields={[
                  ["reportRate", "Report rate"],
                  ["keyDelay", "Key delay"],
                  ["sleepTime", "Sleep time"],
                ]}
                source={gameMode}
                onChange={(field, value) =>
                  onUpdateSession(setGameModeValue(editorSession, field as "reportRate" | "keyDelay" | "sleepTime", value))
                }
              />
            )}
          </Section>
          <Section title="Lighting Local Editing">
            {!lighting ? (
              <EmptyState message="This profile does not include ledEffect data. The missing section is preserved." />
            ) : (
              <NumberFieldGrid
                fields={[
                  ["mode", "Mode"],
                  ["brightness", "Brightness"],
                  ["speed", "Speed"],
                  ["red", "Red"],
                  ["green", "Green"],
                  ["blue", "Blue"],
                ]}
                source={lighting}
                onChange={(field, value) =>
                  onUpdateSession(
                    setLightingValue(
                      editorSession,
                      field as "mode" | "brightness" | "speed" | "red" | "green" | "blue",
                      value,
                    ),
                  )
                }
              />
            )}
          </Section>
          <Section title="Macro Preservation">
            <div className="rounded border border-line bg-white p-5 text-sm leading-6 text-slate-700">
              Macro editing is not implemented in this public alpha. The editor validates that macroDataList remains
              exactly preserved before local export, save-as-new, or update.
            </div>
          </Section>
          <Section title="Local Edit Actions">
            <div className="flex flex-wrap gap-2 rounded border border-line bg-white p-5">
              <button
                type="button"
                onClick={onExportEdited}
                disabled={!validation.valid}
                className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
              >
                Export Edited JSON
              </button>
              <button
                type="button"
                onClick={onSaveAsNew}
                disabled={!validation.valid}
                className="rounded border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save as New Local Profile
              </button>
              <button
                type="button"
                onClick={onUpdateExisting}
                disabled={!validation.valid || editorSession.source.kind !== "saved"}
                className="rounded border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60"
              >
                Update Existing Local Profile
              </button>
              <button
                type="button"
                onClick={resetEdits}
                className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
              >
                Discard Local Edits
              </button>
            </div>
          </Section>
        </>
      )}
    </>
  );
}

function NumberFieldGrid({
  fields,
  source,
  onChange,
}: {
  fields: Array<[string, string]>;
  source: Record<string, unknown>;
  onChange: (field: string, value: number) => void;
}) {
  return (
    <div className="grid gap-3 rounded border border-line bg-white p-4 md:grid-cols-3">
      {fields.map(([field, label]) => (
        <label key={field} className="text-sm font-semibold text-ink">
          {label}
          <input
            type="number"
            className="mt-2 w-full rounded border border-line px-3 py-2 text-sm font-normal"
            value={typeof source[field] === "number" ? source[field] : ""}
            onChange={(event) => onChange(field, Number(event.target.value))}
          />
        </label>
      ))}
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
  const officialProfile = inspectOfficialProfile(profile);
  const gameMode = getGameModeSummary(profile);
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
                { label: "Key rows / keys", value: `${officialProfile.summary.keyRows} / ${officialProfile.summary.keyCount}` },
                { label: "SOCD assignments", value: officialProfile.summary.socdCount },
                { label: "Active RT keys", value: officialProfile.summary.activeRtCount },
                { label: "Custom LED slots", value: officialProfile.summary.customLedCount },
                { label: "Local-only status", value: "Imported profile JSON only" },
              ]}
            />
          </Section>
          <Section title="Official Profile Sections">
            <InfoGrid
              items={[
                { label: "gameModeInfo", value: profile.gameModeInfo ? "Present" : "Missing" },
                { label: "ledEffect", value: profile.ledEffect ? "Present" : "Missing" },
                { label: "customLedData", value: Array.isArray(profile.customLedData) ? `${profile.customLedData.length} records` : "Missing" },
                { label: "macroDataList", value: Array.isArray(profile.macroDataList) ? `${profile.macroDataList.length} records` : "Missing" },
                { label: "magneticAxisRT", value: Array.isArray(profile.magneticAxisRT) ? `${profile.magneticAxisRT.length} records` : "Missing" },
                {
                  label: "magneticAxisRTConfig",
                  value: Array.isArray(profile.magneticAxisRTConfig) ? `${profile.magneticAxisRTConfig.length} records` : profile.magneticAxisRTConfig ? "Present" : "Missing",
                },
                { label: "magneticAxisDKS", value: Array.isArray(profile.magneticAxisDKS) ? `${profile.magneticAxisDKS.length} records` : profile.magneticAxisDKS ? "Present" : "Missing" },
              ]}
            />
          </Section>
          <Section title="Profile Model Warnings">
            {officialProfile.warnings.length === 0 ? (
              <p className="rounded border border-line bg-white p-4 text-sm text-slate-700">
                Official AK680 V2 profile sections are present. This is local profile data, not live device state.
              </p>
            ) : (
              <ul className="grid gap-2">
                {officialProfile.warnings.map((warning) => (
                  <li key={warning} className="rounded border border-line bg-white px-3 py-2 text-sm text-slate-700">
                    {warning}
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="SOCD Assignments">
            {officialProfile.socdAssignments.length === 0 ? (
              <EmptyState message="No SOCD assignments were found in keyList userKey.page data." />
            ) : (
              <InfoGrid
                items={officialProfile.socdAssignments.map((entry) => ({
                  label: `${entry.name} (${entry.key})`,
                  value: `value ${entry.value}; page ${entry.userKey.page}; params ${entry.userKey.param1 ?? "n/a"} / ${entry.userKey.param2 ?? "n/a"} / ${entry.userKey.param3 ?? "n/a"}`,
                }))}
              />
            )}
          </Section>
          <Section title="Device Info">
            <JsonPreview data={profile.deviceInfo} />
          </Section>
          <Section title="Game Mode Info">
            <InfoGrid
              items={[
                { label: "Game mode", value: gameMode.gameMode },
                { label: "Report rate", value: gameMode.reportRate },
                { label: "Key delay", value: gameMode.keyDelay },
                { label: "Sleep time", value: gameMode.sleepTime },
                { label: "Stability mode", value: gameMode.stabilityMode },
                { label: "Auto calibration", value: gameMode.autoCalibration },
              ]}
            />
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
      {keyboardKey.userKey?.page === "SOCD" && (
        <span className="w-fit rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">SOCD</span>
      )}
    </div>
  );
}

function Lighting({
  profile,
  hidDetection,
  controlledLightingWriteState,
  functionalLightingWriteState,
  functionalLightingSettings,
  onFunctionalLightingSettingsChange,
  controlledLightingWriteSelectedPath,
  onControlledLightingWriteSelectedPathChange,
  controlledLightingWriteConfirmed,
  onControlledLightingWriteConfirmedChange,
  functionalLightingConfirmed,
  onFunctionalLightingConfirmedChange,
  onRunControlledLightingWrite,
  onRunFunctionalLightingWrite,
  onExportDryRunPreview,
  onExportControlledLightingWriteEvidence,
  onExportFunctionalLightingWriteEvidence,
  onRefreshDetection,
}: {
  profile?: AjazzProfile;
  hidDetection: HidDetectionState;
  controlledLightingWriteState: ControlledLightingWriteExperimentState;
  functionalLightingWriteState: ControlledLightingWriteExperimentState;
  functionalLightingSettings: FunctionalLightingSettings;
  onFunctionalLightingSettingsChange: (settings: FunctionalLightingSettings) => void;
  controlledLightingWriteSelectedPath: string;
  onControlledLightingWriteSelectedPathChange: (path: string) => void;
  controlledLightingWriteConfirmed: boolean;
  onControlledLightingWriteConfirmedChange: (confirmed: boolean) => void;
  functionalLightingConfirmed: boolean;
  onFunctionalLightingConfirmedChange: (confirmed: boolean) => void;
  onRunControlledLightingWrite: () => Promise<void>;
  onRunFunctionalLightingWrite: () => Promise<void>;
  onExportDryRunPreview: () => void;
  onExportControlledLightingWriteEvidence: () => void;
  onExportFunctionalLightingWriteEvidence: () => void;
  onRefreshDetection: () => Promise<void>;
}) {
  const lighting = getLightingSummary(profile);
  const dryRunPlan = createLightingDryRunPlan(profile);
  const writeInterfaces = getControlledLightingWriteCandidateInterfaces(hidDetection.result);
  const functionalPacket = buildFunctionalLightingPacket(functionalLightingSettings);
  const functionalPacketHex = functionalPacket.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
  const updateLightingSetting = (key: keyof FunctionalLightingSettings, value: number) => {
    onFunctionalLightingSettingsChange({
      ...functionalLightingSettings,
      [key]: Math.min(255, Math.max(0, Number.isFinite(value) ? Math.round(value) : 0)),
    });
    onFunctionalLightingConfirmedChange(false);
  };
  return (
    <>
      <PageHeader title="Lighting" eyebrow="LED data summary" />
      <Section title="Official Lighting Summary">
        <InfoGrid
          items={[
            { label: "Mode", value: lighting.mode },
            { label: "Primary color", value: lighting.color },
            { label: "Secondary color", value: lighting.secondaryColor },
            { label: "Brightness", value: lighting.brightness },
            { label: "Speed", value: lighting.speed },
            { label: "Direction", value: lighting.direction },
            { label: "Color mode", value: lighting.colorMode },
            { label: "Custom LED slots", value: lighting.customLedCount },
            { label: "Custom LED active RGB slots", value: lighting.activeCustomLedCount },
            { label: "Global lighting writes", value: "Available for AK680 V2 through WP22 gated packet family" },
          ]}
        />
      </Section>
      <Section title="Functional Global Lighting">
        <div className="space-y-4">
          <div className="rounded border border-copper/40 bg-copper/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
              <div>
                <p className="font-bold text-ink">Writes keyboard lighting only</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  WP22 writes global lighting through the approved AA 23 10 packet family for AK680 V2 only. Only RGB,
                  brightness, speed, direction, and color mode/effect can vary. This is not profile apply, sync,
                  save-to-device, raw packet entry, a packet editor, or unrelated setting writes.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded border border-line bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <label className="block flex-1">
                <span className="text-sm font-semibold text-ink">Exact AK680 V2 HID path/interface</span>
                <select
                  value={controlledLightingWriteSelectedPath}
                  onChange={(event) => {
                    onControlledLightingWriteSelectedPathChange(event.target.value);
                    onFunctionalLightingConfirmedChange(false);
                    onControlledLightingWriteConfirmedChange(false);
                  }}
                  className="mt-2 w-full rounded border border-line bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select target interface</option>
                  {writeInterfaces.map((device) => (
                    <option key={device.path ?? "unknown-path"} value={device.path ?? ""}>
                      {device.path} | usagePage {device.usagePage ?? "n/a"} / usage {device.usage ?? "n/a"}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  void onRefreshDetection();
                }}
                disabled={hidDetection.status === "checking"}
                className="rounded border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60"
              >
                {hidDetection.status === "checking" ? "Refreshing..." : "Refresh Metadata"}
              </button>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Lighting controls</p>
              <label className="mt-3 block text-sm font-semibold text-ink">
                RGB color
                <input
                  type="color"
                  value={`#${functionalLightingSettings.red.toString(16).padStart(2, "0")}${functionalLightingSettings.green.toString(16).padStart(2, "0")}${functionalLightingSettings.blue.toString(16).padStart(2, "0")}`}
                  onChange={(event) => {
                    const hex = event.target.value.slice(1);
                    onFunctionalLightingSettingsChange({
                      ...functionalLightingSettings,
                      red: Number.parseInt(hex.slice(0, 2), 16),
                      green: Number.parseInt(hex.slice(2, 4), 16),
                      blue: Number.parseInt(hex.slice(4, 6), 16),
                    });
                    onFunctionalLightingConfirmedChange(false);
                  }}
                  className="mt-2 h-10 w-full rounded border border-line bg-white px-2"
                />
              </label>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(["red", "green", "blue", "brightness", "speed", "direction", "colorMode"] as const).map((key) => (
                  <label key={key} className="block text-sm font-semibold text-ink">
                    {key}
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={functionalLightingSettings[key]}
                      onChange={(event) => updateLightingSetting(key, Number(event.target.value))}
                      className="mt-2 w-full rounded border border-line px-3 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Generated packet preview</p>
              <InfoGrid
                items={[
                  { label: "Target", value: "AK680 V2 only" },
                  { label: "VID/PID", value: "3141 / 32956" },
                  { label: "Required usagePage / usage", value: "65384 / 97" },
                  { label: "Report ID", value: CONTROLLED_LIGHTING_WRITE_REPORT_ID },
                  { label: "Packet length", value: `${CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH} bytes` },
                  { label: "Variable bytes", value: "8, 9, 10, 11, 12, 17, 18 only" },
                  { label: "Retry count", value: 0 },
                  { label: "Follow-up packet count", value: 0 },
                ]}
              />
              <pre className="mt-3 max-h-44 overflow-auto rounded border border-line bg-cloud p-3 text-xs leading-6 text-slate-800">
                {functionalPacketHex}
              </pre>
            </div>
          </div>
          <div className="rounded border border-line bg-white p-5">
            <p className="font-semibold text-ink">Functional write gates</p>
            <ul className="mt-3 grid gap-2">
              {functionalLightingWriteState.gates.map((gate) => (
                <li key={gate.label} className="rounded border border-line bg-cloud px-3 py-2 text-sm text-slate-700">
                  <span className="font-semibold text-ink">{gate.label}: </span>
                  {gate.status} - {gate.detail}
                </li>
              ))}
            </ul>
            <label className="mt-4 flex items-start gap-3 rounded border border-copper/40 bg-copper/10 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={functionalLightingConfirmed}
                onChange={(event) => onFunctionalLightingConfirmedChange(event.target.checked)}
                className="mt-1"
              />
              <span>
                I understand this writes keyboard lighting, sends one generated AA 23 10 packet only, has no automatic
                rollback, and recovery is manual.
              </span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void onRunFunctionalLightingWrite();
              }}
              disabled={!functionalLightingWriteState.canRun}
              title={functionalLightingWriteState.runDisabledReason}
              className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
            >
              Write Lighting to AK680 V2
            </button>
            <button
              type="button"
              onClick={onExportFunctionalLightingWriteEvidence}
              className="rounded border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cloud"
            >
              Export WP22 Evidence JSON
            </button>
          </div>
          {functionalLightingWriteState.result && (
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Functional lighting result</p>
              <InfoGrid
                items={[
                  { label: "Status", value: functionalLightingWriteState.result.status },
                  { label: "Timestamp", value: formatTimestamp(functionalLightingWriteState.result.timestamp) },
                  { label: "Attempted packet", value: functionalLightingWriteState.result.packetHex },
                  { label: "Write attempt count", value: functionalLightingWriteState.result.writeAttemptCount },
                  { label: "Retry count", value: functionalLightingWriteState.result.retryCount },
                  { label: "Follow-up packet count", value: functionalLightingWriteState.result.followUpPacketCount },
                  { label: "Physical verification", value: WP22_PHYSICAL_VERIFICATION_REMINDER },
                  { label: "Message", value: functionalLightingWriteState.result.message },
                ]}
              />
            </div>
          )}
        </div>
      </Section>
      <Section title="Lighting Write Candidate Dry-Run">
        <div className="space-y-4">
          <div className="rounded border border-copper/40 bg-copper/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
              <div>
                <p className="font-bold text-ink">Dry-run only; execution disabled</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  WP20 creates a local preview for a future global/static lighting write candidate. It does not touch
                  HID devices, does not write lighting, and does not add apply, sync, save-to-device, retries, polling,
                  scanning, fuzzing, a raw command console, or arbitrary payload input. Any real lighting write requires
                  a separate future work package and Red Team plan.
                </p>
              </div>
            </div>
          </div>
          <InfoGrid
            items={[
              { label: "Source profile", value: dryRunPlan.source.profileName },
              { label: "Source lighting data", value: dryRunPlan.source.hasLedEffect ? "ledEffect present" : "Missing" },
              { label: "Target device", value: dryRunPlan.targetMetadata.device },
              { label: "Target VID/PID", value: `${dryRunPlan.targetMetadata.vendorId}/${dryRunPlan.targetMetadata.productId}` },
              {
                label: "Required usagePage / usage",
                value: `${dryRunPlan.targetMetadata.usagePage} / ${dryRunPlan.targetMetadata.usage}`,
              },
              { label: "Report ID", value: dryRunPlan.reportMetadata.reportId },
              { label: "Preview length", value: `${dryRunPlan.packetPreview.reportLength} bytes` },
              { label: "Preview format", value: dryRunPlan.packetPreview.format },
              { label: "Execution", value: dryRunPlan.executionState.status },
              { label: "HID access during planning", value: dryRunPlan.executionState.hidAccessDuringPlanning ? "Yes" : "No" },
              { label: "Write support", value: dryRunPlan.executionState.writeSupport ? "Enabled" : "Disabled" },
              { label: "Retries", value: dryRunPlan.reportMetadata.retriesAllowed ? "Allowed" : "Not allowed" },
              { label: "Polling", value: dryRunPlan.reportMetadata.pollingAllowed ? "Allowed" : "Not allowed" },
            ]}
          />
          <div className="rounded border border-line bg-white p-5">
            <p className="font-semibold text-ink">Non-executable packet preview</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              RGB preview bytes are shown at indexes {dryRunPlan.packetPreview.rgbByteIndexes.red},{" "}
              {dryRunPlan.packetPreview.rgbByteIndexes.green}, and {dryRunPlan.packetPreview.rgbByteIndexes.blue}.
              Reserved/unknown bytes remain separated and are not interpreted.
            </p>
            <pre className="mt-3 max-h-44 overflow-auto rounded border border-line bg-cloud p-3 text-xs leading-6 text-slate-800">
              {dryRunPlan.packetPreview.hex}
            </pre>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Warnings and unknowns</p>
              <ul className="mt-3 grid gap-2">
                {[...dryRunPlan.warnings, ...dryRunPlan.packetPreview.unknownOrReservedByteRanges].map((warning) => (
                  <li key={warning} className="rounded border border-line bg-cloud px-3 py-2 text-sm text-slate-700">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Future WP21 safety checklist</p>
              <ul className="mt-3 grid gap-2">
                {dryRunPlan.futureWp21Checklist.map((item) => (
                  <li key={item.item} className="rounded border border-line bg-cloud px-3 py-2 text-sm text-slate-700">
                    {item.item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={onExportDryRunPreview}
            className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
          >
            Download Dry-Run Preview JSON
          </button>
        </div>
      </Section>
      <Section title="WP21 Experimental One-Shot Lighting Write">
        <div className="space-y-4">
          <div className="rounded border border-copper/40 bg-copper/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
              <div>
                <p className="font-bold text-ink">Experimental real write: one fixed packet only</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  WP21 may change keyboard lighting. It is not full lighting support, not profile write support, and
                  not apply/sync/save-to-device behavior. It sends at most one fixed packet after manual confirmation,
                  with no retry, polling, probing, hidden follow-up packet, automatic rollback, packet editor, raw
                  command console, arbitrary payload input, or RGB value write path.
                </p>
              </div>
            </div>
          </div>
          <InfoGrid
            items={[
              { label: "Target", value: "AK680 V2 only" },
              { label: "VID/PID", value: "3141 / 32956" },
              { label: "Required usagePage / usage", value: "65384 / 97" },
              { label: "Report ID", value: CONTROLLED_LIGHTING_WRITE_REPORT_ID },
              { label: "Packet length", value: `${CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH} bytes` },
              { label: "Selected path/interface", value: controlledLightingWriteState.selectedInterface?.path ?? "None" },
              { label: "Run status", value: controlledLightingWriteState.runStatus },
              { label: "Retry count", value: 0 },
              { label: "Follow-up packet count", value: 0 },
              { label: "Recovery/rollback", value: "Manual only" },
            ]}
          />
          <div className="rounded border border-line bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <label className="block flex-1">
                <span className="text-sm font-semibold text-ink">Exact AK680 V2 HID path/interface</span>
                <select
                  value={controlledLightingWriteSelectedPath}
                  onChange={(event) => {
                    onControlledLightingWriteSelectedPathChange(event.target.value);
                    onControlledLightingWriteConfirmedChange(false);
                  }}
                  className="mt-2 w-full rounded border border-line bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select target interface</option>
                  {writeInterfaces.map((device) => (
                    <option key={device.path ?? "unknown-path"} value={device.path ?? ""}>
                      {device.path} | usagePage {device.usagePage ?? "n/a"} / usage {device.usage ?? "n/a"}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  void onRefreshDetection();
                }}
                disabled={hidDetection.status === "checking"}
                className="rounded border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60"
              >
                {hidDetection.status === "checking" ? "Refreshing..." : "Refresh Metadata"}
              </button>
            </div>
          </div>
          <div className="rounded border border-line bg-white p-5">
            <p className="font-semibold text-ink">Exact approved packet bytes</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              These bytes are fixed in the backend and are not generated from imported profiles, UI state, RGB controls,
              fixtures, or the WP20 dry-run planner.
            </p>
            <pre className="mt-3 max-h-44 overflow-auto rounded border border-line bg-cloud p-3 text-xs leading-6 text-slate-800">
              {CONTROLLED_LIGHTING_WRITE_PACKET_HEX}
            </pre>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Pre-write gates</p>
              <ul className="mt-3 grid gap-2">
                {controlledLightingWriteState.gates.map((gate) => (
                  <li key={gate.label} className="rounded border border-line bg-cloud px-3 py-2 text-sm text-slate-700">
                    <span className="font-semibold text-ink">{gate.label}: </span>
                    {gate.status} - {gate.detail}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Manual confirmation checklist</p>
              <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                <li>Wired USB connection is active.</li>
                <li>Target is AK680 V2 with VID/PID 3141 / 32956.</li>
                <li>Selected interface is usagePage 65384 / usage 97.</li>
                <li>Report ID is 0 and packet length is 64 bytes.</li>
                <li>Exact bytes match the displayed AA 23 10 packet.</li>
                <li>Current profile or lighting state has been exported/backed up.</li>
                <li>The write may change keyboard lighting.</li>
                <li>Recovery is manual: official AJAZZ app/profile restore or future tested rollback WP.</li>
                <li>Physical verification is visual confirmation that keyboard lighting changed.</li>
              </ul>
              <label className="mt-4 flex items-start gap-3 rounded border border-copper/40 bg-copper/10 p-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={controlledLightingWriteConfirmed}
                  onChange={(event) => onControlledLightingWriteConfirmedChange(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I understand WP21 is experimental, may change keyboard lighting, sends one fixed packet only, has no
                  automatic rollback, and recovery is manual.
                </span>
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void onRunControlledLightingWrite();
              }}
              disabled={!controlledLightingWriteState.canRun}
              title={controlledLightingWriteState.runDisabledReason}
              className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
            >
              Run WP21 One-Shot Lighting Write
            </button>
            <button
              type="button"
              onClick={onExportControlledLightingWriteEvidence}
              className="rounded border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cloud"
            >
              Export WP21 Evidence JSON
            </button>
          </div>
          {controlledLightingWriteState.result && (
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">WP21 result</p>
              <InfoGrid
                items={[
                  { label: "Status", value: controlledLightingWriteState.result.status },
                  { label: "Timestamp", value: formatTimestamp(controlledLightingWriteState.result.timestamp) },
                  { label: "Report ID", value: controlledLightingWriteState.result.reportId },
                  { label: "Packet length", value: controlledLightingWriteState.result.packetLength },
                  { label: "Attempted packet", value: controlledLightingWriteState.result.packetHex },
                  { label: "Write attempt count", value: controlledLightingWriteState.result.writeAttemptCount },
                  { label: "Retry count", value: controlledLightingWriteState.result.retryCount },
                  { label: "Follow-up packet count", value: controlledLightingWriteState.result.followUpPacketCount },
                  { label: "Message", value: controlledLightingWriteState.result.message },
                  { label: "Physical verification", value: WP21_PHYSICAL_VERIFICATION_REMINDER },
                ]}
              />
            </div>
          )}
        </div>
      </Section>
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
  const activeRtKeys = getActiveRapidTriggerKeys(profile);
  return (
    <>
      <PageHeader title="Rapid Trigger" eyebrow="Magnetic-axis summary" />
      <Section title="Summary">
        <InfoGrid
          items={[
            { label: "magneticAxisRT records", value: summarizeArray(profile?.magneticAxisRT) },
            { label: "magneticAxisRTConfig records", value: summarizeArray(profile?.magneticAxisRTConfig) },
            { label: "magneticAxisDKS records", value: summarizeArray(profile?.magneticAxisDKS) },
            { label: "Active RT keys", value: activeRtKeys.length },
            { label: "Calibration", value: "Calibration is not available in this public alpha" },
            { label: "RT hardware writes", value: "Not implemented" },
          ]}
        />
      </Section>
      <Section title="Active RT Keys">
        {activeRtKeys.length === 0 ? (
          <EmptyState message="No active RT/actuation entries were detected in the imported profile." />
        ) : (
          <div className="overflow-x-auto rounded border border-line bg-white">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-cloud text-xs uppercase tracking-wide text-moss">
                <tr>
                  <th className="border-b border-line px-3 py-3">Key</th>
                  <th className="border-b border-line px-3 py-3">RT index</th>
                  <th className="border-b border-line px-3 py-3">Mapped by</th>
                  <th className="border-b border-line px-3 py-3">Axis type</th>
                  <th className="border-b border-line px-3 py-3">Fast trigger</th>
                  <th className="border-b border-line px-3 py-3">Trigger</th>
                  <th className="border-b border-line px-3 py-3">Press / release RT</th>
                </tr>
              </thead>
              <tbody>
                {activeRtKeys.map((entry) => (
                  <tr key={`${entry.source}-${entry.rtIndex}`} className="align-top">
                    <td className="border-b border-line px-3 py-3 font-semibold text-ink">
                      {entry.keyName} ({entry.key})
                    </td>
                    <td className="border-b border-line px-3 py-3">{entry.rtIndex}</td>
                    <td className="border-b border-line px-3 py-3">{entry.mappedBy}</td>
                    <td className="border-b border-line px-3 py-3">{entry.axisType}</td>
                    <td className="border-b border-line px-3 py-3">{entry.isWholeFast ? "On" : "Off"}</td>
                    <td className="border-b border-line px-3 py-3">{entry.triggerKeyStroke}</td>
                    <td className="border-b border-line px-3 py-3">{entry.pressRT} / {entry.releaseRT}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      <Section title="magneticAxisRT">
        <JsonPreview data={profile?.magneticAxisRT} />
      </Section>
      <Section title="magneticAxisRTConfig">
        <JsonPreview data={profile?.magneticAxisRTConfig} />
      </Section>
      <Section title="magneticAxisDKS">
        <JsonPreview data={profile?.magneticAxisDKS} />
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

function ProtocolResearch({
  importedProfile,
  hidDetection,
  localProfileStorage,
  controlledReadState,
  controlledReadSelectedPath,
  onControlledReadSelectedPathChange,
  onRunControlledDeviceInfoRead,
  onExportControlledReadStatus,
  onExportCandidateQueryDossier,
  onExportHardwareSmokeTestTemplate,
  onExportReadProtocolEvidencePack,
  onExportReadOnlySnapshot,
  onExportFirstWriteEvidencePlan,
  onExportFirstWriteCandidateSelection,
  onRefresh,
  onExportSnapshot,
}: {
  importedProfile: ImportedProfile;
  hidDetection: HidDetectionState;
  localProfileStorage: LocalProfileStorageState;
  controlledReadState: ControlledReadExperimentState;
  controlledReadSelectedPath: string;
  onControlledReadSelectedPathChange: (path: string) => void;
  onRunControlledDeviceInfoRead: () => void;
  onExportControlledReadStatus: () => void;
  onExportCandidateQueryDossier: () => void;
  onExportHardwareSmokeTestTemplate: () => void;
  onExportReadProtocolEvidencePack: () => void;
  onExportReadOnlySnapshot: () => void;
  onExportFirstWriteEvidencePlan: () => void;
  onExportFirstWriteCandidateSelection: () => void;
  onRefresh: () => Promise<void>;
  onExportSnapshot: () => void;
}) {
  const matchingInterfaces = getMatchingResearchInterfaces(hidDetection.result);
  const controlledReadInterfaces = getMatchingControlledReadInterfaces(hidDetection.result);
  const likelyResearchInterface = inferLikelyResearchInterface(matchingInterfaces);
  const profile = importedProfile.validation.valid ? importedProfile.profile : undefined;
  const activeProfile = localProfileStorage.profiles.find((saved) => saved.id === localProfileStorage.activeProfileId);
  const exampleDossierValidation = validateCandidateQueryDossier(EXAMPLE_CANDIDATE_QUERY_DOSSIER);
  const readEvidenceValidation = validateReadProtocolEvidencePack(EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK);
  const readOnlySnapshot = createReadOnlyDeviceSnapshot({
    controlledReadState,
    appVersion: APP_VERSION,
  });
  const readOnlyComparison = createSnapshotProfileComparison({ snapshot: readOnlySnapshot, profile });
  const firstWriteValidation = validateFirstWriteEvidencePack(EXAMPLE_FIRST_WRITE_EVIDENCE_PACK);
  const firstWriteSelection = reviewFirstWriteCandidateSelection(EXAMPLE_FIRST_WRITE_EVIDENCE_PACK);

  return (
    <>
      <PageHeader title="Protocol Research" eyebrow="Read-only research mode" />
      <Section title="Research Mode Warning">
        <div className="rounded border border-copper/40 bg-copper/10 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
            <div>
              <p className="font-bold text-ink">Read-only research with one controlled query</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                This screen is for protocol research notes, safe HID enumeration metadata, and the single WP13-approved
                AA 10 30 device-info read/query. It does not change settings, write keyboard configuration, send
                unknown HID command packets, or probe beyond the approved manual action.
              </p>
            </div>
          </div>
        </div>
      </Section>
      <Section title="Research Actions">
        <div className="rounded border border-line bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-ink">Local diagnostics snapshot</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Exports a local JSON file with timestamp, app version, matching HID metadata, safe profile summaries,
                assumptions, and safety notes. No network or keyboard write is used.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void onRefresh();
                }}
                disabled={hidDetection.status === "checking"}
                className="inline-flex items-center justify-center rounded border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60"
              >
                {hidDetection.status === "checking" ? "Refreshing..." : "Refresh Metadata"}
              </button>
              <button
                type="button"
                onClick={onExportSnapshot}
                className="inline-flex items-center justify-center rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
              >
                Export Snapshot
              </button>
            </div>
          </div>
        </div>
      </Section>
      <Section title="AK680 V2 Matching Interfaces">
        {matchingInterfaces.length === 0 ? (
          <EmptyState message="No matching AK680 V2 HID interfaces are available from the latest read-only enumeration. Refresh metadata with the keyboard connected in USB/wired mode if available." />
        ) : (
          <ProtocolInterfaceTable devices={matchingInterfaces} likelyResearchInterface={likelyResearchInterface} />
        )}
      </Section>
      <Section title="Likely Research Interface">
        <InfoGrid
          items={[
            {
              label: "Inference",
              value: likelyResearchInterface
                ? "Likely only detected matching interface"
                : "Not inferred; multiple or no matching interfaces are available",
            },
            { label: "Inference method", value: "Read-only metadata count only; no probing or packets" },
            { label: "Matching interface count", value: matchingInterfaces.length },
            { label: "Last HID status", value: getHidStatusText(hidDetection).title },
          ]}
        />
      </Section>
      <Section title="Protocol Evidence Guide">
        <div className="space-y-4">
          <div className="rounded border border-copper/40 bg-copper/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
              <div>
                <p className="font-bold text-ink">Evidence-only dossier workflow</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  WP11 collects evidence for future additional queries beyond the WP13-approved AA 10 30 read. A
                  complete dossier can only become ready for Red Team review; it does not enable additional command
                  execution, HID report sends, device-info queries, or keyboard setting changes in this app.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Required evidence before any future query</p>
              <ul className="mt-3 grid gap-2">
                {PROTOCOL_EVIDENCE_REQUIRED_ITEMS.map((item) => (
                  <li key={item} className="rounded border border-line bg-cloud px-3 py-2 text-sm text-slate-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Candidate Query Dossier</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                The template captures candidate name, evidence source, report details, request framing, expected
                response, target path/interface notes, read-only and non-write rationale, risk assessment, GPL/source
                cleanliness notes, reviewer notes, and one allowed non-execution status.
              </p>
              <InfoGrid
                items={[
                  { label: "Example status", value: EXAMPLE_CANDIDATE_QUERY_DOSSIER.status },
                  { label: "Complete", value: exampleDossierValidation.complete ? "Yes" : "No" },
                  { label: "Missing fields", value: exampleDossierValidation.missingFields.length },
                  { label: "Execution enabled", value: "No" },
                  { label: "Future additional commands", value: "Require new work package and Red Team plan" },
                ]}
              />
              <button
                type="button"
                onClick={onExportCandidateQueryDossier}
                className="mt-4 rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
              >
                Export Example Dossier JSON
              </button>
            </div>
          </div>
        </div>
      </Section>
      <Section title="Read Protocol Evidence Pack">
        <div className="space-y-4">
          <div className="rounded border border-copper/40 bg-copper/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
              <div>
                <p className="font-bold text-ink">Evidence-only candidate read records</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  WP15 organizes local evidence and candidate dossiers for possible future read-only settings research.
                  These records are inert data only. They do not approve commands, enable settings reads, add write
                  support, or create execution paths beyond the already-approved WP13 controlled read.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Evidence pack status</p>
              <InfoGrid
                items={[
                  { label: "Schema version", value: EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK.schemaVersion },
                  { label: "Evidence records", value: EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK.records.length },
                  { label: "Candidate dossiers", value: EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK.dossiers.length },
                  { label: "Completeness score", value: `${readEvidenceValidation.completenessScore}%` },
                  { label: "Classification", value: readEvidenceValidation.status },
                  { label: "Execution enabled", value: readEvidenceValidation.executionEnabled ? "Yes" : "No" },
                  { label: "Settings-read support", value: "Not implemented" },
                  { label: "Validation touches HID", value: "No" },
                  { label: "Safety notes", value: WP15_SAFETY_NOTES.length },
                ]}
              />
              <button
                type="button"
                onClick={onExportReadProtocolEvidencePack}
                className="mt-4 rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
              >
                Export Evidence Pack JSON
              </button>
            </div>
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Candidate classifications</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Status values are review labels only. Even ready-for-future-Red-Team-review does not enable execution,
                approve a command, or imply settings-read support.
              </p>
              <InfoGrid
                items={[
                  { label: "Allowed statuses", value: READ_CANDIDATE_STATUSES.join(", ") },
                  { label: "Read areas", value: READ_CANDIDATE_AREAS.length },
                  { label: "Ready means executable", value: "No" },
                  { label: "Future execution", value: "Requires separate work package and Red Team plan" },
                  { label: "GPL/source cleanliness", value: "Required for every evidence pack and dossier" },
                ]}
              />
            </div>
          </div>
        </div>
      </Section>
      <Section title="Read-Only Settings Foundation">
        <div className="space-y-4">
          <div className="rounded border border-copper/40 bg-copper/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
              <div>
                <p className="font-bold text-ink">Approved read pack, snapshot viewer, and compare foundation</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  WP16 approves only the existing WP13 controlled device-info read. Snapshot and compare views are
                  local/read-only and do not run hidden reads on screen open, export, compare, editor, backup, or import.
                  Unsupported settings remain unknown or unsupported by the current command pack.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Approved read-only command pack</p>
              <InfoGrid
                items={[
                  { label: "Pack version", value: READ_ONLY_COMMAND_PACK_VERSION },
                  { label: "Approved command count", value: APPROVED_READ_ONLY_COMMANDS.length },
                  { label: "Approved command IDs", value: APPROVED_READ_ONLY_COMMANDS.map((command) => command.id).join(", ") },
                  { label: "Manual confirmation", value: "Required before each approved read" },
                  { label: "Retries", value: 0 },
                  { label: "Polling / automatic reads", value: "Disabled" },
                  { label: "New WP16 commands", value: "None; WP15 evidence did not qualify additional reads" },
                  { label: "Write support", value: "Not implemented" },
                ]}
              />
            </div>
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Snapshot viewer</p>
              <InfoGrid
                items={[
                  { label: "Snapshot schema", value: readOnlySnapshot.schemaVersion },
                  { label: "Data origin", value: readOnlySnapshot.dataOrigin },
                  { label: "Hardware read performed", value: readOnlySnapshot.hardwareReadPerformed ? "Yes" : "No" },
                  { label: "Source command", value: readOnlySnapshot.sourceCommands.join(", ") },
                  { label: "Known parsed fields", value: readOnlySnapshot.commandResults[0].parsed.knownFields.length },
                  { label: "Unknown field groups", value: readOnlySnapshot.commandResults[0].parsed.unknownFields.length },
                  { label: "Parser warnings", value: readOnlySnapshot.commandResults[0].parsed.parserWarnings.length },
                  { label: "Confidence", value: readOnlySnapshot.commandResults[0].parsed.confidence },
                ]}
              />
              <button
                type="button"
                onClick={onExportReadOnlySnapshot}
                className="mt-4 rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
              >
                Export Snapshot JSON
              </button>
            </div>
          </div>
          <div className="rounded border border-line bg-white p-5">
            <p className="font-semibold text-ink">Snapshot vs profile comparison</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Comparison is local analysis only. Unsupported fields are not treated as writable differences.
            </p>
            <div className="mt-4 overflow-x-auto rounded border border-line">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-cloud text-xs uppercase tracking-wide text-moss">
                  <tr>
                    <th className="border-b border-line px-3 py-3">Field</th>
                    <th className="border-b border-line px-3 py-3">Category</th>
                    <th className="border-b border-line px-3 py-3">Device snapshot</th>
                    <th className="border-b border-line px-3 py-3">Profile JSON</th>
                    <th className="border-b border-line px-3 py-3">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {readOnlyComparison.rows.map((row) => (
                    <tr key={row.field} className="align-top">
                      <td className="border-b border-line px-3 py-3 font-semibold text-ink">{row.field}</td>
                      <td className="border-b border-line px-3 py-3">{row.category}</td>
                      <td className="border-b border-line px-3 py-3">{row.deviceValue}</td>
                      <td className="border-b border-line px-3 py-3">{row.profileValue}</td>
                      <td className="border-b border-line px-3 py-3">{row.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded border border-line bg-white p-5">
            <p className="font-semibold text-ink">Future write gate</p>
            <InfoGrid
              items={[
                { label: "Status", value: FUTURE_WRITE_GATE.status },
                { label: "Enabled", value: FUTURE_WRITE_GATE.enabled ? "Yes" : "No" },
                { label: "Requires separate WP", value: FUTURE_WRITE_GATE.requiresSeparateWorkPackage ? "Yes" : "No" },
                { label: "Requires Red Team plan", value: FUTURE_WRITE_GATE.requiresRedTeamPlan ? "Yes" : "No" },
                { label: "Bypass available", value: FUTURE_WRITE_GATE.bypassAvailable ? "Yes" : "No" },
                { label: "HID access allowed", value: FUTURE_WRITE_GATE.hidAccessAllowed ? "Yes" : "No" },
              ]}
            />
          </div>
        </div>
      </Section>
      <Section title="First Write Evidence Plan">
        <div className="space-y-4">
          <div className="rounded border border-copper/40 bg-copper/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
              <div>
                <p className="font-bold text-ink">Evidence-only first-write planning</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  WP17 collects planning evidence for a possible future first controlled setting write. It does not
                  implement, approve, enable, or execute setting writes. Candidate readiness, backup evidence, rollback
                  evidence, and read-back evidence are planning data only.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Evidence and candidate status</p>
              <InfoGrid
                items={[
                  { label: "Evidence records", value: EXAMPLE_FIRST_WRITE_EVIDENCE_PACK.records.length },
                  { label: "Candidate records", value: EXAMPLE_FIRST_WRITE_EVIDENCE_PACK.candidates.length },
                  { label: "Validation", value: firstWriteValidation.valid ? "Valid" : "Planning evidence incomplete" },
                  { label: "Write execution approved", value: "No" },
                  { label: "Write support implemented", value: "No" },
                  { label: "Candidate execution enabled", value: "No" },
                  { label: "Existing executable command", value: "wp13-device-info-read only" },
                  { label: "Validation touches HID", value: "No" },
                ]}
              />
              <button
                type="button"
                onClick={onExportFirstWriteEvidencePlan}
                className="mt-4 rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
              >
                Export First-Write Evidence Plan
              </button>
            </div>
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Risk and reversibility planning</p>
              <InfoGrid
                items={[
                  { label: "Risk scoring", value: "1 very low to 5 unacceptable; conservative by default" },
                  { label: "Reversibility scoring", value: "1 unknown to 5 documented and verifiable" },
                  { label: "Backup evidence", value: "Required for future review; does not approve execution" },
                  { label: "Rollback evidence", value: "Required for future review; does not approve execution" },
                  { label: "Read-back / physical verification", value: "Required for future review; planning only" },
                  { label: "Future implementation", value: "Requires separate WP and Red Team plan" },
                ]}
              />
            </div>
          </div>
          <div className="rounded border border-line bg-white p-5">
            <p className="font-semibold text-ink">Disabled write-readiness checklist</p>
            <ul className="mt-3 grid gap-2 md:grid-cols-2">
              {DISABLED_WRITE_READINESS_CHECKLIST.map((item) => (
                <li key={item.label} className="rounded border border-line bg-cloud px-3 py-2">
                  <p className="text-sm font-semibold text-ink">{item.label}: {item.status}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
      <Section title="First Write Candidate Selection">
        <div className="space-y-4">
          <div className="rounded border border-copper/40 bg-copper/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
              <div>
                <p className="font-bold text-ink">Candidate-selection only</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  WP18 reviews WP17 first-write evidence and records Outcome A or Outcome B. The current review records
                  Outcome A: no candidate is selected. Candidate selection does not implement, approve, enable, or
                  execute write behavior.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Selection outcome</p>
              <InfoGrid
                items={[
                  { label: "Outcome", value: firstWriteSelection.outcome },
                  { label: "Selected candidates", value: firstWriteSelection.selectedCandidateCount },
                  { label: "Write command approved", value: "No" },
                  { label: "Write support implemented", value: "No" },
                  { label: "Candidate selection enables execution", value: "No" },
                  { label: "Future write gate", value: firstWriteSelection.futureWriteGate },
                  { label: "Existing executable command", value: "wp13-device-info-read only" },
                  { label: "Validation/export touches HID", value: "No" },
                ]}
              />
              <button
                type="button"
                onClick={onExportFirstWriteCandidateSelection}
                className="mt-4 rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
              >
                Export Candidate Selection Review
              </button>
            </div>
            <div className="rounded border border-line bg-white p-5">
              <p className="font-semibold text-ink">Outcome A rationale</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{firstWriteSelection.rejectionSummary}</p>
              <InfoGrid
                items={[
                  { label: "Risk rationale", value: firstWriteSelection.riskRationale },
                  { label: "Evidence gaps", value: firstWriteSelection.evidenceGaps.length },
                  { label: "Backup/rollback gaps", value: firstWriteSelection.backupRollbackGaps.length },
                  {
                    label: "Read-back / physical verification gaps",
                    value: firstWriteSelection.readBackPhysicalVerificationGaps.length,
                  },
                  { label: "GPL/source-cleanliness gaps", value: firstWriteSelection.gplSourceCleanlinessGaps.length },
                  { label: "Future implementation", value: "Requires separate WP and Red Team plan" },
                ]}
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded border border-line bg-white">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-cloud text-xs uppercase tracking-wide text-moss">
                <tr>
                  <th className="border-b border-line px-3 py-3">Candidate</th>
                  <th className="border-b border-line px-3 py-3">Selection status</th>
                  <th className="border-b border-line px-3 py-3">Risk</th>
                  <th className="border-b border-line px-3 py-3">Reversibility</th>
                  <th className="border-b border-line px-3 py-3">Classification</th>
                  <th className="border-b border-line px-3 py-3">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {firstWriteSelection.records.map((record) => (
                  <tr key={record.candidateId} className="align-top">
                    <td className="border-b border-line px-3 py-3 font-semibold text-ink">{record.title}</td>
                    <td className="border-b border-line px-3 py-3">{record.selectionStatus}</td>
                    <td className="border-b border-line px-3 py-3">{record.riskScore}</td>
                    <td className="border-b border-line px-3 py-3">{record.reversibilityScore}</td>
                    <td className="border-b border-line px-3 py-3">{record.hardwareRiskClassification}</td>
                    <td className="border-b border-line px-3 py-3">{record.rejectionRationale || record.selectionRationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
      <Section title="Controlled Read Experiment">
        <div className="space-y-4">
          <div className="rounded border border-copper/40 bg-copper/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
              <div>
                <p className="font-bold text-ink">Controlled device-info read/query, one approved command only</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  WP13 enables exactly one WP12-approved device-info read/query: AA 10 30, report ID 0, 64 request
                  bytes. It requires a selected AK680 V2 VID/PID 3141/32956 interface with usagePage 65384 and usage
                  97 where metadata is available. It runs once per explicit confirmation with no retries, no background
                  polling, no fuzzing, and no apply/sync/save-to-device behavior.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded border border-line bg-white p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div>
                <p className="font-semibold text-ink">Target path/interface selection</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  The controlled read requires AK680 V2 VID/PID detection and an exact selected matching HID
                  path/interface. It does not guess across multiple interfaces.
                </p>
                <label className="mt-3 block text-sm font-semibold text-ink">
                  Matching AK680 V2 interface
                  <select
                    className="mt-2 w-full rounded border border-line bg-white px-3 py-2 text-sm"
                    value={controlledReadSelectedPath}
                    onChange={(event) => onControlledReadSelectedPathChange(event.target.value)}
                  >
                    <option value="">Select a matching path/interface</option>
                    {controlledReadInterfaces.map((device) => (
                      <option key={device.path ?? `${device.vendorId}-${device.productId}`} value={device.path ?? ""}>
                        {device.path || "Path not available"} | interface {formatOptionalMetadata(device.interfaceNumber)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <p className="font-semibold text-ink">Harness status</p>
                <InfoGrid
                  items={[
                    { label: "WP13 outcome", value: "Implemented single approved query" },
                    { label: "Query", value: controlledReadState.queryName },
                    { label: "Implementation", value: "Implemented / gated" },
                    { label: "Report ID", value: 0 },
                    { label: "Request length", value: 64 },
                    { label: "Retries", value: 0 },
                    { label: "Last status", value: controlledReadState.runStatus },
                    { label: "Selected target", value: controlledReadState.selectedInterface?.path ?? "None" },
                    { label: "Response length", value: controlledReadState.result?.responseLength ?? 0 },
                    { label: "Keyboard setting writes", value: "Not implemented" },
                  ]}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {controlledReadState.gates.map((gate) => (
                <div key={gate.label} className="rounded border border-line bg-cloud p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{gate.label}</p>
                    <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase ${getControlledReadGateClass(gate.status)}`}>
                      {gate.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{gate.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!controlledReadState.canRun}
                onClick={() => {
                  void onRunControlledDeviceInfoRead();
                }}
                className="rounded border border-copper px-4 py-2 text-sm font-semibold text-ink transition hover:bg-copper/10 disabled:cursor-not-allowed disabled:opacity-60"
                title={controlledReadState.runDisabledReason}
              >
                Run One Controlled Device-Info Read
              </button>
              <button
                type="button"
                onClick={onExportControlledReadStatus}
                className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
              >
                Export Controlled Read Status
              </button>
            </div>
            {controlledReadState.result && (
              <div className="mt-4 rounded border border-line bg-cloud p-4">
                <p className="text-sm font-semibold text-ink">Last result/status</p>
                <InfoGrid
                  items={[
                    { label: "Status", value: controlledReadState.result.status },
                    { label: "Outcome", value: controlledReadState.result.outcome },
                    { label: "Query", value: controlledReadState.result.queryName },
                    { label: "Timestamp", value: formatTimestamp(controlledReadState.result.timestamp) },
                    { label: "Report ID", value: controlledReadState.result.reportId },
                    { label: "Request length", value: controlledReadState.result.requestLength },
                    { label: "Response length", value: controlledReadState.result.responseLength },
                    { label: "Hex bytes", value: controlledReadState.result.responseHex || "None" },
                    { label: "Prefix", value: controlledReadState.result.minimalParse.prefix },
                    {
                      label: "Prefix matches 55 10 30",
                      value: controlledReadState.result.minimalParse.prefixMatchesExpected ? "Yes" : "No",
                    },
                    {
                      label: "Observed VID/PID-like bytes",
                      value: controlledReadState.result.minimalParse.observedVidPidLikeBytes ?? "Not available",
                    },
                    { label: "Message", value: controlledReadState.result.message },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </Section>
      <Section title="Hardware Smoke Test Checklist">
        <div className="space-y-4">
          <div className="rounded border border-copper/40 bg-copper/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-copper" />
              <div>
                <p className="font-bold text-ink">Optional manual observation only</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  WP14 adds a release-safety checklist for physical AK680 V2 smoke testing. It does not run
                  automatically, unlock additional protocol execution, change the WP13 command, or infer firmware,
                  settings, calibration, layout, memory, profile state, or write capability from any response.
                </p>
              </div>
            </div>
          </div>
          <InfoGrid
            items={[
              { label: "Smoke test status", value: "Manual / optional" },
              { label: "Result meaning", value: "Observation only" },
              { label: "Controlled query scope", value: "Existing WP13 AA 10 30 query only" },
              { label: "New HID commands", value: "None" },
              { label: "Retries/polling/scanning/fuzzing", value: "Not implemented" },
              { label: "Raw command console / arbitrary payloads", value: "Not implemented" },
              { label: "Writes/apply/sync/save-to-device", value: "Not implemented" },
            ]}
          />
          <div className="rounded border border-line bg-white p-5">
            <p className="font-semibold text-ink">Manual checklist</p>
            <ul className="mt-3 grid gap-2">
              {WP14_HARDWARE_SMOKE_TEST_CHECKLIST.map((item) => (
                <li key={item.id} className="rounded border border-line bg-cloud px-3 py-2">
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onExportHardwareSmokeTestTemplate}
              className="mt-4 rounded bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss"
            >
              Export Smoke Test Template JSON
            </button>
          </div>
        </div>
      </Section>
      <Section title="Protocol Assumptions">
        <ul className="grid gap-2 md:grid-cols-2">
          {PROTOCOL_ASSUMPTIONS.map((assumption) => (
            <li key={assumption} className="rounded border border-line bg-white px-3 py-2 text-sm text-slate-700">
              {assumption}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Snapshot Preview Summary">
        <InfoGrid
          items={[
            { label: "App version", value: APP_VERSION },
            { label: "Imported profile", value: profile?.profileName ?? "No valid imported profile" },
            { label: "Imported source", value: importedProfile.sourceName },
            { label: "Active local profile", value: activeProfile?.displayName ?? "None selected" },
            { label: "Safety notes", value: `${PROTOCOL_SAFETY_STATUS.length} read-only safety statements` },
          ]}
        />
      </Section>
    </>
  );
}

function ProtocolInterfaceTable({
  devices,
  likelyResearchInterface,
}: {
  devices: HidDetectionResult["devices"];
  likelyResearchInterface?: HidDetectionResult["devices"][number];
}) {
  return (
    <div className="overflow-x-auto rounded border border-line bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-cloud text-xs uppercase tracking-wide text-moss">
          <tr>
            <th className="border-b border-line px-3 py-3">Research inference</th>
            <th className="border-b border-line px-3 py-3">VID</th>
            <th className="border-b border-line px-3 py-3">PID</th>
            <th className="border-b border-line px-3 py-3">Usage page</th>
            <th className="border-b border-line px-3 py-3">Usage</th>
            <th className="border-b border-line px-3 py-3">Interface</th>
            <th className="border-b border-line px-3 py-3">Release</th>
            <th className="border-b border-line px-3 py-3">Manufacturer</th>
            <th className="border-b border-line px-3 py-3">Product</th>
            <th className="border-b border-line px-3 py-3">Serial</th>
            <th className="border-b border-line px-3 py-3">Path</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device, index) => {
            const summary = summarizeProtocolDevice(device, likelyResearchInterface);
            return (
              <tr key={`${device.vendorId}-${device.productId}-${device.path ?? index}`} className="align-top">
                <td className="border-b border-line px-3 py-3 font-semibold">
                  {summary.likelyResearchInterface ? "Likely research interface" : "Not inferred"}
                </td>
                <td className="border-b border-line px-3 py-3">{summary.vendorId}</td>
                <td className="border-b border-line px-3 py-3">{summary.productId}</td>
                <td className="border-b border-line px-3 py-3">{summary.usagePage}</td>
                <td className="border-b border-line px-3 py-3">{summary.usage}</td>
                <td className="border-b border-line px-3 py-3">{summary.interfaceNumber}</td>
                <td className="border-b border-line px-3 py-3">{summary.releaseNumber}</td>
                <td className="border-b border-line px-3 py-3">{summary.manufacturer}</td>
                <td className="border-b border-line px-3 py-3">{summary.product}</td>
                <td className="border-b border-line px-3 py-3">{summary.serialNumber}</td>
                <td className="max-w-96 break-words border-b border-line px-3 py-3 text-xs">{summary.path}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Diagnostics({
  importedProfile,
  hidDetection,
  localProfileStorage,
  editorSession,
  editorValidation,
  editorDiff,
  dryRunPlan,
  controlledReadState,
  controlledLightingWriteState,
}: {
  importedProfile: ImportedProfile;
  hidDetection: HidDetectionState;
  localProfileStorage: LocalProfileStorageState;
  editorSession?: LocalEditorSession;
  editorValidation: EditorValidation;
  editorDiff: EditorDiffSummary;
  dryRunPlan: DryRunPlan;
  controlledReadState: ControlledReadExperimentState;
  controlledLightingWriteState: ControlledLightingWriteExperimentState;
}) {
  const profile = importedProfile.validation.valid ? importedProfile.profile : undefined;
  const hidStatus = getHidStatusText(hidDetection);
  const matchingInterfaces = getMatchingResearchInterfaces(hidDetection.result);
  const activeProfile = localProfileStorage.profiles.find((saved) => saved.id === localProfileStorage.activeProfileId);
  const exampleDossierValidation = validateCandidateQueryDossier(EXAMPLE_CANDIDATE_QUERY_DOSSIER);
  const readEvidenceValidation = validateReadProtocolEvidencePack(EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK);
  const readOnlySnapshot = createReadOnlyDeviceSnapshot({
    controlledReadState,
    appVersion: APP_VERSION,
  });
  const firstWriteValidation = validateFirstWriteEvidencePack(EXAMPLE_FIRST_WRITE_EVIDENCE_PACK);
  const firstWriteSelection = reviewFirstWriteCandidateSelection(EXAMPLE_FIRST_WRITE_EVIDENCE_PACK);
  const lightingDryRunPlan = createLightingDryRunPlan(profile);
  const safetyItems = useMemo(
    () => [
      "No general hardware write commands beyond WP21 fixed-packet lighting experiment",
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
      "No unknown HID command packets",
      "Protocol Research uses metadata plus one approved controlled read",
      "Dry-run planner sends no packets",
      "Dry-run execution is blocked",
      "Controlled read limited to AA 10 30",
      "No controlled read retries",
      "No fuzzing or command scanning",
      "WP15 evidence packs are non-executable",
      "WP15 candidate statuses do not enable execution",
      "WP15 validation/import/export does not touch HID devices",
      "WP16 approves only the existing WP13 read command",
      "WP16 snapshot/compare/export does not touch HID devices",
      "WP16 future write gate is disabled",
      "WP17 first-write planning is evidence-only",
      "WP17 candidate records are non-executable",
      "WP17 backup/rollback/read-back evidence does not enable execution",
      "WP18 candidate selection is non-executable",
      "WP18 Outcome A selects zero candidates",
      "WP18 future write gate remains disabled",
      "WP20 lighting dry-run planner is non-executable",
      "WP20 adds no lighting write command",
      "WP20 preview/export does not touch HID devices",
      "WP21 implements exactly one fixed one-shot lighting write",
      "WP21 has no retry, polling, probing, hidden follow-up, or automatic rollback",
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
      <Section title="Protocol Research Status">
        <InfoGrid
          items={[
            { label: "Research mode", value: "Read-only metadata inspection" },
            { label: "Matching AK680 V2 interfaces", value: matchingInterfaces.length },
            {
              label: "Likely research interface",
              value: inferLikelyResearchInterface(matchingInterfaces)
                ? "Likely only detected matching interface"
                : "Not inferred",
            },
            { label: "Unknown HID command packets", value: "Not sent" },
            { label: "Keyboard configuration writes", value: "Not implemented" },
            { label: "Future write work", value: "Requires separate work package and Red Team plan" },
          ]}
        />
      </Section>
      <Section title="Protocol Evidence Status">
        <InfoGrid
          items={[
            { label: "Evidence guide", value: "Available under Protocol Research" },
            { label: "Candidate dossier template", value: "Available for local JSON export" },
            { label: "Required evidence items", value: PROTOCOL_EVIDENCE_REQUIRED_ITEMS.length },
            { label: "Example dossier status", value: EXAMPLE_CANDIDATE_QUERY_DOSSIER.status },
            { label: "Example dossier complete", value: exampleDossierValidation.complete ? "Yes" : "No" },
            { label: "Controlled device-info read", value: "Implemented for one approved AA 10 30 query only" },
            { label: "Additional dossier-enabled execution", value: "Not implemented" },
            { label: "Keyboard setting writes", value: "Not implemented" },
            { label: "Apply/sync/save-to-device", value: "Not implemented" },
          ]}
        />
      </Section>
      <Section title="Read Protocol Evidence Pack Status">
        <InfoGrid
          items={[
            { label: "WP15 scope", value: "Evidence-only" },
            { label: "Evidence records", value: EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK.records.length },
            { label: "Candidate dossiers", value: EXAMPLE_READ_PROTOCOL_EVIDENCE_PACK.dossiers.length },
            { label: "Pack validation", value: readEvidenceValidation.valid ? "Valid" : "Needs evidence cleanup" },
            { label: "Pack classification", value: readEvidenceValidation.status },
            { label: "Command execution enabled", value: "No" },
            { label: "New HID commands approved", value: "No" },
            { label: "Settings-read support", value: "Not implemented" },
            { label: "Write support", value: "Not implemented" },
            { label: "Candidate status enables execution", value: "No" },
            { label: "Validation/import/export touches HID", value: "No" },
            { label: "Future execution", value: "Requires separate work package and Red Team plan" },
            { label: "GPL/source cleanliness required", value: "Yes" },
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
      <Section title="Local Editor Status">
        <InfoGrid
          items={[
            { label: "Editor availability", value: "Local profile JSON editing only" },
            { label: "Active edit session", value: editorSession ? editorSession.source.label : "None" },
            { label: "Source type", value: editorSession?.source.kind ?? "None" },
            { label: "Validation", value: editorValidation.valid ? "Valid" : "Not ready" },
            { label: "Unsaved local changes", value: editorDiff.changed ? "Yes" : "No" },
            { label: "Changed key entries", value: editorDiff.keymapChangedCount },
            { label: "RT/actuation status", value: editorDiff.rtStatus },
            { label: "SOCD/game mode status", value: editorDiff.gameModeStatus },
            { label: "Lighting status", value: editorDiff.lightingStatus },
            { label: "Macro status", value: editorDiff.macroStatus },
            { label: "Keyboard hardware changes", value: "Not implemented" },
          ]}
        />
      </Section>
      <Section title="Dry-Run Planner Status">
        <InfoGrid
          items={[
            { label: "Planner availability", value: "Write Safety dry-run planner" },
            { label: "Active edited profile source", value: dryRunPlan.sourceLabel },
            { label: "Plan status", value: getDryRunStatusTitle(dryRunPlan) },
            { label: "Validation", value: dryRunPlan.validation.valid ? "Valid" : "Blocked or unavailable" },
            { label: "Operation summary", value: summarizeOperations(dryRunPlan.operations) },
            {
              label: "Checklist blocked items",
              value: dryRunPlan.checklist.filter((item) => item.status === "blocked").length,
            },
            { label: "No packets sent", value: "Confirmed" },
            { label: "Hardware writes", value: "Not implemented by the WP8 dry-run planner" },
            { label: "Execution", value: dryRunPlan.execution.status },
          ]}
        />
      </Section>
      <Section title="Lighting Write Candidate Dry-Run Status">
        <InfoGrid
          items={[
            { label: "WP20 scope", value: "Local-only dry-run planner" },
            { label: "Source lighting data", value: lightingDryRunPlan.source.hasLedEffect ? "ledEffect present" : "Missing" },
            { label: "Target VID/PID", value: `${lightingDryRunPlan.targetMetadata.vendorId}/${lightingDryRunPlan.targetMetadata.productId}` },
            {
              label: "Required usagePage / usage",
              value: `${lightingDryRunPlan.targetMetadata.usagePage} / ${lightingDryRunPlan.targetMetadata.usage}`,
            },
            { label: "Report ID", value: lightingDryRunPlan.reportMetadata.reportId },
            { label: "Preview length", value: lightingDryRunPlan.packetPreview.reportLength },
            { label: "Preview format", value: lightingDryRunPlan.packetPreview.format },
            { label: "Execution", value: lightingDryRunPlan.executionState.status },
            { label: "HID access during planning", value: lightingDryRunPlan.executionState.hidAccessDuringPlanning ? "Yes" : "No" },
            { label: "Command execution enabled", value: lightingDryRunPlan.executionState.commandExecutionEnabled ? "Yes" : "No" },
            { label: "Write support", value: lightingDryRunPlan.executionState.writeSupport ? "Enabled" : "Disabled" },
            { label: "Retries", value: lightingDryRunPlan.reportMetadata.retriesAllowed ? "Allowed" : "Not allowed" },
            { label: "Polling", value: lightingDryRunPlan.reportMetadata.pollingAllowed ? "Allowed" : "Not allowed" },
            { label: "Automatic execution", value: lightingDryRunPlan.reportMetadata.automaticExecutionAllowed ? "Allowed" : "Not allowed" },
            { label: "Future real write", value: "Requires separate work package and Red Team plan" },
          ]}
        />
      </Section>
      <Section title="WP21 Controlled Lighting Write Status">
        <InfoGrid
          items={[
            { label: "WP21 scope", value: "Experimental one-shot lighting write only" },
            { label: "Implementation", value: controlledLightingWriteState.implementationStatus },
            { label: "Action", value: controlledLightingWriteState.actionName },
            { label: "Target", value: "AK680 V2 only" },
            { label: "VID/PID", value: "3141 / 32956" },
            { label: "Required usagePage / usage", value: "65384 / 97" },
            { label: "Report ID", value: CONTROLLED_LIGHTING_WRITE_REPORT_ID },
            { label: "Packet length", value: CONTROLLED_LIGHTING_WRITE_PACKET_LENGTH },
            { label: "Selected path/interface", value: controlledLightingWriteState.selectedInterface?.path ?? "None" },
            { label: "Manual confirmation", value: controlledLightingWriteState.manualConfirmation ? "Checked" : "Required" },
            { label: "Can run", value: controlledLightingWriteState.canRun ? "Yes" : "No" },
            { label: "Last status", value: controlledLightingWriteState.runStatus },
            { label: "Write attempt count", value: controlledLightingWriteState.result?.writeAttemptCount ?? 0 },
            { label: "Retry count", value: 0 },
            { label: "Follow-up packet count", value: 0 },
            { label: "Hidden follow-up packet", value: "Not implemented" },
            { label: "Automatic rollback", value: "Not implemented" },
            { label: "Full lighting support", value: "Not implemented" },
            { label: "Profile write support", value: "Not implemented" },
            { label: "Apply/sync/save-to-device", value: "Not implemented" },
          ]}
        />
      </Section>
      <Section title="Controlled Read Experiment Status">
        <InfoGrid
          items={[
            { label: "Availability", value: "Implemented single approved command" },
            { label: "WP13 outcome", value: "Single controlled device-info read/query" },
            { label: "Query", value: controlledReadState.queryName },
            { label: "Implementation", value: "Gated manual execution" },
            { label: "Report ID", value: 0 },
            { label: "Request length", value: 64 },
            { label: "Retries", value: 0 },
            { label: "Only one command", value: "AA 10 30 only" },
            { label: "Target detected", value: hidDetection.result?.targetDetected ? "Yes" : "No" },
            { label: "Selected path/interface", value: controlledReadState.selectedInterface?.path ?? "None" },
            { label: "Last run status", value: controlledReadState.runStatus },
            { label: "Response length", value: controlledReadState.result?.responseLength ?? 0 },
            { label: "Arbitrary command entry", value: "Not implemented" },
            { label: "Raw command console", value: "Not implemented" },
            { label: "Keyboard setting writes", value: "Not implemented" },
            { label: "Apply/sync/save-to-device", value: "Not implemented" },
            { label: "Other official-driver commands", value: "Not implemented" },
            { label: "Fuzzing/scanning/background polling", value: "Not implemented" },
          ]}
        />
      </Section>
      <Section title="Read-Only Settings Foundation Status">
        <InfoGrid
          items={[
            { label: "Approved command count", value: APPROVED_READ_ONLY_COMMANDS.length },
            { label: "Approved command IDs", value: APPROVED_READ_ONLY_COMMANDS.map((command) => command.id).join(", ") },
            { label: "WP13 boundary", value: "Unchanged" },
            { label: "Report ID / request length", value: "0 / 64 bytes" },
            { label: "Required interface", value: "usagePage 65384 / usage 97" },
            { label: "Read-only status", value: "WP16 snapshots remain read-only; WP22 lighting writes are separate" },
            { label: "Manual confirmation", value: "Required before approved read" },
            { label: "Retry count", value: 0 },
            { label: "Polling", value: "Disabled" },
            { label: "Automatic execution", value: "Disabled" },
            { label: "Writes/apply/sync/save-to-device", value: "Disabled / not implemented" },
            { label: "Raw command console / arbitrary payload / packet editor", value: "Not implemented" },
            { label: "Snapshot model", value: "Available; local/read-only" },
            { label: "Snapshot data origin", value: readOnlySnapshot.dataOrigin },
            { label: "Compare UI", value: "Available; conservative local analysis" },
            { label: "Future write gate", value: FUTURE_WRITE_GATE.status },
            { label: "GPL/source cleanliness", value: "Preserved" },
            { label: "Safety notes", value: READ_ONLY_FOUNDATION_SAFETY_NOTES.length },
          ]}
        />
      </Section>
      <Section title="First Write Evidence Plan Status">
        <InfoGrid
          items={[
            { label: "WP17 scope", value: "Evidence-only planning" },
            { label: "Evidence records", value: EXAMPLE_FIRST_WRITE_EVIDENCE_PACK.records.length },
            { label: "Candidate records", value: EXAMPLE_FIRST_WRITE_EVIDENCE_PACK.candidates.length },
            { label: "Validation", value: firstWriteValidation.valid ? "Valid" : "Planning evidence incomplete" },
            { label: "Write support", value: "Not implemented" },
            { label: "First-write execution", value: "Not approved" },
            { label: "Candidate record execution", value: "Non-executable" },
            { label: "Candidate readiness enables execution", value: "No" },
            { label: "Future write gate", value: FUTURE_WRITE_GATE.status },
            { label: "Existing approved command", value: "wp13-device-info-read" },
            { label: "Writes/apply/sync/save-to-device", value: "Not implemented" },
            { label: "Retries/polling/scanning/fuzzing/probing/automatic execution", value: "Not implemented" },
            { label: "Validation/import/export touches HID", value: "No" },
            { label: "GPL/source cleanliness required", value: "Yes" },
            { label: "Safety notes", value: WP17_SAFETY_NOTES.length },
          ]}
        />
      </Section>
      <Section title="First Write Candidate Selection Status">
        <InfoGrid
          items={[
            { label: "WP18 scope", value: "Candidate selection only" },
            { label: "Outcome", value: firstWriteSelection.outcome },
            { label: "Selected candidates", value: firstWriteSelection.selectedCandidateCount },
            { label: "Review records", value: firstWriteSelection.records.length },
            { label: "Write support", value: "Not implemented" },
            { label: "Write execution approved", value: "No" },
            { label: "Candidate selection enables execution", value: "No" },
            { label: "Future write gate", value: firstWriteSelection.futureWriteGate },
            { label: "Existing approved command", value: firstWriteSelection.existingExecutableBoundary },
            { label: "WP13/WP16 boundary", value: "Unchanged" },
            { label: "Writes/apply/sync/save-to-device", value: "Not implemented" },
            { label: "Setting/keymap/lighting/RT/SOCD/macro/profile/firmware/calibration writes", value: "Not implemented" },
            { label: "Raw command console / arbitrary payload / packet editor", value: "Not implemented" },
            { label: "Retries/polling/scanning/fuzzing/probing/automatic execution", value: "Not implemented" },
            { label: "Validation/import/export touches HID", value: "No" },
            { label: "GPL/source cleanliness", value: "Preserved" },
            { label: "Safety notes", value: WP18_SAFETY_NOTES.length },
          ]}
        />
      </Section>
      <Section title="Hardware Smoke Test / Release Safety Status">
        <InfoGrid
          items={[
            { label: "WP14 smoke test", value: "Manual optional checklist only" },
            { label: "Physical result status", value: "Not recorded unless a user performs the manual checklist" },
            { label: "Result interpretation", value: "Observation only; no device state or write capability inference" },
            { label: "WP13 command behavior", value: "Unchanged; exactly one controlled AA 10 30 query" },
            { label: "New HID commands", value: "None added" },
            { label: "Additional protocol execution", value: "Not implemented" },
            { label: "Retries/polling/scanning/fuzzing", value: "Not implemented" },
            { label: "Raw command console / arbitrary payload input", value: "Not implemented" },
            { label: "Writes/apply/sync/save-to-device", value: "Not implemented" },
            { label: "Safety statements", value: WP14_RELEASE_SAFETY_STATEMENTS.length },
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
            { label: "Profile editing", value: "Local JSON edits only" },
            { label: "Hardware writes", value: "Only WP21 fixed-packet lighting experiment" },
            { label: "Vendor affiliation", value: "Unofficial; no AJAZZ affiliation" },
          ]}
        />
      </Section>
      <Section title="Safety Summary">
        <div className="rounded border border-line bg-white p-5">
          <p className="text-sm leading-6 text-slate-700">
            AK680 Studio can inspect imported profile JSON, list local HID device metadata, manage saved local profiles,
            edit local profile JSON, export or restore local backup files, and run the manually gated WP21 fixed-packet
            lighting experiment. It is not a complete keyboard control suite yet. General hardware-write, firmware,
            calibration, device-side keymap/RGB/rapid trigger/SOCD writes, and macro editing work requires future
            protocol research, Red Team review, and explicit maintainer approval before implementation.
          </p>
        </div>
      </Section>
      <Section title="Reporting and Contributions">
        <div className="rounded border border-line bg-white p-5">
          <p className="text-sm leading-6 text-slate-700">
            Please use the GitHub issue templates for bugs, feature requests, and device detection reports. Do not share
            sensitive serial numbers, private profile data, or local paths unless you are comfortable making them public.
            Contributions should keep the public alpha local-only and free of keyboard hardware writes unless a future
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
            <th className="border-b border-line px-3 py-3">Usage page</th>
            <th className="border-b border-line px-3 py-3">Usage</th>
            <th className="border-b border-line px-3 py-3">Interface</th>
            <th className="border-b border-line px-3 py-3">Release</th>
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
              <td className="border-b border-line px-3 py-3">{formatOptionalMetadata(device.usagePage)}</td>
              <td className="border-b border-line px-3 py-3">{formatOptionalMetadata(device.usage)}</td>
              <td className="border-b border-line px-3 py-3">{formatOptionalMetadata(device.interfaceNumber)}</td>
              <td className="border-b border-line px-3 py-3">{formatOptionalMetadata(device.releaseNumber)}</td>
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
