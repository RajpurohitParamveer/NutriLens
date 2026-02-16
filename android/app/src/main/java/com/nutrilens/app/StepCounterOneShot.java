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

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class StepCounterOneShot {

    private static final String TAG = "StepOneShot";
    private static final String PREFS = "steps_prefs";
    private static final String KEY_LAST_RAW = "last_raw_counter";
    private static final String KEY_BASELINE = "baseline_counter";

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

        SharedPreferences prefs =
                context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        float lastRaw = prefs.getFloat(KEY_LAST_RAW, -1f);
        float baseline = prefs.getFloat(KEY_BASELINE, -1f);

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

        float finalRaw;
        if (currentRaw[0] >= 0) {
            finalRaw = currentRaw[0];
            prefs.edit().putFloat(KEY_LAST_RAW, finalRaw).apply();
            Log.d(TAG, "[sync] received sensor value: " + finalRaw);
        } else {
            finalRaw = lastRaw;
            Log.d(TAG, "[sync] no event; using last saved raw: " + finalRaw);
        }

        if (finalRaw < 0) finalRaw = 0;
        if (baseline < 0) {
            baseline = finalRaw;
            prefs.edit().putFloat(KEY_BASELINE, baseline).apply();
        }

        int todaySteps = (int) (finalRaw - baseline);
        return Math.max(todaySteps, 0);
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

            SharedPreferences prefs =
                    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

            float lastRaw = prefs.getFloat(KEY_LAST_RAW, -1f);
            float baseline = prefs.getFloat(KEY_BASELINE, -1f);

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

            float finalRaw;

            if (currentRaw[0] >= 0) {
                finalRaw = currentRaw[0];
                prefs.edit().putFloat(KEY_LAST_RAW, finalRaw).apply();
                Log.d(TAG, "Received sensor value: " + finalRaw);
            } else {
                finalRaw = lastRaw;
                Log.d(TAG, "No new sensor event. Using last saved raw: " + finalRaw);
            }

            if (finalRaw < 0) {
                finalRaw = 0;
            }

            if (baseline < 0) {
                baseline = finalRaw;
                prefs.edit().putFloat(KEY_BASELINE, baseline).apply();
            }

            int todaySteps = (int) (finalRaw - baseline);

            if (todaySteps < 0) todaySteps = 0;

            int finalSteps = todaySteps;

            new Handler(Looper.getMainLooper())
                    .post(() -> callback.onResult(finalSteps));

        }).start();
    }
}
