# Offline Mode Testing Guide

Test the Milla Rayne Android app's offline capabilities!

## 🧪 Test Scenarios

### Basic Setup

1. **Install the app** (no server required)
2. **Turn off WiFi and mobile data** OR **don't start the server**
3. **Open the Milla app**
4. **Start testing!**

---

## ✅ Test Cases

### 1. Greetings & Basic Conversation

**Try these messages:**
- "Hello"
- "Hi there"
- "Good morning"
- "How are you?"

**Expected:** Friendly greetings with time-appropriate responses

---

### 2. Time & Date Queries

**Try these messages:**
- "What time is it?"
- "What's the current time?"
- "What date is it today?"
- "What day is today?"

**Expected:** Current time, date, and day of week

---

### 3. Math Calculations

**Try these messages:**
- "What is 5 + 3?"
- "Calculate 25 * 4"
- "15 - 7"
- "100 / 4"

**Expected:** Correct math results

---

### 4. Device Controls

**Try these messages:**
- "Volume up"
- "Increase volume"
- "Volume down"
- "Mute"
- "Play music"
- "Pause"

**Expected:** Device responds to commands (volume changes, etc.)

---

### 5. Entertainment

**Try these messages:**
- "Tell me a joke"
- "Make me laugh"
- "I need motivation"
- "Inspire me"

**Expected:** Random jokes or motivational quotes

---

### 6. Identity & Help

**Try these messages:**
- "Who are you?"
- "What's your name?"
- "What can you do?"
- "Help"

**Expected:** Information about Milla and capabilities

---

### 7. Goodbyes

**Try these messages:**
- "Goodbye"
- "Bye"
- "See you later"

**Expected:** Friendly farewell message

---

### 8. Thank You

**Try these messages:**
- "Thank you"
- "Thanks"

**Expected:** "You're welcome" type responses

---

## ❌ Expected Limitations

These should gracefully explain they need a server:

**Try these messages:**
- "What's the weather?"
- "How to bake a cake?"
- "Search the web for..."

**Expected:** Polite explanation that server connection is needed

---

## 🎨 UI Indicators to Check

1. **Offline Badge**: Look for "Offline Mode" in the subtitle (should be yellow)
2. **Message Prefix**: Offline responses start with "🔌 Offline Mode"
3. **Empty State**: Shows "🔌 Running in offline mode" on first launch

---

## 📊 Performance Tests

1. **Response Time**: Offline responses should be instant (< 100ms)
2. **Memory Usage**: App should use minimal memory
3. **Battery**: No excessive battery drain
4. **Persistence**: Messages persist after closing and reopening app

---

## 🔄 Online/Offline Switching

**Test the transition:**

1. Start app in offline mode
2. Send a few messages (they should work)
3. Start the server on your computer
4. Send another message
5. Check if it connects to server (subtitle changes to "Your AI Companion")
6. Stop the server
7. Send another message
8. Check if it falls back to offline mode

**Expected:** Seamless switching with appropriate UI indicators

---

## 🐛 Bug Reporting

If you find issues, note:
- What message you sent
- What you expected
- What actually happened
- Whether you were in offline or online mode
- Android version and device model

---

## 💡 Advanced Testing

### Edge Cases

- Empty messages (should not send)
- Very long messages
- Special characters (!@#$%^&*)
- Emoji messages (😀🎉💜)
- Multiple messages in quick succession

### Stress Tests

- Send 100+ messages
- Fill database with thousands of messages
- Test after phone restart
- Test with low battery
- Test in airplane mode

---

## ✨ Success Criteria

✅ App launches without server
✅ Basic conversations work
✅ Time/date queries accurate
✅ Math calculations correct
✅ Device controls functional
✅ UI shows offline indicator
✅ No crashes or freezes
✅ Messages persist after restart
✅ Graceful fallback from server failures

---

Happy testing! 🚀
