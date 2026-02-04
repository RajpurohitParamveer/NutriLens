package com.nutrilens.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "MainActivity";
    private static final int PERMISSION_REQUEST_CODE = 1001;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Request permissions on app start
        requestStepTrackingPermissions();
    }
    
    @Override
    public void onStart() {
        super.onStart();
        // Add JavaScript interface after the web view is ready
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new WidgetJSInterface(), "AndroidWidget");
        }
    }
    
    private void requestStepTrackingPermissions() {
        // Only request Activity Recognition for step tracking
        String[] permissions = {
            Manifest.permission.ACTIVITY_RECOGNITION
        };
        
        // Check if permission is already granted
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACTIVITY_RECOGNITION) != PackageManager.PERMISSION_GRANTED) {
            Log.d(TAG, "Requesting Activity Recognition permission");
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        } else {
            Log.d(TAG, "Activity Recognition permission already granted");
            // Start step counter service if permission is already granted
            startStepCounterService();
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Activity Recognition permission granted");
                // Start step counter service when permission is granted
                startStepCounterService();
            } else {
                Log.d(TAG, "Activity Recognition permission denied");
            }
        }
    }
    
    private void startStepCounterService() {
        try {
            Intent serviceIntent = new Intent(this, StepCounterService.class);
            startService(serviceIntent);
            Log.d(TAG, "Step counter service started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start step counter service", e);
        }
    }
    
    // Bridge methods for widget updates
    public void updateWidget(int steps, int dailyGoal) {
        Log.d(TAG, "updateWidget called with steps: " + steps + ", goal: " + dailyGoal);
        NutrilensWidgetUpdateService.updateWidget(this, steps, dailyGoal);
    }
    
    public void updateGoal(int dailyGoal) {
        Log.d(TAG, "updateGoal called with goal: " + dailyGoal);
        StepCounterService.updateGoal(this, dailyGoal);
    }
    
    // JavaScript interface for web view calls
    public class WidgetJSInterface {
        private boolean isUpdatingWidget = false;
        
        @JavascriptInterface
        public void updateWidget(int steps, int dailyGoal) {
            // Prevent infinite recursion
            if (isUpdatingWidget) {
                Log.d(TAG, "Widget update already in progress, skipping");
                return;
            }
            
            try {
                isUpdatingWidget = true;
                Log.d(TAG, "JS Interface updateWidget called with steps: " + steps + ", goal: " + dailyGoal);
                
                // Call widget service directly to avoid recursion
                NutrilensWidgetUpdateService.updateWidget(MainActivity.this, steps, dailyGoal);
                
                Log.d(TAG, "Widget updated successfully from JS interface");
            } catch (Exception e) {
                Log.e(TAG, "Error updating widget from JS interface", e);
            } finally {
                isUpdatingWidget = false;
            }
        }
        
        @JavascriptInterface
        public void updateGoal(int dailyGoal) {
            Log.d(TAG, "JS Interface updateGoal called with goal: " + dailyGoal);
            
            try {
                // Call StepCounterService directly to avoid recursion
                StepCounterService.updateGoal(MainActivity.this, dailyGoal);
                
                Log.d(TAG, "Goal updated successfully from JS interface");
            } catch (Exception e) {
                Log.e(TAG, "Error updating goal from JS interface", e);
            }
        }
        
        @JavascriptInterface
        public int getCurrentSteps() {
            Log.d(TAG, "JS Interface getCurrentSteps called");
            
            // Ensure service is running
            try {
                Intent serviceIntent = new Intent(MainActivity.this, StepCounterService.class);
                startService(serviceIntent);
                Log.d(TAG, "Step counter service start requested");
            } catch (Exception e) {
                Log.e(TAG, "Failed to start step counter service", e);
            }
            
            return StepCounterService.getCurrentSteps(MainActivity.this);
        }
    }
}
