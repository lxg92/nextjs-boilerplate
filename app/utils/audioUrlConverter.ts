/**
 * Utility functions for converting audio blob URLs to persistent data URLs
 * Blob URLs are temporary and only exist for the browser session.
 * Data URLs (base64) persist across sessions in localStorage.
 */

import * as Sentry from "@sentry/nextjs";

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
    if (!response.ok) {
      const error = new Error(`Failed to fetch blob URL: ${response.status} ${response.statusText}`);
      Sentry.captureException(error, {
        tags: { feature: "audio-processing", operation: "blob_fetch", error_type: "fetch_failure" },
        extra: { blob_url_length: blobUrl.length, http_status: response.status },
      });
      throw error;
    }
    const blob = await response.blob();
    
    // Convert blob to base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          const error = new Error('Failed to convert blob to data URL');
          Sentry.captureException(error, {
            tags: { feature: "audio-processing", operation: "blob_conversion", error_type: "conversion_failure" },
            extra: { blob_size: blob.size, blob_type: blob.type },
          });
          reject(error);
        }
      };
      reader.onerror = () => {
        const error = new Error('Failed to read blob');
        Sentry.captureException(error, {
          tags: { feature: "audio-processing", operation: "blob_read", error_type: "filereader_error" },
          extra: { blob_size: blob.size, blob_type: blob.type },
        });
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting blob URL to data URL:', error);
    if (error instanceof Error && !error.message.includes("Failed to fetch blob URL") && !error.message.includes("Failed to convert blob to data URL") && !error.message.includes("Failed to read blob")) {
      Sentry.captureException(error, {
        tags: { feature: "audio-processing", operation: "blob_conversion", error_type: "general" },
        extra: { blob_url_length: blobUrl.length },
      });
    }
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
    if (!response.ok) {
      Sentry.captureMessage("Blob URL validation failed", {
        level: "warning",
        tags: { feature: "audio-processing", operation: "blob_validation", validation_failure: true },
        extra: { blob_url_length: blobUrl.length, http_status: response.status },
      });
    }
    return response.ok;
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { feature: "audio-processing", operation: "blob_validation", error_type: "fetch_error" },
      extra: { blob_url_length: blobUrl.length },
    });
    return false;
  }
};

