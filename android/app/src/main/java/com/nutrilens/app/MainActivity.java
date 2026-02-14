package com.nutrilens.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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
        // Request permissions needed for foreground step tracking service
        String[] permissions = {
            Manifest.permission.ACTIVITY_RECOGNITION,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        };
        
        // Check if permissions are already granted
        boolean activityRecognitionGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
        boolean fineLocationGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarseLocationGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        
        Log.d(TAG, "Permission check - Activity Recognition: " + activityRecognitionGranted);
        Log.d(TAG, "Permission check - Fine Location: " + fineLocationGranted);
        Log.d(TAG, "Permission check - Coarse Location: " + coarseLocationGranted);
        
        if (!activityRecognitionGranted || !fineLocationGranted || !coarseLocationGranted) {
            Log.d(TAG, "Requesting permissions for foreground step tracking service");
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        } else {
            Log.d(TAG, "All permissions already granted for foreground service");
            // Start step counter service if permission is already granted
            startStepCounterService();
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int i = 0; i < grantResults.length; i++) {
                if (grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    Log.d(TAG, "Permission denied: " + permissions[i]);
                }
            }
            
            if (allGranted) {
                Log.d(TAG, "All permissions granted for foreground service");
                // Start step counter service when all permissions are granted
                startStepCounterService();
            } else {
                Log.d(TAG, "Some permissions denied - foreground service may not work");
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
                // Use singleton SharedPreferences for consistency
                StepCounterService.updateGoal(getApplicationContext(), dailyGoal);
                
                Log.d(TAG, "Goal updated successfully from JS interface");
            } catch (Exception e) {
                Log.e(TAG, "Error updating goal from JS interface", e);
            }
        }
        
        @JavascriptInterface
        public int getCurrentSteps() {
            Log.d(TAG, "JS Interface getCurrentSteps called");
            
            // Get current steps from SharedPreferences
            int steps = StepCounterService.getCurrentSteps(getApplicationContext());
            Log.d(TAG, "JS Interface getCurrentSteps returning: " + steps);
            
            return steps;
        }
        
        @JavascriptInterface
        public void ensureStepService() {
            Log.d(TAG, "JS Interface ensureStepService called");
            try {
                startStepCounterService();
                Log.d(TAG, "Step counter service ensured running");
            } catch (Exception e) {
                Log.e(TAG, "Error ensuring step counter service", e);
            }
        }
        
        @JavascriptInterface
        public void resetForNewDay() {
            Log.d(TAG, "JS Interface resetForNewDay called");
            try {
                StepCounterService.ensureNewDay(getApplicationContext());
                Log.d(TAG, "New day reset ensured in native service");
            } catch (Exception e) {
                Log.e(TAG, "Error resetting for new day", e);
            }
        }
        
        @JavascriptInterface
        public int getHistoricalSteps(String date) {
            Log.d(TAG, "JS Interface getHistoricalSteps called for date: " + date);
            
            try {
                // Get SharedPreferences for historical data
                SharedPreferences prefs = getApplicationContext()
                        .getSharedPreferences("nutrilens_steps_prefs", Context.MODE_PRIVATE);
                String historicalKey = "steps_" + date;
                int historicalSteps = prefs.getInt(historicalKey, 0);
                
                Log.d(TAG, "JS Interface getHistoricalSteps returning: " + historicalSteps + " for date: " + date);
                return historicalSteps;
            } catch (Exception e) {
                Log.e(TAG, "Error getting historical steps for date: " + date, e);
                return 0;
            }
        }
    }
}
