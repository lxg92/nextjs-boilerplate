/**
 * Utility functions for converting audio blob URLs to persistent data URLs
 * Blob URLs are temporary and only exist for the browser session.
 * Data URLs (base64) persist across sessions in localStorage.
 */

/**
 * Converts a blob URL to a base64 data URL
 * @param blobUrl - The blob URL to convert
 * @returns A promise that resolves to a base64 data URL
 */
export const blobUrlToDataUrl = async (blobUrl: string): Promise<string> => {
  // If it's already a data URL, return it as-is
  if (blobUrl.startsWith('data:')) {
    return blobUrl;
  }

  // If it's not a blob URL, return as-is (might be a regular URL)
  if (!blobUrl.startsWith('blob:')) {
    return blobUrl;
  }

  try {
    // Fetch the blob
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    // Convert blob to base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to convert blob to data URL'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting blob URL to data URL:', error);
    throw error;
  }
};

/**
 * Checks if a URL is a blob URL
 * @param url - The URL to check
 * @returns True if the URL is a blob URL
 */
export const isBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

/**
 * Checks if a URL is a data URL
 * @param url - The URL to check
 * @returns True if the URL is a data URL
 */
export const isDataUrl = (url: string): boolean => {
  return url.startsWith('data:');
};

/**
 * Validates if a blob URL is still accessible
 * @param blobUrl - The blob URL to validate
 * @returns A promise that resolves to true if accessible, false otherwise
 */
export const validateBlobUrl = async (blobUrl: string): Promise<boolean> => {
  if (!isBlobUrl(blobUrl)) {
    return true; // Not a blob URL, assume valid
  }

  try {
    const response = await fetch(blobUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

