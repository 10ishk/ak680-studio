import type { AjazzProfile } from "./profile";

export interface SavedLocalProfile {
  id: string;
  displayName: string;
  originalProfileName: string;
  deviceId: string;
  sourceFilename?: string;
  createdAt: string;
  importedAt: string;
  updatedAt: string;
  raw: unknown;
  profile: AjazzProfile;
}

export interface LocalProfileStore {
  version: 1;
  activeProfileId?: string;
  profiles: SavedLocalProfile[];
}

export interface LocalProfileBackup {
  version: 1;
  exportedAt: string;
  activeProfileId?: string;
  profiles: SavedLocalProfile[];
}

export interface LocalProfileStorageState {
  schemaVersion: 1;
  profiles: SavedLocalProfile[];
  activeProfileId?: string;
  storageType: "Browser localStorage";
  storageHealth: "healthy" | "recovered" | "error";
  lastStorageError?: string;
  lastBackupMessage?: string;
}

export interface ComparisonRow {
  label: string;
  left: string | number;
  right: string | number;
  status: "same" | "different";
}
