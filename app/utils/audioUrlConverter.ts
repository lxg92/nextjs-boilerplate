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
    let response: Response;
    try {
      response = await fetch(blobUrl);
    } catch (error) {
      Sentry.captureException(error as Error, {
        tags: { operation: "blob-url-fetch", feature: "audio-url-converter", error_type: "network" },
        extra: { 
          url_type: "blob",
          url_length: blobUrl.length,
        },
      });
      throw error;
    }

    let blob: Blob;
    try {
      blob = await response.blob();
    } catch (error) {
      Sentry.captureException(error as Error, {
        tags: { operation: "blob-url-fetch", feature: "audio-url-converter", error_type: "blob_parse" },
        extra: { 
          url_type: "blob",
          response_status: response.status,
          response_ok: response.ok,
        },
      });
      throw error;
    }
    
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
            tags: { operation: "blob-to-data-url", feature: "audio-url-converter", error_type: "conversion" },
            extra: { 
              url_type: "blob",
              blob_size: blob.size,
              blob_type: blob.type,
              result_type: typeof result,
            },
          });
          reject(error);
        }
      };
      reader.onerror = () => {
        const error = new Error('Failed to read blob');
        Sentry.captureException(error, {
          tags: { operation: "blob-to-data-url", feature: "audio-url-converter", error_type: "filereader" },
          extra: { 
            url_type: "blob",
            blob_size: blob.size,
            blob_type: blob.type,
          },
        });
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Only log if it's not already logged by Sentry above
    if (!(error instanceof Error && (error.message.includes("Failed to convert") || error.message.includes("Failed to read")))) {
      Sentry.captureException(error as Error, {
        tags: { operation: "blob-url-to-data-url", feature: "audio-url-converter" },
        extra: { url_type: "blob" },
      });
    }
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
    if (!response.ok) {
      Sentry.captureMessage("Blob URL validation failed - URL not accessible", {
        level: "warning",
        tags: { operation: "validate-blob-url", feature: "audio-url-converter" },
        extra: { 
          url_type: "blob",
          response_status: response.status,
          response_status_text: response.statusText,
        },
      });
    }
    return response.ok;
  } catch (error) {
    Sentry.captureException(error as Error, {
      tags: { operation: "validate-blob-url", feature: "audio-url-converter", error_type: "network" },
      extra: { 
        url_type: "blob",
      },
    });
    return false;
  }
};

