package com.nutrilens.app;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class StepCounterService extends Service implements SensorEventListener {
    private static final String TAG = "StepCounterService";
    private static final String PREFS_NAME = "nutrilens_steps_prefs";
    private static final String STEPS_KEY = "today_steps";
    private static final String LAST_DATE_KEY = "last_step_date";
    
    private SensorManager sensorManager;
    private Sensor stepDetectorSensor;
    private PowerManager.WakeLock wakeLock;
    private SharedPreferences preferences;
    private int currentSteps = 0;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Step counter service created");
        
        preferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        // Use TYPE_STEP_DETECTOR for more accurate step detection
        stepDetectorSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR);
        
        // Acquire wake lock to keep service running
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "StepCounterService::WakeLock");
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Step counter service started");
        
        // Acquire wake lock
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(10 * 60 * 1000L); // 10 minutes
        }
        
        // Reset steps if it's a new day
        resetStepsIfNeeded();
        
        // Load current steps from preferences
        currentSteps = preferences.getInt(STEPS_KEY, 0);
        Log.d(TAG, "Loaded current steps: " + currentSteps);
        
        // Register step detector listener
        if (stepDetectorSensor != null) {
            boolean registered = sensorManager.registerListener(this, stepDetectorSensor, SensorManager.SENSOR_DELAY_UI);
            Log.d(TAG, "Step detector sensor registered: " + registered);
        } else {
            Log.e(TAG, "No step detector sensor available");
        }
        
        return START_STICKY; // Keep service running
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Step counter service destroyed");
        
        // Unregister sensor listener
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        
        // Release wake lock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_DETECTOR) {
            // Step detector triggers once per step detected
            Log.d(TAG, "Step detected!");
            
            // Increment step count by 1 for each detected step
            currentSteps++;
            saveSteps(currentSteps);
            
            // Update widget
            NutrilensWidgetUpdateService.updateWidget(this, currentSteps, getStepGoal());
            
            Log.d(TAG, "Steps updated: " + currentSteps);
        }
    }
    
    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        Log.d(TAG, "Sensor accuracy changed: " + accuracy);
    }
    
    private void resetStepsIfNeeded() {
        String currentDate = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        String lastDate = preferences.getString(LAST_DATE_KEY, "");
        
        if (!currentDate.equals(lastDate)) {
            Log.d(TAG, "New day detected, resetting steps");
            saveSteps(0);
            preferences.edit().putString(LAST_DATE_KEY, currentDate).apply();
        }
    }
    
    private void saveSteps(int steps) {
        preferences.edit()
                .putInt(STEPS_KEY, steps)
                .apply();
    }
    
    private int getStepGoal() {
        return preferences.getInt("daily_goal", 8000);
    }
    
    public static int getCurrentSteps(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getInt(STEPS_KEY, 0);
    }
    
    public static int getCurrentGoal(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getInt("daily_goal", 8000); // Default to 8000 if not set
    }
    
    public static void addSteps(Context context, int steps) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int currentSteps = prefs.getInt(STEPS_KEY, 0);
        int newSteps = currentSteps + steps;
        prefs.edit().putInt(STEPS_KEY, newSteps).apply();
        
        // Update widget with current goal
        int currentGoal = getCurrentGoal(context);
        NutrilensWidgetUpdateService.updateWidget(context, newSteps, currentGoal);
    }
    
    public static void updateGoal(Context context, int dailyGoal) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putInt("daily_goal", dailyGoal).apply();
        
        // Update widget with new goal
        int currentSteps = getCurrentSteps(context);
        NutrilensWidgetUpdateService.updateWidget(context, currentSteps, dailyGoal);
        
        Log.d(TAG, "Step goal updated to: " + dailyGoal);
    }
}
