import type { PluginListenerHandle } from '@capacitor/core';

declare global {
  interface Window {
    Capacitor: {
      Plugins: {
        PermissionManager: {
          requestAllPermissions(): Promise<{
            granted: boolean;
            permissions: {
              [key: string]: boolean;
            };
          }>;
          checkPermissions(): Promise<{
            permissions: {
              [key: string]: boolean;
            };
          }>;
          addListener(
            eventName: string,
            listenerFunc: (data: any) => void
          ): Promise<PluginListenerHandle>;
        };
      };
    };
  }
}
