package com.nutrilens.app;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetPlugin")
public class WidgetPlugin extends Plugin {

    private static final String TAG = "WidgetPlugin";

    @PluginMethod
    public void updateWidget(PluginCall call) {
        Log.d(TAG, "updateWidget called");
        try {
            int steps = call.getInt("steps", 0);
            int dailyGoal = call.getInt("dailyGoal", 10000);
            
            Log.d(TAG, "Updating widget with steps: " + steps + ", goal: " + dailyGoal);
            
            // Update the widget using the native service
            NutrilensWidgetUpdateService.updateWidget(getContext(), steps, dailyGoal);
            
            Log.d(TAG, "Widget updated successfully");
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Widget updated successfully");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to update widget", e);
            call.reject("Failed to update widget", e);
        }
    }

    @PluginMethod
    public void updateGoal(PluginCall call) {
        Log.d(TAG, "updateGoal called");
        try {
            int dailyGoal = call.getInt("dailyGoal", 10000);
            
            Log.d(TAG, "Updating widget goal to: " + dailyGoal);
            
            // Update the widget goal using the native service
            NutrilensWidgetUpdateService.updateGoal(getContext(), dailyGoal);
            
            Log.d(TAG, "Widget goal updated successfully");
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Widget goal updated successfully");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to update widget goal", e);
            call.reject("Failed to update widget goal", e);
        }
    }
}
