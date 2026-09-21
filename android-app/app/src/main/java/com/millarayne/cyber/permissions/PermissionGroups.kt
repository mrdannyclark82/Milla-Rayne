package com.millarayne.cyber.permissions

import android.Manifest
import android.os.Build

/**
 * Curated permission groups, used by the Permissions screen and elsewhere.
 * The actual prompt is dispatched via Accompanist's permission utilities or
 * ActivityResultContracts.RequestMultiplePermissions().
 */
object PermissionGroups {

    val CORE_AT_LAUNCH: List<String> = listOf(
        Manifest.permission.RECORD_AUDIO,
    ).plus(if (Build.VERSION.SDK_INT >= 33) listOf(Manifest.permission.POST_NOTIFICATIONS) else emptyList())

    val CAMERA_GROUP = listOf(Manifest.permission.CAMERA)

    val LOCATION_GROUP = listOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
    )

    val MEDIA_GROUP: List<String> =
        if (Build.VERSION.SDK_INT >= 33) listOf(
            Manifest.permission.READ_MEDIA_IMAGES,
            Manifest.permission.READ_MEDIA_AUDIO,
            Manifest.permission.READ_MEDIA_VIDEO
        ) else listOf(Manifest.permission.READ_EXTERNAL_STORAGE)

    val CONTACTS_GROUP = listOf(
        Manifest.permission.READ_CONTACTS,
        Manifest.permission.WRITE_CONTACTS,
    )

    val CALENDAR_GROUP = listOf(
        Manifest.permission.READ_CALENDAR,
        Manifest.permission.WRITE_CALENDAR,
    )

    val PHONE_SMS_GROUP = listOf(
        Manifest.permission.READ_PHONE_STATE,
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS,
    )

    val SENSORS_GROUP: List<String> =
        listOf(Manifest.permission.BODY_SENSORS, Manifest.permission.ACTIVITY_RECOGNITION)
            .plus(if (Build.VERSION.SDK_INT >= 33) listOf(Manifest.permission.HIGH_SAMPLING_RATE_SENSORS) else emptyList())

    val BLUETOOTH_GROUP: List<String> =
        if (Build.VERSION.SDK_INT >= 31) listOf(
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.BLUETOOTH_SCAN
        ) else listOf(Manifest.permission.BLUETOOTH, Manifest.permission.BLUETOOTH_ADMIN)

    /** Used by the "Grant All" action on the Permissions screen. */
    val ALL_RUNTIME: List<String> = (
        CORE_AT_LAUNCH + CAMERA_GROUP + LOCATION_GROUP + MEDIA_GROUP +
        CONTACTS_GROUP + CALENDAR_GROUP + PHONE_SMS_GROUP + SENSORS_GROUP + BLUETOOTH_GROUP
    ).distinct()

    data class Group(val id: String, val title: String, val perms: List<String>)
    val ALL_GROUPS = listOf(
        Group("microphone", "Microphone (voice input)", listOf(Manifest.permission.RECORD_AUDIO)),
        Group("camera",     "Camera (vision input)",    CAMERA_GROUP),
        Group("location",   "Location (context)",       LOCATION_GROUP),
        Group("media",      "Photos / audio / video",   MEDIA_GROUP),
        Group("contacts",   "Contacts",                 CONTACTS_GROUP),
        Group("calendar",   "Calendar",                 CALENDAR_GROUP),
        Group("phone_sms",  "Phone & SMS",              PHONE_SMS_GROUP),
        Group("sensors",    "Body sensors & activity",  SENSORS_GROUP),
        Group("bluetooth",  "Bluetooth",                BLUETOOTH_GROUP),
    )
}
