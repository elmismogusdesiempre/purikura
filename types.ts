
export enum AppState {
  IDLE = 'IDLE',
  CONFIG = 'CONFIG',
  COUNTDOWN = 'COUNTDOWN',
  CAPTURING = 'CAPTURING',
  PROCESSING_STRIP = 'PROCESSING_STRIP',
  REVIEW = 'REVIEW',
  ADMIN = 'ADMIN', // New Secret State
  SCREENSAVER = 'SCREENSAVER', // Digital Signage Mode
}

export interface PhotoData {
  id: string;
  dataUrl: string; // Base64
}

export type ImageSize = '1K' | '2K' | '4K';
export type FrameStyle = 'classic' | 'polaroid' | 'baroque' | 'modern';

export type BackgroundStyle = 'blur-strip' | 'solid-random' | 'gradient-random' | 'gradient-custom' | 'gallery-collage';

export type CameraEffect = 'none' | 'fisheye' | 'cctv' | 'heatmap' | 'vhs' | 'warhol' | 'tictak' | 'news' | 'emoji-challenge';

export interface BackgroundConfig {
  style: BackgroundStyle;
  color1: string; // Used for custom gradient
  color2: string; // Used for custom gradient
  showShapes: boolean;
  showEmojis: boolean;
  emojiList: string; // String of emojis separated by space/comma
  density: 'low' | 'medium' | 'high';
}

export interface TextStyleConfig {
  fontFamily: string;
  fontSize: number;
  color: string; // Hex
  bgColor: string; // Hex
  bgOpacity: number; // 0 to 1
  isBold: boolean;
  isItalic: boolean;
}

export interface DecorationItem {
  id: number;
  type: 'shape' | 'emoji';
  content: string | any; // Emoji char or Shape Component Name
  x: number; // %
  y: number; // %
  scale: number;
  rotation: number;
  color?: string; // For shapes
  animationDuration: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface AnalysisResult {
  text: string;
}

export enum GeminiModel {
  FLASH_LITE = 'gemini-flash-lite-latest',
  FLASH_IMAGE = 'gemini-2.5-flash-image',
  PRO_TEXT = 'gemini-3-pro-preview',
  PRO_IMAGE = 'gemini-3-pro-image-preview',
}

export interface AITheme {
  id: string;
  label: string;
  prompt: string;
  icon: string; // Emoji char
  type: 'filter' | 'background';
}

export interface Slide {
  id: string;
  type: 'image' | 'video';
  url: string; // Base64 image or video data
  duration: number; // Duration in seconds (only used for images)
}

export type PhotoLayout = 'strip' | 'grid-16-9';