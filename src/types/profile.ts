export type JsonRecord = Record<string, unknown>;

export interface ImportedProfile {
  sourceName: string;
  raw: unknown;
  profile: AjazzProfile;
  validation: ValidationResult;
}

export interface AjazzProfile {
  deviceId?: string;
  protocol?: string;
  profileName?: string;
  deviceInfo?: DeviceInfo;
  keyList?: KeyboardKey[][];
  gameModeInfo?: GameModeInfo;
  ledEffect?: LedEffect;
  customLedData?: CustomLedData[];
  macroDataList?: JsonRecord[];
  magneticAxisRT?: MagneticAxisRT[] | JsonRecord;
  magneticAxisRTConfig?: MagneticAxisRTConfig[] | JsonRecord;
  magneticAxisDKS?: JsonRecord[] | JsonRecord;
  [key: string]: unknown;
}

export interface DeviceInfo {
  deviceId?: string;
  vid?: number | string;
  pid?: number | string;
  version?: number | string;
  romSize?: number;
  macroSpaceSize?: number;
  workMode?: number;
  batteryLevel?: number;
  chargeStatus?: number;
  currentProfile?: number;
  [key: string]: unknown;
}

export interface KeyboardKey {
  className?: string;
  value?: number | string;
  name?: string;
  keyCode?: number;
  key?: string;
  userKey?: {
    name?: string;
    text?: string;
    page?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface GameModeInfo {
  gameMode?: number;
  fnSwitch?: number;
  sleepTime?: number;
  keyDelay?: number;
  reportRate?: number;
  systemMode?: number;
  stabilityMode?: number;
  autoCalibration?: number;
  [key: string]: unknown;
}

export interface LedEffect {
  mode?: number;
  red?: number;
  green?: number;
  blue?: number;
  brightness?: number;
  speed?: number;
  direction?: number;
  colorMode?: number;
  [key: string]: unknown;
}

export interface CustomLedData {
  ledId?: number;
  red?: number;
  green?: number;
  blue?: number;
  [key: string]: unknown;
}

export interface MagneticAxisRT {
  axisType?: number;
  isWholeFast?: boolean;
  isRampageMode?: boolean;
  triggerKeyStroke?: number;
  pressRT?: number;
  releaseRT?: number;
  [key: string]: unknown;
}

export interface MagneticAxisRTConfig {
  axisType?: number;
  isWholeFast?: boolean;
  isRampageMode?: boolean;
  triggerKeyStroke?: number;
  pressRT?: number;
  releaseRT?: number;
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
