export interface HidDeviceMetadata {
  vendorId: number;
  productId: number;
  manufacturer?: string | null;
  product?: string | null;
  serialNumber?: string | null;
  path?: string | null;
  matchedTarget: boolean;
}

export interface HidDetectionResult {
  devices: HidDeviceMetadata[];
  targetDetected: boolean;
  targetVendorId: number;
  targetProductId: number;
}

export type HidDetectionState =
  | { status: "idle"; result?: undefined; error?: undefined }
  | { status: "checking"; result?: HidDetectionResult; error?: undefined }
  | { status: "detected"; result: HidDetectionResult; error?: undefined }
  | { status: "not-detected"; result: HidDetectionResult; error?: undefined }
  | { status: "error"; result?: undefined; error: string };

