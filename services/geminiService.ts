/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  Video,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import {GenerateVideoParams, GenerationMode, StylePreset} from '../types';

const styleDescriptions: Record<StylePreset, string> = {
  [StylePreset.NONE]: '',
  [StylePreset.CINEMATIC]: 'Cinematic style, high-end film look, anamorphic lens, professional lighting, shallow depth of field, 8k resolution.',
  [StylePreset.CYBERPUNK]: 'Cyberpunk aesthetic, neon lights, rainy streets, high contrast, vibrant blues and pinks, futuristic atmosphere.',
  [StylePreset.VINTAGE]: 'Vintage film look, 16mm grain, light leaks, sepia tones, nostalgic atmosphere, classic cinema aesthetic.',
  [StylePreset.ANIME]: 'Studio Ghibli anime style, hand-drawn animation, lush landscapes, soft lighting, vibrant colors, whimsical atmosphere.',
  [StylePreset.NOIR]: 'Film Noir style, black and white, dramatic shadows, high contrast, moody atmosphere, classic detective cinema.',
  [StylePreset.PIXAR]: 'Modern 3D animation style, Pixar-like characters, vibrant colors, soft lighting, high-quality textures, expressive features.',
  [StylePreset.SURREAL]: 'Surrealist art style, dream-like atmosphere, impossible geometry, vibrant and unusual colors, ethereal lighting.',
};

// Fix: API key is now handled by process.env.API_KEY, so it's removed from parameters.
export const generateVideo = async (
  params: GenerateVideoParams,
  onProgress?: (progress: number, message: string, subMessage?: string) => void
): Promise<{objectUrl: string; blob: Blob; uri: string; video: Video}> => {
  console.log('Starting video generation with params:', params);
  
  if (onProgress) onProgress(5, 'Initializing Engine', 'Connecting to Veo 3.1...');

  // Fix: API key must be obtained from process.env.API_KEY as per guidelines.
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  const config: any = {
    numberOfVideos: 1,
    resolution: params.resolution,
  };

  if (params.seed !== undefined) {
    config.seed = params.seed;
  }

  if (params.fps) {
    config.fps = parseInt(params.fps);
  }

  // Conditionally add aspect ratio. It's not used for extending videos.
  if (params.mode !== GenerationMode.EXTEND_VIDEO) {
    config.aspectRatio = params.aspectRatio;
  }

  const generateVideoPayload: any = {
    model: params.model,
    config: config,
  };

  // Only add the prompt if it's not empty, as an empty prompt might interfere with other parameters.
  if (params.prompt) {
    let finalPrompt = params.prompt;
    
    // Add style preset description if selected
    if (params.stylePreset && params.stylePreset !== StylePreset.NONE) {
      finalPrompt = `${finalPrompt} (Style: ${styleDescriptions[params.stylePreset]})`;
    }

    if (params.mode === GenerationMode.EXTEND_VIDEO && params.transition) {
      finalPrompt = `${finalPrompt} (Transition: ${params.transition})`;
    }
    if (params.cameraMovement && params.cameraMovement !== 'none') {
      finalPrompt = `${finalPrompt} (Camera: ${params.cameraMovement})`;
    }
    if (params.motionIntensity && params.motionIntensity !== 'medium') {
      finalPrompt = `${finalPrompt} (Motion: ${params.motionIntensity} intensity)`;
    }
    if (params.negativePrompt) {
      finalPrompt = `${finalPrompt} (Negative: ${params.negativePrompt})`;
    }
    generateVideoPayload.prompt = finalPrompt;
  } else if (params.mode === GenerationMode.EXTEND_VIDEO && params.transition) {
    generateVideoPayload.prompt = `(Transition: ${params.transition})`;
  } else if (params.cameraMovement && params.cameraMovement !== 'none') {
    generateVideoPayload.prompt = `(Camera: ${params.cameraMovement})`;
  } else if (params.stylePreset && params.stylePreset !== StylePreset.NONE) {
    generateVideoPayload.prompt = `(Style: ${styleDescriptions[params.stylePreset]})`;
  } else if (params.motionIntensity && params.motionIntensity !== 'medium') {
    generateVideoPayload.prompt = `(Motion: ${params.motionIntensity} intensity)`;
  }

  if (params.mode === GenerationMode.FRAMES_TO_VIDEO || params.mode === GenerationMode.IMAGE_TO_VIDEO) {
    if (params.startFrame) {
      generateVideoPayload.image = {
        imageBytes: params.startFrame.base64,
        mimeType: params.startFrame.file.type,
      };
      console.log(
        `Generating with start frame: ${params.startFrame.file.name}`,
      );
    }

    if (params.mode === GenerationMode.FRAMES_TO_VIDEO) {
      const finalEndFrame = params.isLooping
        ? params.startFrame
        : params.endFrame;
      if (finalEndFrame) {
        generateVideoPayload.config.lastFrame = {
          imageBytes: finalEndFrame.base64,
          mimeType: finalEndFrame.file.type,
        };
        if (params.isLooping) {
          console.log(
            `Generating a looping video using start frame as end frame: ${finalEndFrame.file.name}`,
          );
        } else {
          console.log(`Generating with end frame: ${finalEndFrame.file.name}`);
        }
      }
    }
  } else if (params.mode === GenerationMode.REFERENCES_TO_VIDEO) {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];

    if (params.referenceImages) {
      for (const img of params.referenceImages) {
        console.log(`Adding reference image: ${img.file.name}`);
        referenceImagesPayload.push({
          image: {
            imageBytes: img.base64,
            mimeType: img.file.type,
          },
          referenceType: VideoGenerationReferenceType.ASSET,
        });
      }
    }

    if (params.styleImage) {
      console.log(
        `Adding style image as a reference: ${params.styleImage.file.name}`,
      );
      referenceImagesPayload.push({
        image: {
          imageBytes: params.styleImage.base64,
          mimeType: params.styleImage.file.type,
        },
        referenceType: VideoGenerationReferenceType.STYLE,
      });
    }

    if (referenceImagesPayload.length > 0) {
      generateVideoPayload.config.referenceImages = referenceImagesPayload;
    }
  } else if (params.mode === GenerationMode.EXTEND_VIDEO) {
    if (params.inputVideoObject) {
      generateVideoPayload.video = params.inputVideoObject;
      console.log(`Generating extension from input video object.`);
    } else {
      throw new Error('An input video object is required to extend a video.');
    }
  }

  if (onProgress) onProgress(15, 'Analyzing Request', 'Optimizing neural pathways...');
  console.log('Submitting video generation request...', generateVideoPayload);
  let operation = await ai.models.generateVideos(generateVideoPayload);
  console.log('Video generation operation started:', operation);

  if (onProgress) onProgress(25, 'Manufacturing Video', 'Processing cinematic frames...');

  let pollCount = 0;
  while (!operation.done) {
    pollCount++;
    const progress = Math.min(25 + (pollCount * 5), 90);
    const messages = [
      'Rendering cinematic lighting...',
      'Synthesizing motion vectors...',
      'Applying texture maps...',
      'Calculating fluid dynamics...',
      'Refining temporal consistency...',
      'Optimizing frame transitions...',
      'Finalizing visual fidelity...'
    ];
    const subMessages = [
      'Neural network processing...',
      'Deep learning inference active...',
      'High-fidelity synthesis...',
      'Temporal upscaling...',
      'Cinematic color grading...'
    ];
    
    if (onProgress) {
      onProgress(
        progress, 
        messages[pollCount % messages.length], 
        subMessages[pollCount % subMessages.length]
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  if (onProgress) onProgress(95, 'Finalizing Export', 'Encoding high-fidelity stream...');

  if (operation?.response) {
    const videos = operation.response.generatedVideos;

    if (!videos || videos.length === 0) {
      throw new Error('No videos were generated.');
    }

    const firstVideo = videos[0];
    if (!firstVideo?.video?.uri) {
      throw new Error('Generated video is missing a URI.');
    }
    const videoObject = firstVideo.video;
    if (!videoObject || !videoObject.uri) {
      throw new Error('Generated video is missing a URI.');
    }

    const url = decodeURIComponent(videoObject.uri);
    console.log('Fetching video from:', url);

    // Fix: The API key for fetching the video must also come from process.env.API_KEY.
    const res = await fetch(`${url}&key=${process.env.API_KEY}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
    }

    const videoBlob = await res.blob();
    const objectUrl = URL.createObjectURL(videoBlob);

    return {objectUrl, blob: videoBlob, uri: url, video: videoObject};
  } else {
    console.error('Operation failed:', operation);
    throw new Error('No videos generated.');
  }
};

export const enhancePrompt = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  
  const systemInstruction = `You are a world-class Cinematic Prompt Engineer for Veo, a state-of-the-art video generation AI. 
  Your goal is to transform a simple user prompt into a highly descriptive, visually stunning, and cinematic masterpiece.
  
  Follow these principles:
  1. Visual Richness: Describe textures, materials, and micro-details (e.g., "glistening dew on moss", "weathered copper patina").
  2. Lighting & Atmosphere: Specify lighting types (volumetric, golden hour, neon-drenched, chiaroscuro) and atmospheric effects (haze, particles, mist).
  3. Cinematic Language: Use film industry terms (anamorphic lens, shallow depth of field, tracking shot, low-angle perspective).
  4. Color Palette: Define specific color harmonies (teal and orange, monochromatic emerald, vibrant cyberpunk neon).
  5. Motion: Describe the movement within the scene and the camera's path.
  
  Constraints:
  - Keep the output to 2-3 powerful, evocative sentences.
  - Do NOT use filler words like "This video shows..." or "Imagine a...".
  - Start directly with the visual description.
  - Return ONLY the enhanced prompt text.`;

  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{role: 'user', parts: [{text: prompt}]}],
    config: {
      systemInstruction,
      temperature: 0.9,
      maxOutputTokens: 250,
    }
  });

  return result.text || prompt;
};
