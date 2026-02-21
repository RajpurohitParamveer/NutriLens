
package com.nutrilens.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat

class StepForegroundService : Service() {
    override fun onCreate() {
        super.onCreate()
        createChannel()
        startForeground(1001, buildNotification(0))
        StepSensorManager.init(applicationContext)
        StepSensorManager.start()
        StepSensorManager.stepsLiveData.observeForever {
            val nm = getSystemService(android.content.Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.notify(1001, buildNotification(it))
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        StepSensorManager.stop()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createChannel() {
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            val nm = getSystemService(android.content.Context.NOTIFICATION_SERVICE) as NotificationManager
            val channel = NotificationChannel(
                "steps_channel",
                "Nutrilens Steps",
                NotificationManager.IMPORTANCE_LOW
            )
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(steps: Int): Notification {
        return NotificationCompat.Builder(this, "steps_channel")
            .setContentTitle("Nutrilens")
            .setContentText("Today's steps: $steps")
            .setSmallIcon(R.drawable.ic_launcher)
            .setOngoing(true)
            .build()
    }
}
