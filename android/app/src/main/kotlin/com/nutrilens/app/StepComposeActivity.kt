
package com.nutrilens.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState

class StepComposeActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (!PermissionHelper.hasAll(this)) {
            PermissionHelper.requestAll(this)
        }
        val i = android.content.Intent(this, StepForegroundService::class.java)
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            startForegroundService(i)
        } else {
            startService(i)
        }
        StepSensorManager.init(applicationContext)
        setContent {
            val steps by StepSensorManager.stepsFlow.collectAsState(initial = 0)
            MaterialTheme {
                Surface {
                    Text(text = "Today's steps: $steps")
                }
            }
        }
    }
}
