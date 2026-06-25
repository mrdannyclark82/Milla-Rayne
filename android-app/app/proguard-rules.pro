# ProGuard rules
-keepattributes Signature, *Annotation*, EnclosingMethod, InnerClasses
-keep class com.millarayne.cyber.ai.** { *; }
-keep class com.millarayne.cyber.data.** { *; }

# OkHttp / Retrofit
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keep class kotlin.Metadata { *; }

# Kotlinx serialization
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault
-keep,includedescriptorclasses class com.millarayne.cyber.**$$serializer { *; }
-keepclassmembers class com.millarayne.cyber.** {
    *** Companion;
}
-keepclasseswithmembers class com.millarayne.cyber.** {
    kotlinx.serialization.KSerializer serializer(...);
}
