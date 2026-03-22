
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';

export enum AppState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum VeoModel {
  VEO_FAST = 'veo-3.1-fast-generate-preview',
  VEO = 'veo-3.1-generate-preview',
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum Resolution {
  P720 = '720p',
  P1080 = '1080p',
  P4K = '4k',
}

export enum GenerationMode {
  TEXT_TO_VIDEO = 'Text to Video',
  IMAGE_TO_VIDEO = 'Image to Video',
  FRAMES_TO_VIDEO = 'Frames to Video',
  REFERENCES_TO_VIDEO = 'References to Video',
  EXTEND_VIDEO = 'Extend Video',
}

export interface ImageFile {
  file: File;
  base64: string;
}

export interface VideoFile {
  file: File;
  base64: string;
}

export enum TransitionType {
  CUT = 'cut',
  FADE = 'fade',
  DISSOLVE = 'dissolve',
}

export enum CameraMovement {
  NONE = 'none',
  PAN_LEFT = 'pan left',
  PAN_RIGHT = 'pan right',
  TILT_UP = 'tilt up',
  TILT_DOWN = 'tilt down',
  ZOOM_IN = 'zoom in',
  ZOOM_OUT = 'zoom out',
  DOLLY_IN = 'dolly in',
  DOLLY_OUT = 'dolly out',
}

export enum StylePreset {
  NONE = 'none',
  CINEMATIC = 'cinematic',
  CYBERPUNK = 'cyberpunk',
  VINTAGE = 'vintage',
  ANIME = 'anime',
  NOIR = 'noir',
  PIXAR = 'pixar',
  SURREAL = 'surreal',
}

export enum MotionIntensity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum FrameRate {
  FPS_24 = '24',
  FPS_30 = '30',
  FPS_60 = '60',
}

export interface GenerateVideoParams {
  prompt: string;
  negativePrompt?: string;
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mode: GenerationMode;
  startFrame?: ImageFile | null;
  endFrame?: ImageFile | null;
  referenceImages?: ImageFile[];
  styleImage?: ImageFile | null;
  inputVideo?: VideoFile | null;
  inputVideoObject?: Video | null;
  isLooping?: boolean;
  transition?: TransitionType;
  cameraMovement?: CameraMovement;
  stylePreset?: StylePreset;
  motionIntensity?: MotionIntensity;
  fps?: FrameRate;
  seed?: number;
}

export enum SubscriptionStatus {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export interface UserSubscription {
  status: SubscriptionStatus;
  expiresAt?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  subscription: UserSubscription;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  params: GenerateVideoParams;
  timestamp: number;
  videoUrl?: string; // Optional, might be expired
  videoUri?: string; // Permanent Gemini URI
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
