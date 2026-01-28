# 🤖 Local LLM Setup for Milla-Rayne

## TL;DR - 3 Minute Setup

```bash
# 1. Install Ollama (pick your OS)
# macOS: download from https://ollama.com/download/Ollama.dmg
# Windows: download from https://ollama.com/download/OllamaSetup.exe
# Linux:
curl -fsSL https://ollama.com/install.sh | sh

# 2. Download a model
ollama pull gemma3:1b    # Small, fast (815MB)

# 3. Enable in Milla-Rayne
echo "ENABLE_LOCAL_MODEL=true" >> .env
echo "PREFER_LOCAL_MODEL=true" >> .env

# 4. Restart Milla
npm run dev
```

**Done!** Your chats are now private and run locally! 🎉

---

## Why Use Local LLMs?

### 🔒 **Privacy First**
- Your conversations **never leave your computer**
- No data sent to OpenAI, Google, or any cloud service
- Perfect for sensitive conversations
- HIPAA/GDPR compliant by default

### 💰 **Zero Cost**
- No API fees
- No monthly subscriptions
- No per-token charges
- Run unlimited chats for free

### 🌐 **Works Offline**
- No internet connection needed
- Perfect for travel, remote areas, or offline work
- Never blocked by network restrictions

### ⚡ **Fast & Reliable**
- No network latency
- No rate limits
- No API outages
- Consistent performance

---

## Step-by-Step Setup

### Step 1: Install Ollama

Ollama is like Docker for LLMs - it makes running local models incredibly easy.

**macOS:**
1. Download: https://ollama.com/download/Ollama.dmg
2. Open the DMG file
3. Drag Ollama to Applications
4. Launch Ollama (it runs in the menu bar)

**Windows:**
1. Download: https://ollama.com/download/OllamaSetup.exe
2. Run the installer
3. Follow the prompts
4. Ollama starts automatically

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Verify Installation:**
```bash
ollama --version
```

---

### Step 2: Choose & Download a Model

Pick a model based on your RAM:

#### 🟢 **For 4-8GB RAM** (Recommended to Start)

```bash
ollama pull gemma3:1b
```
- Size: 815MB
- Quality: Good
- Speed: Very fast
- Best for: Quick responses, testing

#### 🟡 **For 8-16GB RAM** (Balanced)

```bash
ollama pull gemma3
```
- Size: 3.3GB  
- Quality: Excellent
- Speed: Fast
- Best for: Daily use, great quality

#### 🔴 **For 16GB+ RAM** (Best Quality)

```bash
ollama pull gemma3:12b
```
- Size: 8.1GB
- Quality: Outstanding
- Speed: Moderate
- Best for: Complex tasks, best responses

#### 🎯 **Other Great Options**

```bash
# Meta's Llama (very popular)
ollama pull llama3.2:1b    # 1.3GB, great small model

# Microsoft's Phi (efficient)
ollama pull phi4-mini      # 2.5GB, code-focused

# Mistral (general purpose)
ollama pull mistral        # 4.1GB, very capable
```

**Download Progress:**
Ollama will show download progress. This may take a few minutes depending on your internet speed.

---

### Step 3: Enable Local LLM in Milla-Rayne

Edit your `.env` file in the project root:

```bash
# Enable local model support
ENABLE_LOCAL_MODEL=true

# Use local model by default (with cloud fallback)
PREFER_LOCAL_MODEL=true

# Optional: Specify a particular model
# LOCAL_MODEL_NAME=gemma3:1b
```

**Or add via command line:**

```bash
cd /path/to/Milla-Rayne

# Add to .env file
echo "ENABLE_LOCAL_MODEL=true" >> .env
echo "PREFER_LOCAL_MODEL=true" >> .env
```

---

### Step 4: Start/Restart Milla-Rayne

```bash
npm run dev
```

**Look for these messages in the console:**

```
[OfflineModel] 🔍 Checking for Ollama...
[OfflineModel] ✅ Ollama is running!
[OfflineModel] 📦 Available models: 1
[OfflineModel] 🤖 Using model: gemma3:1b
[OfflineModel] 🔒 Local inference enabled - chats are private!
```

---

## Using Local LLM

### Normal Usage

Just chat with Milla normally! When `PREFER_LOCAL_MODEL=true`, all responses use your local model:

```
You: Hey Milla, how are you?
Milla: [using local gemma3:1b] I'm doing great! How can I help you today?
```

### Cloud Fallback

If local model fails, Milla automatically uses cloud AI:

```
[OfflineModel] ❌ Inference error: timeout
[aiDispatcher] Falling back to OpenRouter...
```

### Force Local Model

Set `PREFER_LOCAL_MODEL=true` - local model used first

### Force Cloud Model

Set `PREFER_LOCAL_MODEL=false` - cloud used first, local as fallback

---

## Model Management

### List Downloaded Models

```bash
ollama list
```

Output:
```
NAME              SIZE    MODIFIED
gemma3:1b         815MB   2 minutes ago
llama3.2:1b       1.3GB   1 hour ago
```

### Download More Models

```bash
ollama pull qwen3     # Chinese LLM
ollama pull codellama # Code-focused
ollama pull llava     # Vision + text
```

### Remove Models

```bash
ollama rm gemma3:1b
```

### Update Models

```bash
ollama pull gemma3:1b  # Pulls latest version
```

---

## Performance Tuning

### Adjust Response Settings

Edit `server/offlineModelService.ts`:

```typescript
options: {
  temperature: 0.8,    // Creativity (0.0-1.0)
                       // Lower = more focused
                       // Higher = more creative
  
  top_k: 40,          // Sampling diversity
                       // Lower = more consistent
                       // Higher = more varied
  
  top_p: 0.9,         // Nucleus sampling
                       // Lower = more predictable
                       // Higher = more diverse
  
  num_predict: 512,   // Max tokens to generate
                       // Lower = faster, shorter
                       // Higher = slower, longer
}
```

### Speed Up Responses

1. **Use smaller models:**
   ```bash
   ollama pull gemma3:1b  # Instead of gemma3:12b
   ```

2. **Reduce max tokens:**
   ```typescript
   num_predict: 256  // Instead of 512
   ```

3. **Close other apps** to free RAM

4. **Use GPU** (Ollama automatically uses GPU if available)

### Improve Quality

1. **Use larger models:**
   ```bash
   ollama pull gemma3:12b  # Instead of gemma3:1b
   ```

2. **Adjust temperature:**
   ```typescript
   temperature: 0.7  // More focused (default 0.8)
   ```

3. **Increase max tokens:**
   ```typescript
   num_predict: 1024  // Longer responses
   ```

---

## Troubleshooting

### ❌ "Ollama is not running"

**Solution:**
```bash
# Start Ollama
ollama serve

# Or on macOS/Windows, launch the Ollama app
```

**Verify:**
```bash
curl http://localhost:11434/api/tags
```

Should return JSON with model list.

---

### ❌ "No models found"

**Solution:**
```bash
ollama pull gemma3:1b
```

**Verify:**
```bash
ollama list
```

---

### ❌ Responses are very slow

**Solutions:**

1. **Use smaller model:**
   ```bash
   ollama pull gemma3:1b
   ```

2. **Check RAM usage:**
   ```bash
   # Linux/macOS
   free -h
   
   # macOS
   top
   
   # Windows
   Task Manager → Performance
   ```
   
   Close other apps if RAM is low.

3. **Reduce max tokens:**
   Edit `offlineModelService.ts`:
   ```typescript
   num_predict: 256  // Down from 512
   ```

4. **Check CPU/GPU usage:**
   - Ollama uses GPU automatically if available
   - Ensure GPU drivers are up to date

---

### ❌ Out of Memory

**Error:** `failed to load model`

**Solution:**
Use a smaller model:

```bash
# Remove large model
ollama rm gemma3:12b

# Install small model
ollama pull gemma3:1b    # 815MB
# or
ollama pull llama3.2:1b  # 1.3GB
```

**RAM Requirements:**
- 4GB RAM: gemma3:1b, llama3.2:1b
- 8GB RAM: gemma3, phi4-mini, mistral
- 16GB RAM: gemma3:12b, llama3.1
- 32GB+ RAM: Any model, including 70B+

---

### ❌ "Cannot connect to Ollama"

**Causes:**
1. Ollama not running
2. Wrong port
3. Firewall blocking

**Solution:**

1. **Check if Ollama is running:**
   ```bash
   ps aux | grep ollama
   # or
   curl http://localhost:11434
   ```

2. **Restart Ollama:**
   ```bash
   # Linux
   sudo systemctl restart ollama
   
   # macOS/Windows
   Quit and relaunch Ollama app
   ```

3. **Check port:**
   ```bash
   netstat -an | grep 11434
   ```
   
   Should show: `127.0.0.1:11434 ... LISTEN`

4. **Check firewall:**
   - Allow port 11434 for localhost
   - Usually not needed for local-only access

---

## Advanced Topics

### Custom System Prompts

The local model uses Milla's personality from `shared/millaPersona.ts` automatically.

### Multiple Models

Ollama can run one model at a time. To switch:

```bash
# Pull new model
ollama pull llama3.2

# Milla will detect it automatically
# Or specify in .env:
LOCAL_MODEL_NAME=llama3.2
```

### Model Comparison

Test different models:

```bash
# Download multiple models
ollama pull gemma3:1b
ollama pull llama3.2:1b
ollama pull phi4-mini

# Milla will use the first Gemma model found
# Or specify which to use:
LOCAL_MODEL_NAME=phi4-mini
```

### GPU Acceleration

Ollama automatically uses your GPU if:
- NVIDIA GPU (CUDA) ✅
- AMD GPU (ROCm) ✅
- Apple Silicon (Metal) ✅
- Intel GPU (oneAPI) ✅

No configuration needed!

---

## Comparison: Local vs Cloud

| Feature | Local (Ollama) | Cloud (OpenRouter/OpenAI) |
|---------|----------------|--------------------------|
| **Privacy** | ✅ Complete | ⚠️ Data sent to API |
| **Cost** | ✅ Free | 💰 Pay per token |
| **Speed** | ⚡ Fast (1-3s) | ⚡ Fast (1-2s) |
| **Quality** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Offline** | ✅ Yes | ❌ No |
| **Setup** | 🔧 5 minutes | ✅ Instant |
| **RAM Usage** | 📊 1-8GB | 📊 Minimal |
| **Model Choice** | 🎯 100+ models | 🎯 50+ models |

---

## Next Steps

1. ✅ **You have local LLM working!**
2. 🎨 Try different models for comparison
3. ⚙️ Tune parameters for your preference  
4. 📊 Monitor RAM usage
5. 🚀 Enjoy private, offline AI!

---

## Resources

- **Ollama Website:** https://ollama.com
- **Model Library:** https://ollama.com/library
- **Ollama GitHub:** https://github.com/ollama/ollama
- **Ollama Discord:** https://discord.gg/ollama
- **Documentation:** https://docs.ollama.com

---

## FAQ

**Q: Can I use multiple models at once?**  
A: No, Ollama runs one model at a time. Switch with `LOCAL_MODEL_NAME` in .env

**Q: Does this work with the CLI?**  
A: Yes! The CLI uses the same backend, so local models work there too.

**Q: Can I use GPT-4 locally?**  
A: No, GPT-4 is closed-source. Use Gemma, Llama, or Mistral instead.

**Q: How much disk space do I need?**  
A: 1-10GB depending on model. Gemma3:1b = 815MB, Gemma3:12b = 8.1GB

**Q: Will local model work on my Raspberry Pi?**  
A: Yes! Use gemma3:1b or llama3.2:1b for best performance on ARM devices.

**Q: Does Ollama support fine-tuned models?**  
A: Yes! You can import GGUF models. See https://docs.ollama.com/import

**Q: Can I serve this to multiple users?**  
A: Ollama runs locally per machine. For multi-user, consider hosting Ollama on a server.

---

**Need help?** Open an issue or ask in the Milla-Rayne Discord!
