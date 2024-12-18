import fetch from 'node-fetch';
import { URL } from 'url';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Determines the media type based on URL or file extension
 * @param url - The media URL or file path
 * @returns The corresponding MIME type string
 */
export function getMediaType(url: string): string {
  try {
    // First try to get content type from URL extension
    const ext = new URL(url).pathname.split('.').pop()?.toLowerCase();
    
    // Map common extensions to proper MIME types
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'mp4': 'video/mp4',
      'webp': 'image/webp',
      'webm': 'video/webm'
    };

    // Return proper MIME type if extension is recognized
    if (ext && ext in mimeTypes) {
      return mimeTypes[ext];
    }

    // If no extension or unrecognized, try to detect from response headers
    return 'application/octet-stream'; // Fallback type
  } catch (error) {
    console.error('Error determining media type:', error);
    return 'application/octet-stream';
  }
}

/**
 * Fetches media content from URL and prepares it for tweet attachment
 * @param url - URL of the media file
 * @returns Promise resolving to media data object
 */
async function fetchMediaFromUrl(url: string): Promise<{ data: Buffer; mediaType: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Read the response buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Get content type from response headers
    let contentType = response.headers.get('content-type');
    
    // If content-type is missing or generic, detect it from buffer
    if (!contentType || contentType === 'application/octet-stream') {
      const fileTypeResult = await fileTypeFromBuffer(buffer);
      contentType = fileTypeResult ? fileTypeResult.mime : 'application/octet-stream';
    }
    
    return {
      data: buffer,
      mediaType: contentType
    };
  } catch (error) {
    console.error(`Error fetching media from URL ${url}:`, error);
    throw error;
  }
}

/**
 * Prepares media data for Twitter API from URLs
 * @param urls - Array of media URLs to prepare
 * @returns Promise with prepared media data array
 */
export async function prepareMediaData(urls: string[]): Promise<Array<{ data: Buffer; mediaType: string; }>> {
  const mediaData = [];
  for (const url of urls) {
    try {
      const data = await fetchMediaFromUrl(url);
      if (data) {
        mediaData.push(data);
      }
    } catch (error) {
      console.error(`Error preparing media from URL ${url}:`, error);
    }
  }
  return mediaData;
} 