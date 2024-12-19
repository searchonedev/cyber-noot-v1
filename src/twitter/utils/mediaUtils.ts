import fetch from 'node-fetch';
import { URL } from 'url';
import { fileTypeFromBuffer } from 'file-type';
import { Logger } from '../../utils/logger';

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
    Logger.log('Error determining media type:', error);
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
    Logger.log('Fetching media from URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Read the response buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    Logger.log('Successfully downloaded media, size:', buffer.length);
    
    // Get content type from response headers
    let contentType = response.headers.get('content-type');
    Logger.log('Content-Type from headers:', contentType);
    
    // If content-type is missing or generic, detect it from buffer
    if (!contentType || contentType === 'application/octet-stream') {
      const fileTypeResult = await fileTypeFromBuffer(buffer);
      contentType = fileTypeResult ? fileTypeResult.mime : 'image/jpeg'; // Default to JPEG for GLIF/FAL
      Logger.log('Detected content type:', contentType);
    }
    
    return {
      data: buffer,
      mediaType: contentType
    };
  } catch (error) {
    Logger.log(`Error fetching media from URL ${url}:`, error);
    throw error;
  }
}

/**
 * Prepares media data for Twitter API from URLs
 * @param urls - Array of media URLs to prepare
 * @returns Promise with prepared media data array
 */
export async function prepareMediaData(urls: string[]): Promise<Array<{ data: Buffer; mediaType: string; }>> {
  Logger.log('Preparing media data for URLs:', urls);
  
  const mediaData = [];
  for (const url of urls) {
    try {
      const data = await fetchMediaFromUrl(url);
      if (data) {
        mediaData.push(data);
        Logger.log('Successfully prepared media from URL:', url);
      }
    } catch (error) {
      Logger.log(`Error preparing media from URL ${url}:`, error);
    }
  }
  
  Logger.log('Total media items prepared:', mediaData.length);
  return mediaData;
} 