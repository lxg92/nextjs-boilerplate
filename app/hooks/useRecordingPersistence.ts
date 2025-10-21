"use client";

import { useState, useEffect, useCallback } from "react";
import { Recording } from "../types";

const STORAGE_KEY = "voice-recordings";

export const useRecordingPersistence = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recordings from localStorage on mount
  useEffect(() => {
    try {
      const storedRecordings = localStorage.getItem(STORAGE_KEY);
      if (storedRecordings) {
        const parsedRecordings = JSON.parse(storedRecordings);
        // Validate that the parsed data is an array
        if (Array.isArray(parsedRecordings)) {
          setRecordings(parsedRecordings);
        }
      }
    } catch (error) {
      console.error("Failed to load recordings from localStorage:", error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
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
