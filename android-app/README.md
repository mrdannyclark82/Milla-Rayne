# Milla-Rayne · CYBER (Native Android client)

A complete native Android Studio project (Kotlin + Jetpack Compose + Material 3)
for the [Milla-Rayne](https://github.com/mrdannyclark82/Milla-Rayne) AI assistant.

## What you get
- **Cyberpunk theme** (neon cyan/magenta on near-black) with one-line preset
  switching (`Neon Night` / `Acid Punk` / `Synthwave`) — see
  `ui/theme/ThemeTokens.kt`. Edit `ActiveTokens =` to retheme the whole app.
- **Poly-model dispatcher** with smart fall-through:
  `Milla-Rayne backend → Gemini 3 → OpenAI → Claude` (order configurable in
  Settings). On 401/403/unreachable, the next provider takes over **before**
  any tokens stream. On mid-stream failure, the partial answer is preserved
  and a marker is appended (no duplicate output).
- **Full Gemini multimodal**: text + image (camera or gallery) + voice as
  inline base64. Streaming via SSE (`alt=sse`).
- **Voice in/out**: native Android `SpeechRecognizer` (STT) and
  `TextToSpeech` (TTS). Tap the mic in the composer to dictate; tap `▶ TTS`
  on any assistant bubble to hear it.
- **Full device permissions surface**: camera, mic, fine/coarse/background
  location, all media, contacts, calendar, phone/SMS, sensors, bluetooth,
  notifications, foreground services. Manage in `RUNTIME // PERMS`.
- **Encrypted credentials**: API keys stored via `EncryptedSharedPreferences`
  (AES-256-GCM through AndroidKeyStore). Never logged.
- **Local persistence**: chat history in Room, settings via DataStore-style
  observable repository.

## Architecture

```
com.millarayne.cyber
├── MillaApp.kt              Application — owns Database + SettingsRepository
├── MainActivity.kt          NavHost (chat / settings / permissions)
├── ui/
│   ├── theme/               ThemeTokens.kt + Theme.kt (Compose Material 3)
│   ├── components/          CyberGridBackground, NeonButton, NeonCard
│   ├── screens/             ChatScreen, SettingsScreen, PermissionsScreen
│   └── chat/ChatViewModel   single source of truth for the chat
├── data/
│   ├── db/                  Room (MessageEntity / Dao / DB)
│   ├── prefs/               EncryptedSharedPreferences settings
│   └── model/Attachment     in-memory user-staged attachments
├── ai/
│   ├── AiProvider           interface + AiMessage + AiChunk
│   ├── AiOrchestrator       fallback chain
│   ├── MillaBackendProvider POST /api/chat against your Milla server
│   ├── GeminiProvider       Google Gemini multimodal + SSE streaming
│   ├── OpenAIProvider       OpenAI Chat Completions (multimodal images)
│   └── ClaudeProvider       Anthropic Messages (multimodal images)
├── voice/                   STT + TTS helpers
└── permissions/             curated permission groups
```

## Build instructions

1. Open `/android-app` in **Android Studio Hedgehog (2023.1.1) or later**
   (recommended: Iguana / Jellyfish for Kotlin 1.9.24 + AGP 8.5).
2. The first sync will generate the gradle wrapper if it's missing. If
   Android Studio does not auto-generate it, run from a terminal in this
   directory:
   ```bash
   gradle wrapper --gradle-version 8.7
   ```
   (This requires a system Gradle ≥ 7. Once generated, `./gradlew` is used.)
3. **Sync project with Gradle files**.
4. Plug in a device or start an emulator (API 26+ / Android 8+).
5. Run the `app` configuration. The app will install with a neon-M launcher
   icon called **Milla Rayne · CYBER**.

> Minimum SDK 26 (Android 8.0). Target SDK 34. Kotlin 1.9.24.
> Compose BOM 2024.06. Material3.

## First-run setup (in the app)

1. Tap the **shield icon** (top-right) → grant the permission groups you
   want enabled. `REQUEST ALL` asks for everything in one batch.
2. Tap the **gear icon** → `SYSTEM // CONFIG`:
   - **Server URL**: e.g. `http://10.0.2.2:5000` for Android emulator hitting
     a local Milla-Rayne dev server, or `http://<your-LAN-ip>:5000` from a
     physical device.
   - **Gemini API key**: from
     [Google AI Studio](https://aistudio.google.com/app/apikey).
     Default model: `gemini-3-flash` (auto-falls-through to `gemini-3-pro`,
     `gemini-2.5-pro`, `gemini-2.5-flash` on 4xx).
   - **OpenAI API key**: from <https://platform.openai.com/api-keys>.
     Default model: `gpt-5.2`.
   - **Anthropic API key**: from <https://console.anthropic.com/>.
     Default model: `claude-sonnet-4.5`.
   - **Fallback order**: comma-separated provider IDs. First-configured-wins.
     Try `backend,gemini,openai,claude` (default) or
     `gemini,backend,claude,openai` if you'd rather hit Gemini directly first.
3. Return to the chat. Type, dictate, attach images, or take a photo — your
   message is dispatched through the chain and the response streams back.

## Customizing the cyberpunk look

Open `app/src/main/java/com/millarayne/cyber/ui/theme/ThemeTokens.kt`.
Three presets are provided (`NeonNight`, `AcidPunk`, `Synthwave`). To switch:

```kotlin
val ActiveTokens: CyberTokens = AcidPunk   // ← change this single line
```

Or build your own preset by copying one and changing colors / fonts. Every
screen reads from `LocalCyberTokens.current`, so the change propagates
instantly with no code edits anywhere else.

## Notes & limitations

- **Gemini File API**: For attachments larger than ~20 MB, Gemini's inline
  base64 path is not appropriate. The provider has a `TODO` to switch to the
  resumable File API; currently large videos may fail. Smaller images (a few
  MB) work fine.
- **OpenAI/Claude streaming**: Implemented as non-streaming for simplicity;
  the surface contract supports streaming and the ViewModel renders deltas
  identically — easy to swap in SSE later.
- **Backend `/api/chat` payload**: Best-effort match for the shape used by
  Milla-Rayne's `server/routes`. If your fork uses a different field, edit
  `MillaBackendProvider.kt` accordingly.
- **APK size**: ~14–18 MB debug. ProGuard rules included for release.
- **No telemetry**. The app talks only to your configured endpoints.

## Replacing the existing `android/` folder in the repo

This project lives outside the Milla-Rayne repo. To use it as the official
Android client, copy this entire folder into the repo:

```bash
rm -rf path/to/Milla-Rayne/android
cp -r android-app path/to/Milla-Rayne/android
```

…then in `Milla-Rayne/README.md`, the existing `android/` build instructions
already say "Open `android/` in Android Studio" — that will Just Work™.
