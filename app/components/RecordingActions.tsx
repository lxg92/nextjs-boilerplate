"use client";

import { useState } from 'react';
import { useSaveRecording, useToggleFavorite, useDeleteRecording } from '../hooks/useRecordingPersistence';

interface RecordingActionsProps {
  audioBlob?: Blob;
  voiceId?: string;
  voiceName?: string;
  text?: string;
  speed?: number;
  audioConfig?: any;
  presetUsed?: string;
  recordingId?: string;
  isFavorite?: boolean;
  onSaveSuccess?: (recording: any) => void;
}

export const RecordingActions = ({
  audioBlob,
  voiceId,
  voiceName,
  text,
  speed,
  audioConfig,
  presetUsed,
  recordingId,
  isFavorite = false,
  onSaveSuccess,
}: RecordingActionsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  
  const saveRecording = useSaveRecording();
  const toggleFavorite = useToggleFavorite();
  const deleteRecording = useDeleteRecording();

  const handleSave = async () => {
    if (!audioBlob || !voiceId || !voiceName || !text || speed === undefined) {
      return;
    }

    setIsSaving(true);
    try {
      const file = new File([audioBlob], 'recording.mp3', { type: 'audio/mpeg' });
      const result = await saveRecording.mutateAsync({
        audioBlob: file,
        voiceId,
        voiceName,
        text,
        speed,
        audioConfig,
        presetUsed,
      });
      
      onSaveSuccess?.(result.recording);
    } catch (error) {
      console.error('Failed to save recording:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!recordingId) return;
    
    try {
      await toggleFavorite.mutateAsync({
        recordingId,
        isFavorite: !isFavorite,
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDelete = async () => {
    if (!recordingId) return;
    
    if (!confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    try {
      await deleteRecording.mutateAsync(recordingId);
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {audioBlob && !recordingId && (
        <button
          onClick={handleSave}
          disabled={isSaving || saveRecording.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving || saveRecording.isPending ? 'Saving...' : 'Save Recording'}
        </button>
      )}
      
      {recordingId && (
        <>
          <button
            onClick={handleToggleFavorite}
            disabled={toggleFavorite.isPending}
            className={`px-3 py-2 rounded-lg transition-colors ${
              isFavorite
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
          
          <button
            onClick={handleDelete}
            disabled={deleteRecording.isPending}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Delete recording"
          >
            🗑️
          </button>
        </>
      )}
    </div>
  );
};


