import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PermissionManager } from '@/integrations/permission-manager';

export interface PermissionStatus {
  camera: boolean;
  storage: boolean;
  storageWrite?: boolean;
  mediaImages?: boolean;
  mediaVideo?: boolean;
  activityRecognition?: boolean;
  exactAlarm?: boolean;
}

export interface UsePermissionsReturn {
  permissions: PermissionStatus;
  allGranted: boolean;
  isLoading: boolean;
  error: string | null;
  checkPermissions: () => Promise<void>;
  requestAllPermissions: () => Promise<{ granted: boolean; permissions: PermissionStatus }>;
}

/**
 * Hook to manage app permissions
 * Handles requesting and checking all necessary permissions for the app
 */
export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: false,
    storage: false,
    storageWrite: false,
    mediaImages: false,
    mediaVideo: false,
    activityRecognition: false,
    exactAlarm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      // On web, all permissions are considered granted
      setPermissions({
        camera: true,
        storage: true,
        mediaImages: true,
        mediaVideo: true,
        activityRecognition: true,
        exactAlarm: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await PermissionManager.checkPermissions();
      const permissionStatus: PermissionStatus = {
        camera: result.permissions['android.permission.CAMERA'] || false,
        storage: result.permissions['android.permission.READ_EXTERNAL_STORAGE'] || false,
        storageWrite: result.permissions['android.permission.WRITE_EXTERNAL_STORAGE'] || false,
        mediaImages: result.permissions['android.permission.READ_MEDIA_IMAGES'] || false,
        activityRecognition: result.permissions['android.permission.ACTIVITY_RECOGNITION'] || false,
        exactAlarm: result.permissions['android.permission.SCHEDULE_EXACT_ALARM'] || false,
      };
      setPermissions(permissionStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check permissions');
      console.error('Error checking permissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestAllPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      return { granted: true, permissions: permissions };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await PermissionManager.requestAllPermissions();
      
      // After requesting, check permissions again to get updated status
      await checkPermissions();
      
      return {
        granted: result.allGranted,
        permissions: permissions,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permissions';
      setError(errorMessage);
      console.error('Error requesting permissions:', err);
      
      return {
        granted: false,
        permissions: permissions,
      };
    } finally {
      setIsLoading(false);
    }
  }, [permissions, checkPermissions]);

  const allGranted = Object.values(permissions).every(Boolean);

  return {
    permissions,
    allGranted,
    isLoading,
    error,
    checkPermissions,
    requestAllPermissions,
  };
}
