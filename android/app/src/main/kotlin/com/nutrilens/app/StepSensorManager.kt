// d:\Projects\Nutrilens\android\app\src\main\kotlin\com\nutrilens\app\StepSensorManager.kt
package com.nutrilens.app

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import androidx.lifecycle.LiveData
import androidx.lifecycle.asLiveData
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object StepSensorManager : SensorEventListener {
    private const val PREFS = "nutrilens_steps_prefs"
    private const val KEY_LAST_RAW = "last_raw_counter"
    private const val KEY_REBOOT_OFFSET = "reboot_offset"
    private const val KEY_BASELINE_DAY = "baseline_day"
    private const val KEY_LAST_DATE = "last_step_date"
    private const val KEY_TODAY_STEPS = "today_steps"

    private lateinit var appContext: Context
    private var sensorManager: SensorManager? = null
    private var stepCounter: Sensor? = null

    private val _stepsFlow = MutableStateFlow(0)
    val stepsFlow: StateFlow<Int> = _stepsFlow
    val stepsLiveData: LiveData<Int> = _stepsFlow.asLiveData()

    fun init(context: Context) {
        if (!::appContext.isInitialized) {
            appContext = context.applicationContext
            sensorManager = appContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
            stepCounter = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        }
    }

    fun start() {
        stepCounter?.let {
            sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
        }
        val prefs = appContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        _stepsFlow.value = prefs.getInt(KEY_TODAY_STEPS, 0)
    }

    fun stop() {
        sensorManager?.unregisterListener(this)
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_STEP_COUNTER) return
        val prefs = appContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        var currentRaw = event.values[0].coerceAtLeast(0f)

        val lastRaw = getFloatCompat(prefs, KEY_LAST_RAW, -1f)
        var rebootOffset = getFloatCompat(prefs, KEY_REBOOT_OFFSET, 0f)
        var baselineDay = getFloatCompat(prefs, KEY_BASELINE_DAY, -1f)
        var lastDate = prefs.getString(KEY_LAST_DATE, null)
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

        val rebooted = (lastRaw >= 0f && currentRaw < lastRaw)
        if (rebooted) {
            rebootOffset += lastRaw
        }

        val cumulative = currentRaw + rebootOffset

        val newDay = (lastDate == null) || (today != lastDate)
        val prevDate = lastDate
        val prevStored = if (newDay && prevDate != null) prefs.getInt(KEY_TODAY_STEPS, 0) else -1
        if (newDay) {
            baselineDay = cumulative
            lastDate = today
        }
        if (baselineDay < 0f) {
            baselineDay = cumulative
            if (lastDate == null) lastDate = today
        }

        val todaySteps = kotlin.math.max(0.0, kotlin.math.floor((cumulative - baselineDay).toDouble())).toInt()

        val e = prefs.edit()
        e.putFloat(KEY_LAST_RAW, currentRaw)
        e.putFloat(KEY_REBOOT_OFFSET, rebootOffset)
        e.putFloat(KEY_BASELINE_DAY, baselineDay)
        e.putString(KEY_LAST_DATE, lastDate)
        e.putInt(KEY_TODAY_STEPS, todaySteps)
        if (prevStored >= 0 && prevDate != null) {
            e.putInt("steps_$prevDate", prevStored)
        }
        e.apply()

        _stepsFlow.value = todaySteps
        NutrilensWidgetUpdateService.updateWidget(appContext, todaySteps, StepCounterService.getCurrentGoal(appContext))
    }

    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}

    private fun getFloatCompat(prefs: android.content.SharedPreferences, key: String, defValue: Float): Float {
        return try {
            prefs.getFloat(key, defValue)
        } catch (_: ClassCastException) {
            try {
                prefs.getInt(key, defValue.toInt()).toFloat()
            } catch (_: ClassCastException) {
                try {
                    prefs.getLong(key, defValue.toLong()).toFloat()
                } catch (_: ClassCastException) {
                    try {
                        val s = prefs.getString(key, null)
                        if (s != null) s.toFloat() else defValue
                    } catch (_: Throwable) {
                        defValue
                    }
                }
            }
        }
    }
}