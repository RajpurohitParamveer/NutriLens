package com.nutrilens.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class StepCounterOneShot {

    private static final String TAG = "StepOneShot";
    private static final String PREFS = "nutrilens_steps_prefs";
    private static final String KEY_LAST_RAW = "last_raw_counter";
    private static final String KEY_BASELINE_DAY = "baseline_day";
    private static final String KEY_REBOOT_OFFSET = "reboot_offset";
    private static final String KEY_LAST_DATE = "last_step_date";
    private static final String KEY_TODAY_STEPS = "today_steps";

    public interface Callback {
        void onResult(int todaySteps);
    }

    /**
     * Blocking one-shot read. Registers a listener, waits up to 3s for a value,
     * falls back to last persisted raw counter, computes today's steps by baseline subtraction,
     * unregisters, and returns the computed steps.
     */
    public static int readCurrentStepsSync(Context context) {
        SensorManager sensorManager =
                (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
        Sensor stepSensor =
                sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);

        if (stepSensor == null) {
            Log.e(TAG, "Step counter sensor not available (sync)");
            return 0;
        }

        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        float lastRaw = prefs.getFloat(KEY_LAST_RAW, -1f);

        CountDownLatch latch = new CountDownLatch(1);
        final float[] currentRaw = {-1f};

        SensorEventListener listener = new SensorEventListener() {
            @Override
            public void onSensorChanged(SensorEvent event) {
                currentRaw[0] = event.values[0];
                latch.countDown();
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        };

        try {
            sensorManager.registerListener(
                    listener,
                    stepSensor,
                    SensorManager.SENSOR_DELAY_FASTEST
            );
            try { sensorManager.flush(listener); } catch (Throwable ignored) {}
            latch.await(3, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
        } finally {
            try { sensorManager.unregisterListener(listener); } catch (Throwable ignored) {}
        }

        boolean hasEvent = currentRaw[0] >= 0;
        float rawToUse = hasEvent ? currentRaw[0] : lastRaw;
        int steps = computeAndPersist(context, rawToUse, hasEvent);
        return steps;
    }

    public static void readSteps(Context context, Callback callback) {

        new Thread(() -> {

            SensorManager sensorManager =
                    (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);

            Sensor stepSensor =
                    sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);

            if (stepSensor == null) {
                Log.e(TAG, "Step counter sensor not available");
                new Handler(Looper.getMainLooper())
                        .post(() -> callback.onResult(0));
                return;
            }

            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            float lastRaw = prefs.getFloat(KEY_LAST_RAW, -1f);

            CountDownLatch latch = new CountDownLatch(1);
            final float[] currentRaw = {-1f};

            SensorEventListener listener = new SensorEventListener() {
                @Override
                public void onSensorChanged(SensorEvent event) {
                    currentRaw[0] = event.values[0];
                    latch.countDown();
                }

                @Override
                public void onAccuracyChanged(Sensor sensor, int accuracy) {}
            };

            Log.d(TAG, "Registering one-shot listener");

            sensorManager.registerListener(
                    listener,
                    stepSensor,
                    SensorManager.SENSOR_DELAY_FASTEST
            );

            try {
                latch.await(3, TimeUnit.SECONDS);
            } catch (InterruptedException ignored) {}

            sensorManager.unregisterListener(listener);

            Log.d(TAG, "Listener unregistered");

            boolean hasEvent = currentRaw[0] >= 0;
            float rawToUse = hasEvent ? currentRaw[0] : lastRaw;
            int finalSteps = computeAndPersist(context, rawToUse, hasEvent);

            new Handler(Looper.getMainLooper())
                    .post(() -> callback.onResult(finalSteps));

        }).start();
    }

    private static int computeAndPersist(Context context, float currentRaw, boolean hasNewEvent) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (currentRaw < 0) currentRaw = 0f;

        float lastRaw = getFloatCompat(prefs, KEY_LAST_RAW, -1f);
        float rebootOffset = getFloatCompat(prefs, KEY_REBOOT_OFFSET, 0f);
        float baselineDay = getFloatCompat(prefs, KEY_BASELINE_DAY, -1f);
        String lastDate = prefs.getString(KEY_LAST_DATE, null);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());

        boolean rebooted = lastRaw >= 0 && currentRaw < lastRaw;
        if (rebooted) {
            rebootOffset += lastRaw;
            Log.d(TAG, "Reboot detected, increasing rebootOffset by lastRaw=" + lastRaw + " to " + rebootOffset);
        }

        float cumulative = currentRaw + rebootOffset;

        boolean newDay = (lastDate == null) || !today.equals(lastDate);
        if (newDay) {
            baselineDay = cumulative;
            lastDate = today;
            Log.d(TAG, "New day detected, resetting baselineDay to " + baselineDay + " for date " + today);
        }

        if (baselineDay < 0) {
            baselineDay = cumulative;
            if (lastDate == null) lastDate = today;
        }

        int todaySteps = (int) Math.max(0, Math.floor(cumulative - baselineDay));

        SharedPreferences.Editor e = prefs.edit();
        if (hasNewEvent) {
            e.putFloat(KEY_LAST_RAW, currentRaw);
        }
        e.putFloat(KEY_REBOOT_OFFSET, rebootOffset);
        e.putFloat(KEY_BASELINE_DAY, baselineDay);
        e.putString(KEY_LAST_DATE, lastDate);
        e.putInt(KEY_TODAY_STEPS, todaySteps);
        e.apply();

        return todaySteps;
    }

    /**
     * Tolerant float reader to avoid ClassCastException if older versions stored int/long/string.
     */
    private static float getFloatCompat(SharedPreferences prefs, String key, float defValue) {
        try {
            return prefs.getFloat(key, defValue);
        } catch (ClassCastException ignore) {
            try {
                return (float) prefs.getInt(key, (int) defValue);
            } catch (ClassCastException ignore2) {
                try {
                    return (float) prefs.getLong(key, (long) defValue);
                } catch (ClassCastException ignore3) {
                    try {
                        String s = prefs.getString(key, null);
                        if (s != null) return Float.parseFloat(s);
                    } catch (Throwable ignore4) {
                        // ignore
                    }
                }
            }
            return defValue;
        }
    }
}
