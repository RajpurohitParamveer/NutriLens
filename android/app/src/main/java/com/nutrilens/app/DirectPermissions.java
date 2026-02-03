package com.nutrilens.app;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DirectPermissions")
public class DirectPermissions extends Plugin {

    private static final String TAG = "DirectPermissions";
    private static final int PERMISSION_REQUEST_CODE = 3003;

    @PluginMethod
    public void requestStepTrackingPermissions(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        Log.d(TAG, "Directly requesting step tracking permissions");

        // Only critical permission for step tracking
        String[] stepPermissions = {
            Manifest.permission.ACTIVITY_RECOGNITION
        };

        // Check and request permission
        boolean needRequest = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACTIVITY_RECOGNITION) != PackageManager.PERMISSION_GRANTED;

        if (needRequest) {
            Log.d(TAG, "Requesting ACTIVITY_RECOGNITION permission");
            // Request permission immediately
            ActivityCompat.requestPermissions(activity, stepPermissions, PERMISSION_REQUEST_CODE);
            
            // Wait a moment and check result
            new android.os.Handler().postDelayed(() -> {
                boolean granted = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
                
                JSObject result = new JSObject();
                result.put("granted", granted);
                result.put("message", granted ? "Activity recognition permission granted" : "Activity recognition permission denied");
                Log.d(TAG, "Activity recognition permission " + (granted ? "GRANTED" : "DENIED"));
                call.resolve(result);
            }, 2000);
        } else {
            Log.d(TAG, "Activity recognition permission already granted");
            JSObject result = new JSObject();
            result.put("granted", true);
            result.put("message", "Activity recognition permission already granted");
            call.resolve(result);
        }
    }

    @PluginMethod
    public void checkStepPermissions(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        JSObject result = new JSObject();
        
        // Only check activity recognition permission
        boolean activityRecognition = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
        
        result.put("activityRecognition", activityRecognition);
        result.put("allGranted", activityRecognition);
        
        Log.d(TAG, "Activity recognition permission: " + (activityRecognition ? "GRANTED" : "DENIED"));
        
        call.resolve(result);
    }
}
