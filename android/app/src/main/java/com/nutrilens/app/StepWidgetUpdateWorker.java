package com.nutrilens.app;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.util.concurrent.TimeUnit;

/**
 * Periodically updates the home screen widget using a one-shot step counter read.
 * Complies with Android background limits: no foreground service, no wake locks, no long-lived listeners.
 */
public class StepWidgetUpdateWorker extends Worker {
    private static final String TAG = "StepWidgetWorker";
    public static final String UNIQUE_WORK_NAME = "nl_step_widget_update";

    public StepWidgetUpdateWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        try {
            int steps = StepCounterOneShot.readCurrentStepsSync(getApplicationContext());
            int goal = StepCounterService.getCurrentGoal(getApplicationContext());
            NutrilensWidgetUpdateService.updateWidget(getApplicationContext(), steps, goal);
            Log.d(TAG, "Widget updated via WorkManager with steps=" + steps);
            return Result.success();
        } catch (Throwable t) {
            Log.e(TAG, "Widget update work failed", t);
            return Result.retry();
        }
    }

    /**
     * Enqueue unique periodic work with minimum interval allowed by WorkManager (15 minutes).
     */
    public static void ensureScheduled(Context context) {
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.NOT_REQUIRED)
                .setRequiresBatteryNotLow(false)
                .setRequiresCharging(false)
                .setRequiresStorageNotLow(false)
                .build();

        PeriodicWorkRequest request =
                new PeriodicWorkRequest.Builder(StepWidgetUpdateWorker.class, 15, TimeUnit.MINUTES)
                        .setConstraints(constraints)
                        .addTag(UNIQUE_WORK_NAME)
                        .build();

        WorkManager.getInstance(context.getApplicationContext())
                .enqueueUniquePeriodicWork(
                        UNIQUE_WORK_NAME,
                        ExistingPeriodicWorkPolicy.KEEP,
                        request
                );
    }
}

