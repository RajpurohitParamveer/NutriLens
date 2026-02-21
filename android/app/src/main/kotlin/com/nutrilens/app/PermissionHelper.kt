
package com.nutrilens.app

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

object PermissionHelper {
    private const val REQ_CODE = 7001

    fun hasAll(activity: Activity): Boolean {
        val ar = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED
        val pn = if (Build.VERSION.SDK_INT >= 33) {
            ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        } else true
        return ar && pn
    }

    fun requestAll(activity: Activity) {
        val perms = mutableListOf<String>()
        perms.add(Manifest.permission.ACTIVITY_RECOGNITION)
        if (Build.VERSION.SDK_INT >= 33) {
            perms.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        ActivityCompat.requestPermissions(activity, perms.toTypedArray(), REQ_CODE)
    }
}