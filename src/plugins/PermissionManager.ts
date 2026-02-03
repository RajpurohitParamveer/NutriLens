import type { PluginListenerHandle } from '@capacitor/core';

export interface PermissionManagerPlugin {
  /**
   * Request all necessary permissions for the app
   */
  requestAllPermissions(): Promise<{
    granted: boolean;
    permissions: {
      [key: string]: boolean;
    };
  }>;

  /**
   * Check the status of all permissions
   */
  checkPermissions(): Promise<{
    permissions: {
      [key: string]: boolean;
    };
  }>;
}

/**
 * Permission Manager Plugin
 * Handles all app permissions in one place
 */
export interface PermissionManager extends PermissionManagerPlugin {}

/**
 * Register the plugin with Capacitor
 */
export const PermissionManager = {
  /**
   * Request all necessary permissions for the app
   */
  async requestAllPermissions(): Promise<{
    granted: boolean;
    permissions: {
      [key: string]: boolean;
    };
  }> {
    return (window as any).Capacitor.Plugins.PermissionManager.requestAllPermissions();
  },

  /**
   * Check the status of all permissions
   */
  async checkPermissions(): Promise<{
    permissions: {
      [key: string]: boolean;
    };
  }> {
    return (window as any).Capacitor.Plugins.PermissionManager.checkPermissions();
  },

  /**
   * Add listener for permission changes
   */
  addListener(
    eventName: 'permissionResult',
    listenerFunc: (result: { granted: boolean; permissions: { [key: string]: boolean } }) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle {
    return (window as any).Capacitor.Plugins.PermissionManager.addListener(eventName, listenerFunc);
  },
};

export type PermissionManagerPluginType = typeof PermissionManager;
