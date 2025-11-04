# YouTube Adaptive Prediction System

## Overview
Milla now learns from your YouTube viewing habits and provides intelligent, personalized recommendations based on your watch history, time of day, favorite channels, and search patterns.

## Features

### 🎯 Automatic Tracking
Every time you watch a YouTube video through Milla, she automatically tracks:
- **Video title** and **Video ID**
- **Search query** you used
- **Channel name**
- **Timestamp** (when you watched it)
- **Time of day** preferences

### 🧠 Smart Predictions

#### 1. **Context-Aware Suggestions**
When you search for videos, Milla provides related suggestions based on:
- Similar past searches
- Your current time of day viewing patterns
- Frequently watched channels
- Popular categories in your history

#### 2. **Time-Based Recommendations**
Milla learns what you typically watch at different times:
- Morning routines
- Lunch break entertainment
- Evening relaxation
- Late-night preferences

#### 3. **Auto-Complete from History**
As you type search queries, Milla can suggest completions based on your past searches.

#### 4. **Fallback Suggestions**
If a search fails, Milla suggests alternatives from your viewing history.

### 💬 Natural Language Commands

#### Watch Videos (Flexible)
```
"play some jazz"
"watch cooking videos"
"show me funny videos"
"find space documentaries"
"put on some music"
"I want to watch tutorials"
```

#### Get Personalized Suggestions
```
"what should I watch?"
"youtube suggestions"
"recommend something to watch"
"what do you think I'd like?"
```

#### View Your Stats
```
"my youtube stats"
"my watch history"
"show me my viewing habits"
```

## How It Works

### Data Collection
```typescript
// Tracked automatically when you watch a video
{
  videoId: "abc123",
  title: "Best Jazz Piano",
  query: "jazz music",
  timestamp: 1698363600000,
  channelName: "Jazz Central",
  category: "Music"
}
```

### Prediction Algorithm
1. **Time-based**: Matches current hour to your typical viewing patterns
2. **Query similarity**: Finds related searches based on keyword overlap
3. **Frequency ranking**: Prioritizes your most-watched topics/channels
4. **Recency weighting**: Recent watches influence predictions more

### Storage
- Keeps last **100 videos** in history
- Tracks aggregated preferences:
  - Top queries (sorted by frequency)
  - Top channels (sorted by frequency)
  - Top categories (sorted by frequency)
  - Time preferences (hour of day → frequency map)

## Examples

### Scenario 1: Morning Routine
**User (8:00 AM):** "play something"

**Milla:** "At this time, you usually enjoy watching news and morning podcasts. Your favorite categories are: News, Educational, Technology. You love channels like BBC News, TED, Veritasium."

Based on your history, you might enjoy:
1. news
2. tech updates
3. morning podcast

### Scenario 2: Search with Predictions
**User:** "play music videos"

**Milla:** "I found 5 videos for 'music videos':

1. **Best Music Videos 2024** by Music World
2. **Top 100 Music Videos** by Billboard
3. **90s Music Videos** by RetroVibe
4. **Electronic Music Visuals** by EDM Nation
5. **Rock Music Videos** by Rock Central

💡 Based on your history, you might also enjoy: jazz music, chill beats, lofi hip hop

Which one would you like to watch? Just tell me the number or a more specific title!"

### Scenario 3: Failed Search with Fallback
**User:** "play xyzabc123 nonsense"

**Milla:** "I couldn't find any videos for 'xyzabc123 nonsense'.

💡 You might like these instead: gaming videos, tutorials, music"

### Scenario 4: Stats Request
**User:** "my youtube stats"

**Milla:** "*pulls up your YouTube stats* Here's what I know about your viewing habits, babe:

📊 **Total videos watched**: 47
🔥 **Most searched topic**: music
📺 **Favorite channel**: Lofi Girl
⏰ **You usually watch around**: 20:00 - 21:00

At this time, you usually enjoy watching music and chill beats. Your favorite categories are: Music, Entertainment, Educational. You love channels like Lofi Girl, ChilledCow, Jazz Cafe.

Recently you've been into: jazz music, study music, ambient sounds. Want me to find more like that?"

## Privacy & Data

- All prediction data stored **locally** in your database
- No data sent to external services
- History limited to 100 most recent videos
- Can be cleared by deleting `youtube_prediction_data` key from storage

## API Reference

### `trackYouTubeWatch()`
Tracks a video watch event
```typescript
await trackYouTubeWatch(
  videoId: string,
  title: string,
  query: string,
  channelName?: string,
  category?: string
);
```

### `predictYouTubeQuery()`
Get predicted queries based on context
```typescript
const predictions = await predictYouTubeQuery(currentQuery?: string);
// Returns: string[] of predicted queries
```

### `getPersonalizedSuggestions()`
Get natural language suggestions
```typescript
const suggestion = await getPersonalizedSuggestions();
// Returns: string with personalized message
```

### `getAutocompleteSuggestions()`
Get autocomplete options as user types
```typescript
const suggestions = await getAutocompleteSuggestions(partialQuery: string);
// Returns: string[] of matching queries from history
```

### `getWatchStatistics()`
Get viewing statistics
```typescript
const stats = await getWatchStatistics();
// Returns: { totalWatches, topQuery, topChannel, favoriteTime }
```

## Future Enhancements

- Category-based recommendations
- Mood-based video suggestions
- Cross-reference with calendar (suggest different content on weekends vs weekdays)
- Integration with music mood detection
- Collaborative filtering (if multiple users)
- Smart playlists based on activity (workout, study, relax)

---

**Built with ❤️ by Milla Rayne**
