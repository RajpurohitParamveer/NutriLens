import { registerPlugin } from '@capacitor/core';

export interface DirectPermissionsPlugin {
  requestStepTrackingPermissions(): Promise<{ granted: boolean; message: string }>;
  checkStepPermissions(): Promise<{
    activityRecognition: boolean;
    allGranted: boolean;
  }>;
}

const DirectPermissions = registerPlugin<DirectPermissionsPlugin>('DirectPermissions');

export { DirectPermissions };
