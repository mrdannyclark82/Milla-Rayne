# Milla Rayne AI Assistant - Setup Guide

## ✅ Current Status: **SUCCESSFULLY RUNNING**

The AI-powered virtual assistant companion is now up and running with the following core features working:

### 🎯 Working Features

- **Vector-based memory recall system** (5913 memory entries loaded)
- **Chat interface with conversation history**
- **Face recognition system**
- **Visual memory storage**
- **Personality settings and customization**
- **Real-time chat interface**

## 🚀 Getting Started

### Prerequisites

- Node.js (compatible with TypeScript 5.6.3)
- npm or similar package manager

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```
2. **Start development server:**
   ```bash
   npm run dev
   ```
3. **Access the application:**
   Open `http://localhost:5000` in your browser

## 🔧 API Configuration (Optional)

For full AI functionality, configure these external APIs:

### Mistral AI Integration

Add to your `.env` file:

```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

This enables AI responses for queries not found in the memory database.

### Memory Encryption (Recommended for Privacy)

To encrypt sensitive conversation data at rest:

1. Generate a secure encryption key:

   ```bash
   openssl rand -base64 32
   ```

2. Add to your `.env` file:

   ```env
   MEMORY_KEY=your_generated_encryption_key_here
   ```

3. Restart the application - all new messages will be encrypted automatically

**Benefits:**

- Protects personal conversations stored in the SQLite database
- AES-256-GCM encryption with authentication
- Backward compatible - works with existing unencrypted data
- No impact on application performance

**Important:** Store your `MEMORY_KEY` securely - encrypted data cannot be recovered without it!

### Other Optional APIs

- **OpenAI** (for additional AI capabilities)
- **Weather Service** (for weather-related queries)
- **Note**: Image generation is currently disabled as Mistral AI doesn't support image generation

## 🔍 Memory System

The vector-based memory system automatically:

- Loads conversation history from `memory/memories.txt`
- Provides context-aware responses based on past interactions
- Stores new conversations and user activity
- Enables face recognition and visual memory features

## 📁 Project Structure

```
├── client/          # React frontend
├── server/          # Express backend with AI services
├── memory/          # Memory storage and conversation history
├── shared/          # Shared TypeScript schemas
└── dist/           # Built application (after npm run build)
```

## 🛠 Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check` - TypeScript compilation check
- `npm start` - Start production server

## 🎨 Features Overview

- **Adaptive personality** with coaching, empathetic, and creative traits
- **Memory-based conversations** using vector similarity search
- **Multiple avatar modes** (3D, Living, Interactive, Custom CSS, Video)
- **Voice recognition and synthesis** capabilities
- **Image and video analysis** features
- **Customizable UI themes** and transparency settings

The core companion functionality works entirely with the local memory system, providing a rich conversational experience even without external API access.
