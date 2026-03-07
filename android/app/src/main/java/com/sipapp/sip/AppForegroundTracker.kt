package com.sipapp.sip

import android.app.Activity
import android.app.Application
import android.os.Bundle

/**
 * Tracks whether the app has any Activity in the foreground (resumed state).
 * Register this in MainApplication.onCreate() via:
 *   registerActivityLifecycleCallbacks(AppForegroundTracker)
 */
object AppForegroundTracker : Application.ActivityLifecycleCallbacks {

    @Volatile
    var isForeground: Boolean = false
        private set

    private var resumedCount = 0

    override fun onActivityResumed(activity: Activity) {
        resumedCount++
        isForeground = true
    }

    override fun onActivityPaused(activity: Activity) {
        resumedCount = maxOf(0, resumedCount - 1)
        isForeground = resumedCount > 0
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
    override fun onActivityStarted(activity: Activity) {}
    override fun onActivityStopped(activity: Activity) {}
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
    override fun onActivityDestroyed(activity: Activity) {}
}
