import { registerPlugin } from '@capacitor/core';

export interface PermissionRequesterPlugin {
  requestCriticalPermissions(): Promise<{ success: boolean; message: string }>;
  requestAllPermissions(): Promise<{ success: boolean; message: string }>;
  checkPermissionStatus(): Promise<Record<string, boolean>>;
}

const PermissionRequester = registerPlugin<PermissionRequesterPlugin>('PermissionRequester');

export { PermissionRequester };
