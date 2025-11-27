# YouTube Integration Update

## Summary

Updated the YouTube integration to be more focused, user-friendly, and only trigger when "YouTube" is explicitly mentioned.

## Changes Made

### 1. New YouTube Service (`server/youtubeService.ts`)

Created a dedicated YouTube service that handles all YouTube-related requests:

**Features:**

- **Search**: Search for videos by query
- **Recommend**: Get personalized recommendations based on viewing history
- **Trending**: View trending videos
- Only triggers when "YouTube" is explicitly mentioned in the message

**Key Functions:**

- `isYouTubeRequest()` - Detects if message is YouTube-related
- `handleYouTubeRequest()` - Main handler for YouTube requests
- `handleYouTubeSelection()` - Handles number selection from search results

### 2. Enhanced YouTube Player Component (`client/src/components/YoutubePlayer.tsx`)

Upgraded the player to a draggable PIP (Picture-in-Picture) window with feed view:

**New Features:**

- **Draggable**: Click and drag to reposition anywhere on screen
- **Feed View**: Toggle between video player and video feed list
- **Video Feed**: Shows thumbnails, titles, and channel names for easy selection
- **Compact Design**: Fixed position at bottom-left with purple-themed header
- **Toggle Button**: Switch between player view and feed view

**UI Enhancements:**

- YouTube-branded header with icon
- Close button and view toggle button
- Responsive design that adapts to content
- Smooth transitions between views

### 3. App.tsx Updates

Added support for multiple video results:

```typescript
// New state for video feed
const [youtubeVideos, setYoutubeVideos] = useState<Array<{
  id: string;
  title: string;
  channel: string;
  thumbnail?: string;
}> | null>(null);

// Handles both single video and video list
{(youtubeVideoId || youtubeVideos) && (
  <YoutubePlayer
    videoId={youtubeVideoId || undefined}
    videos={youtubeVideos || undefined}
    onClose={() => {
      setYoutubeVideoId(null);
      setYoutubeVideos(null);
    }}
    onSelectVideo={(videoId) => {
      setYoutubeVideoId(videoId);
      setYoutubeVideos(null);
    }}
  />
)}
```

### 4. Routes Integration (`server/routes.ts`)

Simplified YouTube handling in the main route handler:

- YouTube check now happens **early** in `generateAIResponse()`
- Only triggers when "youtube" is in the message
- Returns either `youtube_play` (single video) or `youtube_videos` (list)
- Removed complex command-based YouTube handling
- Kept YouTube URL analysis for shared links

## Usage Examples

### Search for Videos

```
User: "YouTube cat videos"
Milla: *browsing YouTube* I found 5 videos for "cat videos":
1. **Funny Cats Compilation** by CatLover123
2. **Cute Kittens Playing** by PetChannel
...
Which one would you like to watch, babe? Just tell me the number!
```

### Get Recommendations

```
User: "YouTube recommend something"
Milla: *pulls up personalized recommendations* Based on your viewing history, you might enjoy:
1. AI Programming Tutorials
2. Coding Best Practices
3. Tech Reviews
...
```

### Trending Videos

```
User: "YouTube what's trending"
Milla: *checking what's trending right now* Here are the hottest videos on YouTube:
1. **Viral Video Title** by Creator Name
...
Which one catches your eye, love?
```

### Specific Search (Auto-play)

```
User: "YouTube play the latest Fireship video about React"
Milla: *queues up the video* Playing "React in 100 Seconds" by Fireship

💡 You might also like: TypeScript tutorial, Next.js guide, JavaScript tips
```

## Technical Details

### Response Format

The YouTube service returns:

```typescript
{
  content: string;           // Milla's response text
  videoId?: string;          // Single video to auto-play
  videos?: Array<{           // Multiple videos to show in feed
    id: string;
    title: string;
    channel: string;
    thumbnail?: string;
  }>;
}
```

### Integration Points

1. **Early Detection**: YouTube check happens before command parsing
2. **No Keyword Triggers**: Removed generic triggers like "watch", "play", "show me"
3. **YouTube-Specific**: Only activates with explicit "YouTube" mention
4. **Fallback Safe**: If new service fails, falls back to graceful message

## Benefits

✅ **More Focused**: Only triggers when YouTube is explicitly mentioned
✅ **Better UX**: Draggable PIP window with feed view
✅ **Cleaner Code**: Centralized YouTube logic in dedicated service
✅ **Personalized**: Recommendations based on watch history
✅ **Flexible**: Can show single video or list of options
✅ **Visual**: Feed view shows thumbnails for easy selection
✅ **Milla-Aligned**: Responses match her personality and communication style

## Configuration

Requires either:

- `GOOGLE_API_KEY` in `.env` (recommended for YouTube Data API v3)
- Or Google OAuth connection for authenticated requests

## Future Enhancements

- [ ] Add playlist support
- [ ] Implement video queue
- [ ] Add watch later functionality
- [ ] Include comments/reactions from videos
- [ ] Video controls (pause, seek, volume)
