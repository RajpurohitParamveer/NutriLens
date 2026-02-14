package com.nutrilens.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.nutrilens.app.MainActivity;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class StepCounterService extends Service implements SensorEventListener {
    private static final String TAG = "StepCounterService";
    private static final String PREFS_NAME = "nutrilens_steps_prefs";
    private static final String STEPS_KEY = "today_steps";
    private static final String LAST_DATE_KEY = "last_step_date";
    private static final String CHANNEL_ID = "step_counter_channel";
    private static final int NOTIFICATION_ID = 1;
    
    // Singleton SharedPreferences manager
    private static SharedPreferences sharedPreferencesInstance;
    
    // Static instance reference for getCurrentSteps()
    private static StepCounterService instance;
    
    /**
     * Get the singleton SharedPreferences instance
     */
    public static synchronized SharedPreferences getSharedPreferences(Context context) {
        if (sharedPreferencesInstance == null) {
            sharedPreferencesInstance = context.getApplicationContext()
                    .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        }
        return sharedPreferencesInstance;
    }
    
    
    private SensorManager sensorManager;
    private Sensor stepDetectorSensor;
    private PowerManager.WakeLock wakeLock;
    private SharedPreferences preferences;
    private int currentSteps = 0;
    private int baselineSteps = 0; // Baseline for cumulative step counter
    private boolean isSensorRegistered = false;
    private long lastStepTime = 0;
    private static final long STEP_DELAY_MS = 150; // Reduced to 150ms between steps for better sensitivity
    private java.util.Timer midnightTimer;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Step counter service created");
        
        // Set static instance reference for getCurrentSteps()
        instance = this;
        
        // Use singleton SharedPreferences to ensure consistency
        preferences = getSharedPreferences(this);
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        // Use TYPE_STEP_COUNTER for more accurate cumulative step counting
        stepDetectorSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        
        // Acquire wake lock to keep service running
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "StepCounterService::WakeLock");
        
        // Do not override LAST_DATE_KEY on start; rollover logic will handle updates
        
        // Schedule midnight check every minute
        midnightTimer = new java.util.Timer(true);
        midnightTimer.scheduleAtFixedRate(new java.util.TimerTask() {
            @Override
            public void run() {
                try {
                    resetStepsIfNeeded();
                } catch (Exception e) {
                    Log.e(TAG, "Midnight check failed", e);
                }
            }
        }, 60000L, 60000L);
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Step counter service started");
        
        // Don't restart if already running
        if (isSensorRegistered) {
            Log.d(TAG, "Service already running with sensor registered");
            return START_STICKY;
        }
        
        // Start as foreground service to keep running when app is closed
        startForegroundService();
        
        // Acquire wake lock for longer duration
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(60 * 60 * 1000L); // 1 hour instead of 10 minutes
        }
        
        // Reset steps if it's a new day
        resetStepsIfNeeded();
        
        // Load current steps from preferences
        currentSteps = preferences.getInt(STEPS_KEY, 0);
        Log.d(TAG, "Loaded current steps: " + currentSteps);
        
        // Register step detector listener with proper error handling
        registerStepSensor();
        
        return START_STICKY; // Keep service running
    }
    
    private void startForegroundService() {
        createNotificationChannel();
        
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);
        
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Nutrilens Step Counter")
                .setContentText("Tracking your steps in the background")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .build();
        
        startForeground(NOTIFICATION_ID, notification);
        Log.d(TAG, "Foreground service started with notification");
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Step Counter Service",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            serviceChannel.setDescription("Keeps track of your steps even when the app is closed");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Step counter service destroyed");
        
        // Clear static instance reference
        instance = null;
        
        // Unregister sensor listener
        if (sensorManager != null && isSensorRegistered) {
            sensorManager.unregisterListener(this);
            isSensorRegistered = false;
            Log.d(TAG, "Sensor listener unregistered");
        }
        
        // Release wake lock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "Wake lock released");
        }
        
        if (midnightTimer != null) {
            try {
                midnightTimer.cancel();
            } catch (Exception ignored) {}
            midnightTimer = null;
        }
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            // TYPE_STEP_COUNTER provides cumulative steps since device boot
            // We need to calculate today's steps by subtracting the baseline
            long currentTime = System.currentTimeMillis();
            
            // Get the cumulative steps from the sensor
            int cumulativeSteps = (int) event.values[0];
            
            // Before computing today's steps, ensure date rollover is handled
            try {
                String currentDateStr = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
                String lastDateStr = preferences.getString(LAST_DATE_KEY, "");
                if (lastDateStr != null && !lastDateStr.isEmpty() && !currentDateStr.equals(lastDateStr)) {
                    // Save yesterday's steps
                    preferences.edit().putInt("steps_" + lastDateStr, currentSteps).apply();
                    // Advance baseline to exclude yesterday's steps from today
                    baselineSteps = baselineSteps + currentSteps;
                    preferences.edit().putInt("baseline_steps", baselineSteps).apply();
                    // Reset today's steps and update last date
                    saveSteps(0);
                    currentSteps = 0;
                    preferences.edit().putString(LAST_DATE_KEY, currentDateStr).apply();
                    Log.d(TAG, "onSensorChanged rollover: baseline advanced and today reset");
                }
            } catch (Exception e) {
                Log.e(TAG, "onSensorChanged rollover check failed", e);
            }
            
            // If this is the first reading, establish baseline only if we don't have one
            if (baselineSteps == 0) {
                // Try to load saved baseline from preferences
                int savedBaseline = preferences.getInt("baseline_steps", 0);
                if (savedBaseline > 0) {
                    if (cumulativeSteps >= savedBaseline) {
                        // Normal case: restore saved baseline
                        baselineSteps = savedBaseline;
                        Log.d(TAG, "Restored baseline steps: " + baselineSteps);
                    } else {
                        // Device reboot case: cumulative steps reset to lower value
                        // Establish new baseline and calculate offset for today's steps
                        Log.d(TAG, "Device reboot detected - cumulative steps (" + cumulativeSteps + 
                              ") lower than saved baseline (" + savedBaseline + ")");
                        baselineSteps = cumulativeSteps;
                        preferences.edit().putInt("baseline_steps", baselineSteps).apply();
                        Log.d(TAG, "Establishing new baseline after reboot: " + baselineSteps);
                    }
                } else {
                    // First time running - establish new baseline
                    baselineSteps = cumulativeSteps;
                    preferences.edit().putInt("baseline_steps", baselineSteps).apply();
                    Log.d(TAG, "Establishing initial baseline steps: " + baselineSteps);
                }
                return;
            }
            
            // Calculate today's steps by subtracting baseline
            int todaySteps = cumulativeSteps - baselineSteps;
            
            // Only update if we have meaningful steps and enough time has passed
            if (todaySteps > currentSteps && (currentTime - lastStepTime >= STEP_DELAY_MS)) {
                lastStepTime = currentTime;
                currentSteps = todaySteps;
                saveSteps(currentSteps);
                
                // Update widget
                NutrilensWidgetUpdateService.updateWidget(this, currentSteps, getStepGoal());
                
                Log.d(TAG, "Steps updated: " + currentSteps + " (cumulative: " + cumulativeSteps + ", baseline: " + baselineSteps + ")");
            }
        }
    }
    
    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        Log.d(TAG, "Sensor accuracy changed: " + accuracy);
    }
    
    private void resetStepsIfNeeded() {
        String currentDate = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        String lastDate = preferences.getString(LAST_DATE_KEY, "");
        
        Log.d(TAG, "resetStepsIfNeeded - currentDate: " + currentDate + ", lastDate: " + lastDate);
        
        if (!currentDate.equals(lastDate)) {
            // Save yesterday's steps before resetting
            if (!lastDate.isEmpty() && currentSteps > 0) {
                Log.d(TAG, "Saving yesterday's steps: " + currentSteps + " for date: " + lastDate);
                // Save to historical data (could be expanded to save to database)
                preferences.edit()
                    .putInt("steps_" + lastDate, currentSteps)
                    .apply();
            }
            
            Log.d(TAG, "New day detected, resetting steps from " + currentSteps + " to 0");
            // Advance baseline to exclude yesterday's steps from today's count
            baselineSteps = baselineSteps + currentSteps;
            preferences.edit().putInt("baseline_steps", baselineSteps).apply();
            saveSteps(0);
            currentSteps = 0; // Also update the in-memory variable
            preferences.edit()
                .putString(LAST_DATE_KEY, currentDate)
                .apply();
        } else {
            Log.d(TAG, "Same day, keeping current steps: " + currentSteps);
        }
    }
    
    private void saveSteps(int steps) {
        preferences.edit()
                .putInt(STEPS_KEY, steps)
                .apply();
        Log.d(TAG, "Steps saved to SharedPreferences: " + steps);
    }
    
    private int getStepGoal() {
        return preferences.getInt("daily_goal", 8000);
    }
    
    private void registerStepSensor() {
        if (isSensorRegistered) {
            Log.d(TAG, "Sensor already registered");
            return;
        }
        
        if (stepDetectorSensor != null) {
            boolean registered = sensorManager.registerListener(
                this, 
                stepDetectorSensor, 
                SensorManager.SENSOR_DELAY_UI
            );
            isSensorRegistered = registered;
            Log.d(TAG, "Step counter sensor registered: " + registered);
            
            if (!registered) {
                Log.e(TAG, "Failed to register step counter sensor");
            }
        } else {
            Log.e(TAG, "No step counter sensor available");
        }
    }
    
    public static int getCurrentSteps(Context context) {
        // Ensure we don't carry over yesterday's steps
        ensureNewDay(context);
        // First try to get from service instance (most up-to-date)
        if (instance != null) {
            Log.d(TAG, "getCurrentSteps retrieved: " + instance.currentSteps + " from service instance");
            return instance.currentSteps;
        }
        
        // Fallback to SharedPreferences if service instance not available
        SharedPreferences prefs = getSharedPreferences(context);
        int storedSteps = prefs.getInt(STEPS_KEY, 0);
        
        Log.d(TAG, "getCurrentSteps retrieved: " + storedSteps + " from SharedPreferences (service instance null)");
        return storedSteps;
    }
    
    /**
     * Advance baseline and reset storage if the stored last date differs from today.
     * This prevents yesterday's steps from being included in today's total.
     */
    public static void ensureNewDay(Context context) {
        try {
            SharedPreferences prefs = getSharedPreferences(context);
            String currentDate = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
            String lastDate = prefs.getString(LAST_DATE_KEY, "");
            if (lastDate != null && !lastDate.isEmpty() && !currentDate.equals(lastDate)) {
                int yesterdaySteps = prefs.getInt(STEPS_KEY, 0);
                int baseline = prefs.getInt("baseline_steps", 0);
                
                // Save yesterday's steps to historical key if not already saved
                prefs.edit().putInt("steps_" + lastDate, yesterdaySteps).apply();
                
                // Advance baseline to exclude yesterday
                baseline = baseline + yesterdaySteps;
                prefs.edit().putInt("baseline_steps", baseline).apply();
                
                // Reset today's storage to 0 and update last date
                prefs.edit()
                        .putInt(STEPS_KEY, 0)
                        .putString(LAST_DATE_KEY, currentDate)
                        .apply();
                
                // Update in-memory instance if available
                if (instance != null) {
                    instance.baselineSteps = baseline;
                    instance.currentSteps = 0;
                }
                
                Log.d(TAG, "ensureNewDay applied: baseline advanced, yesterday saved, today reset");
            }
        } catch (Exception e) {
            Log.e(TAG, "ensureNewDay failed", e);
        }
    }
    
    public static int getCurrentGoal(Context context) {
        // Use singleton SharedPreferences to ensure consistency
        SharedPreferences prefs = getSharedPreferences(context);
        return prefs.getInt("daily_goal", 8000); // Default to 8000 if not set
    }
    
    public static void addSteps(Context context, int steps) {
        // Use singleton SharedPreferences to ensure consistency
        SharedPreferences prefs = getSharedPreferences(context);
        int currentSteps = prefs.getInt(STEPS_KEY, 0);
        int newSteps = currentSteps + steps;
        prefs.edit().putInt(STEPS_KEY, newSteps).apply();
        
        // Update widget with current goal
        int currentGoal = getCurrentGoal(context);
        NutrilensWidgetUpdateService.updateWidget(context, newSteps, currentGoal);
    }
    
    public static void updateGoal(Context context, int dailyGoal) {
        // Use singleton SharedPreferences to ensure consistency
        SharedPreferences prefs = getSharedPreferences(context);
        prefs.edit().putInt("daily_goal", dailyGoal).apply();
        
        // Update widget with new goal
        int currentSteps = getCurrentSteps(context);
        NutrilensWidgetUpdateService.updateWidget(context, currentSteps, dailyGoal);
        
        Log.d(TAG, "Step goal updated to: " + dailyGoal);
    }
}
