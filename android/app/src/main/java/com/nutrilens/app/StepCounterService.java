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
    private boolean isSensorRegistered = false;
    private long lastStepTime = 0;
    private static final long STEP_DELAY_MS = 300; // Minimum 300ms between steps
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Step counter service created");
        
        // Use singleton SharedPreferences to ensure consistency
        preferences = getSharedPreferences(this);
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
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_DETECTOR) {
            long currentTime = System.currentTimeMillis();
            
            // Filter out false positives - require minimum time between steps
            if (currentTime - lastStepTime < STEP_DELAY_MS) {
                Log.d(TAG, "Ignoring step - too soon after previous step");
                return;
            }
            
            lastStepTime = currentTime;
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
            Log.d(TAG, "Step detector sensor registered: " + registered);
            
            if (!registered) {
                Log.e(TAG, "Failed to register step detector sensor");
            }
        } else {
            Log.e(TAG, "No step detector sensor available");
        }
    }
    
    public static int getCurrentSteps(Context context) {
        // Use singleton SharedPreferences to ensure consistency
        SharedPreferences prefs = getSharedPreferences(context);
        int steps = prefs.getInt(STEPS_KEY, 0);
        Log.d(TAG, "getCurrentSteps retrieved: " + steps + " from SharedPreferences");
        return steps;
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
