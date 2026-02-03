package com.nutrilens.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NutrilensWidget")
public class NutrilensWidget extends Plugin {

    @PluginMethod
    public void updateWidget(PluginCall call) {
        int steps = call.getInt("steps", 0);
        int dailyGoal = call.getInt("dailyGoal", 10000);
        NutrilensWidgetUpdateService.updateWidget(getContext(), steps, dailyGoal);
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void updateGoal(PluginCall call) {
        int dailyGoal = call.getInt("dailyGoal", 10000);
        NutrilensWidgetUpdateService.updateGoal(getContext(), dailyGoal);
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
}
