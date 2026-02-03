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

@CapacitorPlugin(name = "PermissionRequester")
public class PermissionRequester extends Plugin {

    private static final String TAG = "PermissionRequester";
    private static final int PERMISSION_REQUEST_CODE = 2002;
    
    // Critical permissions for step tracking
    private static final String[] CRITICAL_PERMISSIONS = {
        Manifest.permission.ACTIVITY_RECOGNITION,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    };
    
    // Additional permissions
    private static final String[] ADDITIONAL_PERMISSIONS = {
        Manifest.permission.CAMERA,
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE
    };
    
    // Android 13+ permissions
    private static final String[] ANDROID_13_PERMISSIONS = {
        Manifest.permission.READ_MEDIA_IMAGES
    };

    @PluginMethod
    public void requestCriticalPermissions(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        Log.d(TAG, "Requesting critical permissions for step tracking");

        // Force request critical permissions
        requestPermissionsWithDialog(activity, CRITICAL_PERMISSIONS, call);
    }
    
    @PluginMethod
    public void requestAllPermissions(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        Log.d(TAG, "Requesting all permissions");

        // Combine all permissions
        java.util.ArrayList<String> allPermissions = new java.util.ArrayList<>();
        
        // Add critical permissions
        for (String permission : CRITICAL_PERMISSIONS) {
            allPermissions.add(permission);
        }
        
        // Add additional permissions
        for (String permission : ADDITIONAL_PERMISSIONS) {
            allPermissions.add(permission);
        }
        
        // Add Android 13+ permissions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            for (String permission : ANDROID_13_PERMISSIONS) {
                allPermissions.add(permission);
            }
        }
        
        String[] permissionsArray = allPermissions.toArray(new String[0]);
        requestPermissionsWithDialog(activity, permissionsArray, call);
    }
    
    private void requestPermissionsWithDialog(Activity activity, String[] permissions, PluginCall call) {
        // Check which permissions need to be requested
        java.util.ArrayList<String> permissionsToRequest = new java.util.ArrayList<>();
        
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission);
                Log.d(TAG, "Permission not granted: " + permission);
            } else {
                Log.d(TAG, "Permission already granted: " + permission);
            }
        }

        if (permissionsToRequest.isEmpty()) {
            Log.d(TAG, "All permissions already granted");
            call.resolve(createResult(true, "All permissions already granted"));
            return;
        }

        // Force show permission dialog
        String[] requestArray = permissionsToRequest.toArray(new String[0]);
        Log.d(TAG, "Requesting permissions: " + java.util.Arrays.toString(requestArray));
        
        // Run on UI thread to ensure dialog appears
        activity.runOnUiThread(() -> {
            ActivityCompat.requestPermissions(activity, requestArray, PERMISSION_REQUEST_CODE);
        });
        
        // Wait for user response and check result
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            boolean allGranted = true;
            StringBuilder deniedPermissions = new StringBuilder();
            
            for (String permission : requestArray) {
                if (ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    deniedPermissions.append(permission).append(", ");
                }
            }
            
            if (allGranted) {
                Log.d(TAG, "All permissions granted successfully");
                call.resolve(createResult(true, "All permissions granted"));
            } else {
                Log.d(TAG, "Some permissions denied: " + deniedPermissions.toString());
                call.resolve(createResult(false, "Some permissions denied: " + deniedPermissions.toString()));
            }
        }, 3000); // Wait 3 seconds for user response
    }
    
    @PluginMethod
    public void checkPermissionStatus(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        JSObject result = new JSObject();
        
        // Check critical permissions
        for (String permission : CRITICAL_PERMISSIONS) {
            boolean granted = ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED;
            result.put(permission, granted);
            Log.d(TAG, "Permission " + permission + ": " + (granted ? "GRANTED" : "DENIED"));
        }
        
        call.resolve(result);
    }
    
    private JSObject createResult(boolean success, String message) {
        JSObject result = new JSObject();
        result.put("success", success);
        result.put("message", message);
        return result;
    }
}
