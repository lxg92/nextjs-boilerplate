# Voice Recordings localStorage Persistence Test

## How to Test

1. **Start the development server**: `npm run dev`

2. **Generate a voice recording**:
   - Go to "Upload Voice" tab
   - Upload a voice file
   - Go to "Generate Speech" tab
   - Generate a TTS recording
   - You should be redirected to "Voice Recordings" tab

3. **Verify persistence**:
   - Refresh the browser page (F5)
   - Navigate back to "Voice Recordings" tab
   - The recording should still be there

4. **Test deletion**:
   - Click the delete button (trash icon) on a recording
   - The recording should be removed
   - Refresh the page - it should stay deleted

5. **Test clear all**:
   - Generate multiple recordings
   - Click "Clear All Recordings" button
   - Confirm the deletion
   - All recordings should be removed
   - Refresh the page - they should stay deleted

## Expected Behavior

- ✅ Recordings persist across browser sessions
- ✅ Recordings persist across page refreshes
- ✅ Individual recordings can be deleted
- ✅ All recordings can be cleared at once
- ✅ localStorage is used for persistence
- ✅ Error handling for corrupted localStorage data
- ✅ Graceful fallback if localStorage is unavailable

## Storage Key

Recordings are stored in localStorage under the key: `voice-recordings`

## Data Structure

```typescript
interface Recording {
  id: string;
  audioUrl: string;
  voiceId: string;
  voiceName: string;
  text: string;
  speed: number;
  timestamp: number;
  audioConfig?: any;
}
```
