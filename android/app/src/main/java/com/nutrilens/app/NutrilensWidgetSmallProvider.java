package com.nutrilens.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class NutrilensWidgetSmallProvider extends AppWidgetProvider {
    private static final String PREFS_NAME = "nutrilens_steps_prefs";
    private static final String STEPS_KEY = "today_steps";
    private static final String GOAL_KEY = "daily_goal";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int todaySteps = prefs.getInt(STEPS_KEY, 0);
        int dailyGoal = prefs.getInt(GOAL_KEY, 10000);
        
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.nutrilens_widget_small);
        views.setTextViewText(R.id.widget_steps_count, String.valueOf(todaySteps));
        views.setTextViewText(R.id.widget_goal_text, "of " + dailyGoal);
        views.setProgressBar(R.id.progress_ring, dailyGoal, todaySteps, false);
        views.setOnClickPendingIntent(R.id.widget_layout, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
