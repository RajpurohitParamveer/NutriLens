package com.nutrilens.app;

import android.Manifest;
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
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Activity Recognition permission granted");
            } else {
                Log.d(TAG, "Activity Recognition permission denied");
            }
        }
    }
    
    // Bridge methods for widget updates
    public void updateWidget(int steps, int dailyGoal) {
        Log.d(TAG, "updateWidget called with steps: " + steps + ", goal: " + dailyGoal);
        NutrilensWidgetUpdateService.updateWidget(this, steps, dailyGoal);
    }
    
    public void updateGoal(int dailyGoal) {
        Log.d(TAG, "updateGoal called with goal: " + dailyGoal);
        NutrilensWidgetUpdateService.updateGoal(this, dailyGoal);
    }
    
    // JavaScript interface for web view calls
    public class WidgetJSInterface {
        @JavascriptInterface
        public void updateWidget(int steps, int dailyGoal) {
            Log.d(TAG, "JS Interface updateWidget called");
            updateWidget(steps, dailyGoal);
        }
        
        @JavascriptInterface
        public void updateGoal(int dailyGoal) {
            Log.d(TAG, "JS Interface updateGoal called");
            updateGoal(dailyGoal);
        }
    }
}
