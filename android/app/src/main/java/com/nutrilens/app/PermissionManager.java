package com.nutrilens.app;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PermissionManager")
public class PermissionManager extends Plugin {

    private static final String TAG = "PermissionManager";
    private static final int PERMISSION_REQUEST_CODE = 1001;
    
    // Permissions we need
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.CAMERA,
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.ACTIVITY_RECOGNITION
    };
    
    // Additional permissions for Android 13+
    private static final String[] ANDROID_13_PERMISSIONS = {
        Manifest.permission.READ_MEDIA_IMAGES
    };

    @PluginMethod
    public void requestAllPermissions(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        // Check Android version and add appropriate permissions
        String[] permissionsToRequest = getPermissionsToRequest();

        // Check which permissions are not granted
        java.util.ArrayList<String> permissionsNotGranted = new java.util.ArrayList<>();
        
        for (String permission : permissionsToRequest) {
            if (ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsNotGranted.add(permission);
            }
        }

        if (permissionsNotGranted.isEmpty()) {
            // All permissions already granted
            call.resolve(createPermissionResult(true));
        } else {
            // Request permissions directly using ActivityCompat
            String[] permissionsArray = permissionsNotGranted.toArray(new String[0]);
            
            // Run on UI thread
            activity.runOnUiThread(() -> {
                ActivityCompat.requestPermissions(activity, permissionsArray, PERMISSION_REQUEST_CODE);
            });
            
            // Check permissions after a delay to allow user to respond
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                boolean allGranted = true;
                for (String permission : permissionsArray) {
                    if (ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {
                        allGranted = false;
                        break;
                    }
                }
                call.resolve(createPermissionResult(allGranted));
            }, 5000); // Wait 5 seconds for user response
        }
    }
    
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        String[] permissionsToCheck = getPermissionsToRequest();
        java.util.HashMap<String, Boolean> permissionStatus = new java.util.HashMap<>();
        
        for (String permission : permissionsToCheck) {
            boolean granted = ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED;
            permissionStatus.put(permission, granted);
        }

        JSObject result = new JSObject();
        result.put("permissions", permissionStatus);
        call.resolve(result);
    }

    private String[] getPermissionsToRequest() {
        java.util.ArrayList<String> permissions = new java.util.ArrayList<>();
        
        // Add basic permissions
        for (String permission : REQUIRED_PERMISSIONS) {
            permissions.add(permission);
        }
        
        // Add Android 13+ specific permissions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            for (String permission : ANDROID_13_PERMISSIONS) {
                permissions.add(permission);
            }
        }
        
        return permissions.toArray(new String[0]);
    }
    
    private JSObject createPermissionResult(boolean allGranted) {
        JSObject result = new JSObject();
        result.put("allGranted", allGranted);
        result.put("message", allGranted ? "All permissions granted" : "Some permissions need to be granted");
        return result;
    }
}
