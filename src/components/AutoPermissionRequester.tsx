import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface AutoPermissionRequesterProps {
  onPermissionCheckComplete: () => void;
}

export function AutoPermissionRequester({ onPermissionCheckComplete }: AutoPermissionRequesterProps) {
  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      if (!Capacitor.isNativePlatform()) {
        onPermissionCheckComplete();
        return;
      }

      // Check if permissions were already requested before
      const permissionsRequested = localStorage.getItem('nutrilens-permissions-requested');
      
      if (permissionsRequested === 'true') {
        onPermissionCheckComplete();
        return;
      }

      // Set a timeout to prevent black screen and trigger permission request
      const timeout = setTimeout(() => {
        console.log('Triggering permission request');
        localStorage.setItem('nutrilens-permissions-requested', 'true');
        onPermissionCheckComplete();
      }, 1000); // 1 second delay

      return () => clearTimeout(timeout);
    };

    checkAndRequestPermissions();
  }, [onPermissionCheckComplete]);

  // Don't render anything - this is a background component
  return null;
}
