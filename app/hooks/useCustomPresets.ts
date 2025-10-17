"use client";

import { useState, useEffect, useCallback } from 'react';
import { AudioPreset, AudioPresetConfig } from '../utils/audioPresets';

// Extended preset type to include metadata for custom presets
export interface CustomPreset extends AudioPreset {
  id: string;
  isCustom: true;
  createdAt: Date;
  updatedAt: Date;
}

// Type guard to check if a preset is custom
export const isCustomPreset = (preset: AudioPreset | CustomPreset): preset is CustomPreset => {
  return 'isCustom' in preset && preset.isCustom === true;
};

// Storage key for custom presets
const CUSTOM_PRESETS_STORAGE_KEY = 'audio_custom_presets';

// Database-ready interface for future migration
export interface PresetDatabaseRecord {
  id: string;
  userId: string;
  name: string;
  description: string;
  config: AudioPresetConfig;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export const useCustomPresets = () => {
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);

  // Load custom presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const presetsWithDates = parsed.map((preset: any) => ({
          ...preset,
          createdAt: new Date(preset.createdAt),
          updatedAt: new Date(preset.updatedAt),
        }));
        setCustomPresets(presetsWithDates);
      }
    } catch (error) {
      console.error('Failed to load custom presets:', error);
    }
  }, []);

  // Save custom presets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(customPresets));
    } catch (error) {
      console.error('Failed to save custom presets:', error);
    }
  }, [customPresets]);

  // Create a new custom preset
  const createCustomPreset = useCallback((
    name: string,
    description: string,
    config: AudioPresetConfig
  ): CustomPreset => {
    const now = new Date();
    const newPreset: CustomPreset = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      config,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };

    setCustomPresets(prev => [...prev, newPreset]);
    return newPreset;
  }, []);

  // Update an existing custom preset
  const updateCustomPreset = useCallback((
    id: string,
    updates: Partial<Pick<CustomPreset, 'name' | 'description' | 'config'>>
  ): boolean => {
    setCustomPresets(prev => {
      const index = prev.findIndex(preset => preset.id === id);
      if (index === -1) return prev;

      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        ...updates,
        updatedAt: new Date(),
      };
      return updated;
    });
    return true;
  }, []);

  // Delete a custom preset
  const deleteCustomPreset = useCallback((id: string): boolean => {
    setCustomPresets(prev => {
      const index = prev.findIndex(preset => preset.id === id);
      if (index === -1) return prev;
      
      return prev.filter(preset => preset.id !== id);
    });
    return true;
  }, []);

  // Get a custom preset by ID
  const getCustomPreset = useCallback((id: string): CustomPreset | undefined => {
    return customPresets.find(preset => preset.id === id);
  }, [customPresets]);

  // Check if a preset name already exists (case-insensitive)
  const isPresetNameTaken = useCallback((name: string, excludeId?: string): boolean => {
    const lowerName = name.toLowerCase().trim();
    return customPresets.some(preset => 
      preset.name.toLowerCase().trim() === lowerName && 
      preset.id !== excludeId
    );
  }, [customPresets]);

  // Convert custom presets to database format (for future migration)
  const getCustomPresetsForDatabase = useCallback((userId: string): PresetDatabaseRecord[] => {
    return customPresets.map(preset => ({
      id: preset.id,
      userId,
      name: preset.name,
      description: preset.description,
      config: preset.config,
      createdAt: preset.createdAt.toISOString(),
      updatedAt: preset.updatedAt.toISOString(),
    }));
  }, [customPresets]);

  // Import custom presets from database format
  const importCustomPresetsFromDatabase = useCallback((records: PresetDatabaseRecord[]): void => {
    const importedPresets: CustomPreset[] = records.map(record => ({
      id: record.id,
      name: record.name,
      description: record.description,
      config: record.config,
      isCustom: true,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    }));

    setCustomPresets(importedPresets);
  }, []);

  return {
    customPresets,
    createCustomPreset,
    updateCustomPreset,
    deleteCustomPreset,
    getCustomPreset,
    isPresetNameTaken,
    getCustomPresetsForDatabase,
    importCustomPresetsFromDatabase,
  };
};
