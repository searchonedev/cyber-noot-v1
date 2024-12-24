export interface MediaResult {
  success: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'gif';
  error?: string;
} 