import fs from 'fs';
import path from 'path';
import { Logger } from '../../utils/logger';

// Path to video library - using forward slashes for consistency
const VIDEO_LIBRARY_PATH = 'E:/0_x-NOOTNOOTMFERS/agent_noot_files/videos';

// Interface for video metadata
interface VideoMetadata {
  filename: string;
  path: string;
  size: number;
  lastUsed?: Date;
}

// Cache for video metadata
let videoCache: VideoMetadata[] | null = null;

/**
 * Normalizes a file path to use forward slashes
 */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Scans the video library and caches metadata
 */
async function refreshVideoCache(): Promise<VideoMetadata[]> {
  try {
    const files = await fs.promises.readdir(VIDEO_LIBRARY_PATH);
    const videoFiles = files.filter(file => 
      ['.mp4', '.mov', '.avi', '.webm'].includes(path.extname(file).toLowerCase())
    );

    const metadata = await Promise.all(videoFiles.map(async file => {
      const filePath = path.join(VIDEO_LIBRARY_PATH, file);
      const stats = await fs.promises.stat(filePath);
      return {
        filename: file,
        path: normalizePath(filePath),
        size: stats.size,
        lastUsed: undefined
      };
    }));

    videoCache = metadata;
    Logger.log(`Refreshed video cache: found ${metadata.length} videos`);
    return metadata;
  } catch (error) {
    Logger.log('Error refreshing video cache:', error);
    throw error;
  }
}

/**
 * Gets a random video that hasn't been used recently
 */
export async function getRandomVideo(): Promise<string> {
  if (!videoCache) {
    await refreshVideoCache();
  }

  if (!videoCache || videoCache.length === 0) {
    throw new Error('No videos available in the library');
  }

  // Filter out recently used videos (within last 24 hours)
  const availableVideos = videoCache.filter(video => {
    if (!video.lastUsed) return true;
    const hoursSinceLastUse = (Date.now() - video.lastUsed.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastUse >= 24;
  });

  if (availableVideos.length === 0) {
    // If all videos were used recently, refresh cache and use any video
    await refreshVideoCache();
    const randomVideo = videoCache[Math.floor(Math.random() * videoCache.length)];
    randomVideo.lastUsed = new Date();
    return randomVideo.path;
  }

  // Select a random video from available ones
  const selectedVideo = availableVideos[Math.floor(Math.random() * availableVideos.length)];
  selectedVideo.lastUsed = new Date();
  return selectedVideo.path;
}

/**
 * Gets a video based on context matching (placeholder for future enhancement)
 * TODO: Implement context-based video selection using video metadata and tags
 */
export async function getContextMatchingVideo(context: string): Promise<string> {
  // For now, just return a random video
  // In the future, this could use video metadata, tags, or AI to match context
  return getRandomVideo();
}

// Initialize cache on module load
refreshVideoCache().catch(error => {
  Logger.log('Failed to initialize video cache:', error);
}); 