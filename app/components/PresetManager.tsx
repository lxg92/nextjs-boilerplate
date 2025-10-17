"use client";

import { useState } from 'react';
import { AudioPresetConfig } from '../utils/audioPresets';
import { CustomPreset, useCustomPresets, isCustomPreset } from '../hooks/useCustomPresets';

interface PresetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AudioPresetConfig;
  onPresetSelect: (preset: CustomPreset) => void;
  onPresetDelete?: (presetId: string) => void;
}

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  initialName?: string;
  initialDescription?: string;
}

const SavePresetModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialName = '', 
  initialDescription = '' 
}: SavePresetModalProps) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    
    if (!trimmedName) {
      setError('Preset name is required');
      return;
    }
    
    if (trimmedName.length > 50) {
      setError('Preset name must be 50 characters or less');
      return;
    }
    
    if (trimmedDescription.length > 200) {
      setError('Description must be 200 characters or less');
      return;
    }
    
    setError('');
    onSave(trimmedName, trimmedDescription);
    setName('');
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setError('');
    setName(initialName);
    setDescription(initialDescription);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Save Custom Preset
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Preset Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter preset name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              maxLength={50}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              maxLength={200}
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Preset
          </button>
        </div>
      </div>
    </div>
  );
};

export const PresetManager = ({ 
  isOpen, 
  onClose, 
  currentConfig, 
  onPresetSelect,
  onPresetDelete 
}: PresetManagerProps) => {
  const { 
    customPresets, 
    createCustomPreset, 
    deleteCustomPreset, 
    isPresetNameTaken 
  } = useCustomPresets();
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CustomPreset | null>(null);

  const handleSavePreset = (name: string, description: string) => {
    if (isPresetNameTaken(name)) {
      return; // Error will be shown in the modal
    }
    
    createCustomPreset(name, description, currentConfig);
  };

  const handleDeletePreset = (presetId: string) => {
    if (window.confirm('Are you sure you want to delete this custom preset?')) {
      deleteCustomPreset(presetId);
      if (onPresetDelete) {
        onPresetDelete(presetId);
      }
    }
  };

  const handleEditPreset = (preset: CustomPreset) => {
    setEditingPreset(preset);
    setShowSaveModal(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Custom Presets
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {customPresets.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No custom presets yet</p>
                <p className="text-sm">Create your first custom preset to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {preset.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {preset.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Created: {preset.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => onPresetSelect(preset)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => handleEditPreset(preset)}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePreset(preset.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Save Current Settings as Preset
            </button>
          </div>
        </div>
      </div>
      
      <SavePresetModal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setEditingPreset(null);
        }}
        onSave={handleSavePreset}
        initialName={editingPreset?.name || ''}
        initialDescription={editingPreset?.description || ''}
      />
    </>
  );
};
