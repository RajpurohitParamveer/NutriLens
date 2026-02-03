package com.nutrilens.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

public class NutrilensWidgetUpdateService {
    
    public static void updateWidget(Context context, int steps, int dailyGoal) {
        // Save steps and goal to shared preferences for widget
        android.content.SharedPreferences prefs = context.getSharedPreferences("nutrilens_steps_prefs", Context.MODE_PRIVATE);
        android.content.SharedPreferences.Editor editor = prefs.edit();
        editor.putInt("today_steps", steps);
        editor.putInt("daily_goal", dailyGoal);
        editor.apply();
        
        // Update the widget
        Intent intent = new Intent(context, NutrilensWidgetSmallProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] ids = AppWidgetManager.getInstance(context).getAppWidgetIds(new ComponentName(context, NutrilensWidgetSmallProvider.class));
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        context.sendBroadcast(intent);
    }
    
    public static void updateWidget(Context context, int steps) {
        // Use default goal if not specified
        updateWidget(context, steps, 10000);
    }
    
    public static void updateGoal(Context context, int dailyGoal) {
        // Get current steps and update with new goal
        android.content.SharedPreferences prefs = context.getSharedPreferences("nutrilens_steps_prefs", Context.MODE_PRIVATE);
        int currentSteps = prefs.getInt("today_steps", 0);
        updateWidget(context, currentSteps, dailyGoal);
    }
}
