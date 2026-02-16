package com.nutrilens.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Reschedules periodic widget updates after device reboot.
 * WorkManager persists across reboots, but some OEMs can clear jobs; this receiver ensures scheduling.
 */
public class BootCompletedReceiver extends BroadcastReceiver {
    private static final String TAG = "BootCompletedReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            StepWidgetUpdateWorker.ensureScheduled(context.getApplicationContext());
            Log.d(TAG, "Widget update work ensured after boot");
        } catch (Throwable t) {
            Log.e(TAG, "Failed to ensure widget update work after boot", t);
        }
    }
}

