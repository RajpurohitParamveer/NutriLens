import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nutrilens.app',
  appName: 'NutriLens',
  webDir: 'dist',
  // androidScheme: 'https' can cause black screen when loading from bundled assets; use default capacitor://
  server: {
    // androidScheme: 'https' // Commented out to prevent white screen issues
  },
  android: {
    webContentsDebuggingEnabled: false
  },
  plugins: {
    Camera: {
      permissions: {
        camera: 'This app uses the camera to scan nutrition labels.',
        photos: 'This app needs access to your photos to select images.'
      }
    },
    WebView: {
      allowFileAccessFromFileURLs: true,
      allowUniversalAccessFromFileURLs: true,
      overrideUserAgent: 'NutriLens App',
      appendUserAgent: 'NutriLens/1.0'
    }
  }
};

export default config;
