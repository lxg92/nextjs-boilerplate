"use client";

import { useState, useEffect, useCallback } from "react";
import { Recording } from "../types";
import { isBlobUrl, validateBlobUrl, blobUrlToDataUrl } from "../utils/audioUrlConverter";

const STORAGE_KEY = "voice-recordings";

export const useRecordingPersistence = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recordings from localStorage on mount
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        const storedRecordings = localStorage.getItem(STORAGE_KEY);
        if (storedRecordings) {
          const parsedRecordings = JSON.parse(storedRecordings);
          // Validate that the parsed data is an array
          if (Array.isArray(parsedRecordings)) {
            // Process recordings to handle invalid blob URLs
            const processedRecordings = await Promise.all(
              parsedRecordings.map(async (recording: Recording) => {
                // If it's a blob URL, check if it's still valid
                if (isBlobUrl(recording.audioUrl)) {
                  const isValid = await validateBlobUrl(recording.audioUrl);
                  if (!isValid) {
                    // Try to convert invalid blob URL (will fail, but we'll filter it out)
                    console.warn(`Invalid blob URL detected for recording ${recording.id}, removing from list`);
                    return null;
                  }
                  // Convert valid blob URL to data URL for future persistence
                  try {
                    const dataUrl = await blobUrlToDataUrl(recording.audioUrl);
                    return { ...recording, audioUrl: dataUrl };
                  } catch (error) {
                    console.error(`Failed to convert blob URL for recording ${recording.id}:`, error);
                    return null;
                  }
                }
                return recording;
              })
            );
            
            // Filter out null values (invalid recordings)
            const validRecordings = processedRecordings.filter((r): r is Recording => r !== null);
            
            // Check if any recordings were converted or removed
            const wereRecordingsModified = validRecordings.length !== parsedRecordings.length || 
              validRecordings.some((r, i) => {
                const original = parsedRecordings[i];
                return original && r.audioUrl !== original.audioUrl;
              });
            
            // Save back the converted recordings if any were converted
            if (wereRecordingsModified && validRecordings.length > 0) {
              // Save converted recordings back to localStorage
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(validRecordings));
              } catch (error) {
                console.error("Failed to save converted recordings:", error);
              }
            }
            
            setRecordings(validRecordings);
          }
        }
      } catch (error) {
        console.error("Failed to load recordings from localStorage:", error);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecordings();
  }, []);

  // Save recordings to localStorage whenever recordings change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
      } catch (error) {
        console.error("Failed to save recordings to localStorage:", error);
      }
    }
  }, [recordings, isLoading]);

  // Add a new recording
  const addRecording = useCallback((recording: Recording) => {
    setRecordings(prev => [recording, ...prev]);
  }, []);

  // Delete a specific recording
  const deleteRecording = useCallback((recordingId: string) => {
    setRecordings(prev => prev.filter(recording => recording.id !== recordingId));
  }, []);

  // Clear all recordings
  const clearAllRecordings = useCallback(() => {
    setRecordings([]);
  }, []);

  // Update a specific recording
  const updateRecording = useCallback((recordingId: string, updates: Partial<Recording>) => {
    setRecordings(prev => 
      prev.map(recording => 
        recording.id === recordingId 
          ? { ...recording, ...updates }
          : recording
      )
    );
  }, []);

  // Get recording count
  const getRecordingCount = useCallback(() => {
    return recordings.length;
  }, [recordings]);

  // Check if storage is available
  const isStorageAvailable = useCallback(() => {
    try {
      const testKey = "__test_storage__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    recordings,
    isLoading,
    addRecording,
    deleteRecording,
    clearAllRecordings,
    updateRecording,
    getRecordingCount,
    isStorageAvailable
  };
};
