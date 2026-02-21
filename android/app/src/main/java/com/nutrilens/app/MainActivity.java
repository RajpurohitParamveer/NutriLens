package com.nutrilens.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
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
        
        // Request minimal permission on app start
        requestStepTrackingPermissions();
        // Ensure periodic widget updates are scheduled
        StepWidgetUpdateWorker.ensureScheduled(getApplicationContext());
        try {
            Intent svc = new Intent(this, StepForegroundService.class);
            if (android.os.Build.VERSION.SDK_INT >= 26) {
                startForegroundService(svc);
            } else {
                startService(svc);
            }
        } catch (Throwable ignored) {}
        handleDeepLink(getIntent());
    }
    
    @Override
    public void onResume() {
        super.onResume();
        StepCounterOneShot.readSteps(getApplicationContext(), steps -> {
            try {
                int goal = StepCounterService.getCurrentGoal(getApplicationContext());
                NutrilensWidgetUpdateService.updateWidget(getApplicationContext(), steps, goal);
            } catch (Throwable ignored) {}
        });
    }
    
    @Override
    public void onStart() {
        super.onStart();
        // Add JavaScript interface after the web view is ready
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new WidgetJSInterface(), "AndroidWidget");
        }
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }
    
    private void handleDeepLink(Intent intent) {
        if (intent == null) return;
        if (!Intent.ACTION_VIEW.equals(intent.getAction())) return;
        Uri data = intent.getData();
        if (data == null) return;
        if (!"nutrilens".equalsIgnoreCase(data.getScheme())) return;
        if (!"app".equalsIgnoreCase(data.getHost())) return;
        if (!"/addsteps".equals(data.getPath())) return;
        
        try {
            String yesterdayParam = data.getQueryParameter("yesterday");
            String stepsParam = data.getQueryParameter("steps");
            String dateParam = data.getQueryParameter("date");
            
            int addSteps = -1;
            if (yesterdayParam != null) {
                addSteps = Integer.parseInt(yesterdayParam);
                java.util.Calendar cal = java.util.Calendar.getInstance();
                cal.add(java.util.Calendar.DAY_OF_YEAR, -1);
                dateParam = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(cal.getTime());
            } else if (stepsParam != null && dateParam != null) {
                addSteps = Integer.parseInt(stepsParam);
            }
            
            if (addSteps <= 0 || dateParam == null || dateParam.isEmpty()) {
                Toast.makeText(this, "Invalid parameters for addsteps", Toast.LENGTH_SHORT).show();
                return;
            }
            
            SharedPreferences prefs = getApplicationContext().getSharedPreferences("nutrilens_steps_prefs", Context.MODE_PRIVATE);
            String key = "steps_" + dateParam;
            int prev = prefs.getInt(key, 0);
            int next = Math.max(0, prev + addSteps);
            prefs.edit().putInt(key, next).apply();
            int goal = StepCounterService.getCurrentGoal(getApplicationContext());
            NutrilensWidgetUpdateService.updateWidget(getApplicationContext(), prefs.getInt("today_steps", 0), goal);
            Toast.makeText(this, "Added " + addSteps + " to " + dateParam + " (now " + next + ")", Toast.LENGTH_LONG).show();
            Log.d(TAG, "Deep link addsteps applied: date=" + dateParam + " prev=" + prev + " next=" + next);
        } catch (Throwable t) {
            Log.e(TAG, "Failed to handle addsteps deep link", t);
            Toast.makeText(this, "Failed to add steps: " + t.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
    
    private void requestStepTrackingPermissions() {
        // Only Activity Recognition is required for TYPE_STEP_COUNTER on Android 10+
        String[] permissions = {
            Manifest.permission.ACTIVITY_RECOGNITION
        };
        
        // Check if permissions are already granted
        boolean activityRecognitionGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
        
        Log.d(TAG, "Permission check - Activity Recognition: " + activityRecognitionGranted);
        // No location permission required
        
        if (!activityRecognitionGranted) {
            Log.d(TAG, "Requesting Activity Recognition permission");
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        } else {
            Log.d(TAG, "Activity Recognition permission already granted");
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
            
            Log.d(TAG, "Permissions result processed. Activity Recognition granted=" + allGranted);
        }
    }
    
    // Deprecated in new design; keeping method for compatibility (no-op)
    private void startStepCounterService() { }
    
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
            
            // One-shot read from hardware counter; no background service
            int steps = StepCounterOneShot.readCurrentStepsSync(getApplicationContext());
            Log.d(TAG, "JS Interface getCurrentSteps returning: " + steps);
            
            return steps;
        }
        
        @JavascriptInterface
        public void ensureStepService() {
            Log.d(TAG, "JS Interface ensureStepService called");
            // No longer needed; we rely on one-shot sensor reads
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
        
        @JavascriptInterface
        public void addStepsToYesterday(int steps) {
            try {
                java.util.Calendar cal = java.util.Calendar.getInstance();
                cal.add(java.util.Calendar.DAY_OF_YEAR, -1);
                String date = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(cal.getTime());
                SharedPreferences prefs = getApplicationContext().getSharedPreferences("nutrilens_steps_prefs", Context.MODE_PRIVATE);
                String key = "steps_" + date;
                int prev = prefs.getInt(key, 0);
                int next = Math.max(0, prev + steps);
                prefs.edit().putInt(key, next).apply();
                Log.d(TAG, "Added steps to yesterday " + date + ": " + prev + " -> " + next);
            } catch (Exception e) {
                Log.e(TAG, "Error adding steps to yesterday", e);
            }
        }
        
        @JavascriptInterface
        public void addHistoricalSteps(String date, int steps) {
            try {
                SharedPreferences prefs = getApplicationContext().getSharedPreferences("nutrilens_steps_prefs", Context.MODE_PRIVATE);
                String key = "steps_" + date;
                int prev = prefs.getInt(key, 0);
                int next = Math.max(0, prev + steps);
                prefs.edit().putInt(key, next).apply();
                Log.d(TAG, "Added steps to " + date + ": " + prev + " -> " + next);
            } catch (Exception e) {
                Log.e(TAG, "Error adding steps to " + date, e);
            }
        }
    }
}
