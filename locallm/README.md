# Local LLM Inference with Milla-Rayne 🤖

Run AI models locally for complete privacy and offline functionality!

## ✨ Why Use Local LLMs?

- **🔒 Complete Privacy** - Your conversations never leave your computer
- **💰 Zero API Costs** - No monthly fees or per-token charges  
- **🌐 Works Offline** - No internet connection required
- **⚡ Fast Responses** - Low latency, especially with smaller models
- **🎛️ Full Control** - Choose and customize your own models

---

## 🚀 Quick Setup with Ollama (Recommended)

Ollama is the easiest way to run LLMs locally. It handles everything for you!

### Step 1: Install Ollama

**macOS:**
```bash
# Download and install from:
https://ollama.com/download/Ollama.dmg
```

**Windows:**
```bash
# Download and install from:
https://ollama.com/download/OllamaSetup.exe
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: Download a Model

Choose based on your available RAM:

**Small (Recommended for 4-8GB RAM):**
```bash
ollama pull gemma3:1b    # 815MB, great quality
```

**Medium (For 8-16GB RAM):**
```bash
ollama pull gemma3       # 3.3GB, excellent quality
```

**Large (For 16+ GB RAM):**
```bash
ollama pull gemma3:12b   # 8.1GB, best quality
```

**Alternatives:**
```bash
ollama pull llama3.2:1b  # 1.3GB, Meta's smallest model
ollama pull phi4-mini    # 2.5GB, Microsoft's efficient model
ollama pull mistral      # 4.1GB, popular general-purpose model
```

### Step 3: Start Ollama

Ollama usually starts automatically after installation. If not:

```bash
ollama serve
```

### Step 4: Enable in Milla-Rayne

Edit your `.env` file:

```env
ENABLE_LOCAL_MODEL=true
PREFER_LOCAL_MODEL=true
```

### Step 5: Restart Milla-Rayne

```bash
npm run dev
```

**That's it!** 🎉 Your chats now use local inference!

---

## 📊 Model Comparison

| Model | Size | RAM Needed | Speed | Quality | Best For |
|-------|------|------------|-------|---------|----------|
| gemma3:1b | 815MB | 4GB | ⚡⚡⚡ | ⭐⭐⭐ | Quick responses, low-end hardware |
| gemma3 | 3.3GB | 8GB | ⚡⚡ | ⭐⭐⭐⭐ | Balanced performance |
| gemma3:12b | 8.1GB | 16GB | ⚡ | ⭐⭐⭐⭐⭐ | Best quality |
| llama3.2:1b | 1.3GB | 4GB | ⚡⚡⚡ | ⭐⭐⭐ | Alternative small model |
| phi4-mini | 2.5GB | 6GB | ⚡⚡ | ⭐⭐⭐⭐ | Efficient, code-focused |
| mistral | 4.1GB | 8GB | ⚡⚡ | ⭐⭐⭐⭐ | General purpose |

---

## 🔧 Advanced Configuration

### Change Model

To switch models:

```bash
# Pull the new model
ollama pull llama3.2

# It will be automatically detected by Milla-Rayne
# Or set in .env:
LOCAL_MODEL_NAME=llama3.2
```

### Performance Tuning

Edit `server/offlineModelService.ts` to adjust:

```typescript
options: {
  temperature: 0.8,    // Higher = more creative (0.0-1.0)
  top_k: 40,          // Sampling diversity
  top_p: 0.9,         // Nucleus sampling
  num_predict: 512,   // Max tokens to generate
}
```

### Check Available Models

```bash
ollama list
```

### Remove Models

```bash
ollama rm gemma3:1b
```

---

## 🐛 Troubleshooting

### "Ollama is not running"

**Fix:**
```bash
ollama serve
```

Check if it's running:
```bash
curl http://localhost:11434/api/tags
```

### "No models found"

**Fix:**
```bash
ollama pull gemma3:1b
```

### Slow Responses

**Solutions:**
1. Use a smaller model (gemma3:1b instead of gemma3:12b)
2. Reduce `num_predict` in offlineModelService.ts
3. Close other applications to free RAM
4. Use GPU acceleration (automatic with Ollama if available)

### Out of Memory

**Fix:**
Use a smaller model:
```bash
ollama pull gemma3:1b  # Smallest Gemma
# or
ollama pull llama3.2:1b  # Even smaller
```

---

## 🔄 Fallback Behavior

Milla-Rayne automatically falls back to cloud AI if:
- Ollama is not running
- No models are installed
- Local inference fails
- `PREFER_LOCAL_MODEL=false`

This ensures you always get a response!

---

## 📁 About the TFLite File

The `gemma.tflite` file in this directory was the original attempt to use TensorFlow Lite models directly. However, **Ollama is much better** because:

✅ No Python setup needed  
✅ No tokenizer configuration  
✅ Automatic model management  
✅ Better performance  
✅ Easier to use  

You can safely ignore or delete the `.tflite` file if using Ollama.

---

## 📚 Additional Resources

- **Ollama Documentation:** https://ollama.com/docs
- **Model Library:** https://ollama.com/library
- **Ollama GitHub:** https://github.com/ollama/ollama
- **Ollama Discord:** https://discord.gg/ollama
- **Gemma Models:** https://ai.google.dev/gemma

---

## 💡 Pro Tips

1. **Start with gemma3:1b** - It's small, fast, and surprisingly good
2. **Keep Ollama running** - Add it to your system startup
3. **Try different models** - Each has unique strengths
4. **Monitor RAM usage** - Larger models need more memory
5. **Use cloud for complex tasks** - Local models are great for simple chats

---

## 🎯 Example Usage

After setup, just chat normally with Milla! She'll use your local model:

```
You: Hey Milla, how are you?
Milla: [using local gemma3:1b] I'm doing great! How can I help you today?
```

Check the console for confirmation:
```
[OfflineModel] ✅ Ollama is running!
[OfflineModel] 🤖 Using model: gemma3:1b
[OfflineModel] 🔒 Local inference enabled - chats are private!
```

---

**Happy chatting! 🚀**

