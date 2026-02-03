import { registerPlugin } from '@capacitor/core';

export interface PermissionManagerPlugin {
  requestAllPermissions(): Promise<{ allGranted: boolean; message: string }>;
  checkPermissions(): Promise<{ permissions: Record<string, boolean> }>;
}

const PermissionManager = registerPlugin<PermissionManagerPlugin>('PermissionManager');

export { PermissionManager };
