package com.millarayne.cyber

import android.app.Application
import com.millarayne.cyber.data.db.AppDatabase
import com.millarayne.cyber.data.prefs.SettingsRepository

class MillaApp : Application() {
    val database by lazy { AppDatabase.get(this) }
    val settings by lazy { SettingsRepository(this) }
}
