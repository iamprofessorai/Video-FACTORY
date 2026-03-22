
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import {enhancePrompt, generateVideo} from '../services/geminiService';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  AspectRatio,
  CameraMovement,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  Resolution,
  StylePreset,
  TransitionType,
  MotionIntensity,
  FrameRate,
  VeoModel,
  VideoFile,
} from '../types';
import {
  ActivityIcon,
  BanIcon,
  TimerIcon,
  HashIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  CloudIcon,
  FilmIcon,
  FramesModeIcon,
  GhostIcon,
  HistoryIcon,
  MoonIcon,
  PaletteIcon,
  PlusIcon,
  RectangleStackIcon,
  ReferencesModeIcon,
  SlidersHorizontalIcon,
  SmileIcon,
  SparklesIcon,
  TextModeIcon,
  TvIcon,
  XMarkIcon,
  ZapIcon,
} from './icons';

const aspectRatioDisplayNames: Record<AspectRatio, string> = {
  [AspectRatio.LANDSCAPE]: 'Landscape (16:9)',
  [AspectRatio.PORTRAIT]: 'Portrait (9:16)',
};

const modeIcons: Record<GenerationMode, React.ReactNode> = {
  [GenerationMode.TEXT_TO_VIDEO]: <TextModeIcon className="w-5 h-5" />,
  [GenerationMode.IMAGE_TO_VIDEO]: <CloudIcon className="w-5 h-5" />,
  [GenerationMode.FRAMES_TO_VIDEO]: <FramesModeIcon className="w-5 h-5" />,
  [GenerationMode.REFERENCES_TO_VIDEO]: (
    <ReferencesModeIcon className="w-5 h-5" />
  ),
  [GenerationMode.EXTEND_VIDEO]: <FilmIcon className="w-5 h-5" />,
};

const fileToBase64 = <T extends {file: File; base64: string}>(
  file: File,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (base64) {
        resolve({file, base64} as T);
      } else {
        reject(new Error('Failed to read file as base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
const fileToImageFile = (file: File): Promise<ImageFile> =>
  fileToBase64<ImageFile>(file);
const fileToVideoFile = (file: File): Promise<VideoFile> =>
  fileToBase64<VideoFile>(file);

const CustomSelect: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({label, value, onChange, icon, children, disabled = false}) => (
  <div>
    <label
      className={`text-xs block mb-1.5 font-medium ${
        disabled ? 'text-[var(--muted)] opacity-50' : 'text-[var(--muted)]'
      }`}>
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--muted)]">
        {icon}
      </div>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--fg)] rounded-lg pl-10 pr-8 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
        {children}
      </select>
      <ChevronDownIcon
        className={`w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
          disabled ? 'text-[var(--muted)] opacity-50' : 'text-[var(--muted)]'
        }`}
      />
    </div>
  </div>
);

const ImageUpload: React.FC<{
  onSelect: (image: ImageFile) => void;
  onRemove?: () => void;
  image?: ImageFile | null;
  label: React.ReactNode;
  className?: string;
}> = ({onSelect, onRemove, image, label, className = "w-24 h-16 sm:w-28 sm:h-20"}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToImageFile(file);
        onSelect(imageFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (image) {
    return (
      <div className={`relative group ${className}`}>
        <img
          src={URL.createObjectURL(image.file)}
          alt="preview"
          className="w-full h-full object-cover rounded-lg shadow-inner"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove image">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={`${className} bg-[var(--card-bg)] hover:bg-[var(--card-bg)]/80 border-2 border-dashed border-[var(--card-border)] rounded-lg flex flex-col items-center justify-center text-[var(--muted)] hover:text-[var(--fg)] transition-colors`}>
      <PlusIcon className="w-6 h-6" />
      <span className="text-xs mt-1 text-center px-1">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </button>
  );
};

const VideoUpload: React.FC<{
  onSelect: (video: VideoFile) => void;
  onRemove?: () => void;
  video?: VideoFile | null;
  label: React.ReactNode;
}> = ({onSelect, onRemove, video, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const videoFile = await fileToVideoFile(file);
        onSelect(videoFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
  };

  if (video) {
    return (
      <div className="relative w-40 h-24 sm:w-48 sm:h-28 group">
        <video
          src={URL.createObjectURL(video.file)}
          muted
          loop
          className="w-full h-full object-cover rounded-lg shadow-inner"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove video">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-40 h-24 sm:w-48 sm:h-28 bg-[var(--card-bg)] hover:bg-[var(--card-bg)]/80 border-2 border-dashed border-[var(--card-border)] rounded-lg flex flex-col items-center justify-center text-[var(--muted)] hover:text-[var(--fg)] transition-colors text-center">
      <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      <span className="text-[10px] sm:text-xs mt-1 px-2">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
    </button>
  );
};

interface PromptFormProps {
  onSubmit: (params: GenerateVideoParams) => void;
  isGenerating?: boolean;
  initialValues?: GenerateVideoParams | null;
  isExtendMode?: boolean;
  isReferenceMode?: boolean;
  referenceImages?: ImageFile[];
}

const styleOptions: {value: StylePreset; label: string; icon: React.ReactNode}[] = [
  {value: StylePreset.NONE, label: 'Raw', icon: <ZapIcon className="w-4 h-4" />},
  {value: StylePreset.CINEMATIC, label: 'Cinematic', icon: <FilmIcon className="w-4 h-4" />},
  {value: StylePreset.CYBERPUNK, label: 'Cyberpunk', icon: <ZapIcon className="w-4 h-4 text-pink-400" />},
  {value: StylePreset.VINTAGE, label: 'Vintage', icon: <HistoryIcon className="w-4 h-4 text-amber-600" />},
  {value: StylePreset.ANIME, label: 'Anime', icon: <CloudIcon className="w-4 h-4 text-sky-400" />},
  {value: StylePreset.NOIR, label: 'Noir', icon: <MoonIcon className="w-4 h-4 text-[var(--muted)]" />},
  {value: StylePreset.PIXAR, label: '3D Anim', icon: <SmileIcon className="w-4 h-4 text-yellow-400" />},
  {value: StylePreset.SURREAL, label: 'Surreal', icon: <GhostIcon className="w-4 h-4 text-purple-400" />},
];

const PromptForm: React.FC<PromptFormProps> = ({
  onSubmit,
  isGenerating = false,
  initialValues = null,
  isExtendMode = false,
  isReferenceMode = false,
  referenceImages = [],
}) => {
  const [prompt, setPrompt] = useState(initialValues?.prompt ?? '');
  const [model, setModel] = useState<VeoModel>(
    initialValues?.model ?? VeoModel.VEO_FAST,
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    initialValues?.aspectRatio ?? AspectRatio.LANDSCAPE,
  );
  const [resolution, setResolution] = useState<Resolution>(
    initialValues?.resolution ?? Resolution.P720,
  );
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    initialValues?.mode ?? 
    (isExtendMode ? GenerationMode.EXTEND_VIDEO : 
     isReferenceMode ? GenerationMode.REFERENCES_TO_VIDEO : 
     GenerationMode.TEXT_TO_VIDEO)
  );
  const [startFrame, setStartFrame] = useState<ImageFile | null>(
    initialValues?.startFrame ?? null,
  );
  const [endFrame, setEndFrame] = useState<ImageFile | null>(
    initialValues?.endFrame ?? null,
  );
  const [referenceImagesState, setReferenceImagesState] = useState<ImageFile[]>(
    initialValues?.referenceImages ?? referenceImages ?? [],
  );
  const [styleImage, setStyleImage] = useState<ImageFile | null>(
    initialValues?.styleImage ?? null,
  );
  const [inputVideo, setInputVideo] = useState<VideoFile | null>(
    initialValues?.inputVideo ?? null,
  );
  const [inputVideoObject, setInputVideoObject] = useState<Video | null>(
    initialValues?.inputVideoObject ?? null,
  );
  const [isLooping, setIsLooping] = useState(initialValues?.isLooping ?? false);
  const [transition, setTransition] = useState<TransitionType>(
    initialValues?.transition ?? TransitionType.CUT,
  );
  const [cameraMovement, setCameraMovement] = useState<CameraMovement>(
    initialValues?.cameraMovement ?? CameraMovement.NONE,
  );
  const [stylePreset, setStylePreset] = useState<StylePreset>(
    initialValues?.stylePreset ?? StylePreset.NONE,
  );
  const [negativePrompt, setNegativePrompt] = useState(initialValues?.negativePrompt ?? '');
  const [motionIntensity, setMotionIntensity] = useState<MotionIntensity>(
    initialValues?.motionIntensity ?? MotionIntensity.MEDIUM,
  );
  const [fps, setFps] = useState<FrameRate>(initialValues?.fps ?? FrameRate.FPS_30);
  const [seed, setSeed] = useState<number | undefined>(initialValues?.seed);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'visual' | 'technical'>('visual');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialValues) {
      setPrompt(initialValues.prompt ?? '');
      setModel(initialValues.model ?? VeoModel.VEO_FAST);
      setAspectRatio(initialValues.aspectRatio ?? AspectRatio.LANDSCAPE);
      setResolution(initialValues.resolution ?? Resolution.P720);
      setGenerationMode(initialValues.mode ?? GenerationMode.TEXT_TO_VIDEO);
      setStartFrame(initialValues.startFrame ?? null);
      setEndFrame(initialValues.endFrame ?? null);
      setReferenceImagesState(initialValues.referenceImages ?? []);
      setStyleImage(initialValues.styleImage ?? null);
      setInputVideo(initialValues.inputVideo ?? null);
      setInputVideoObject(initialValues.inputVideoObject ?? null);
      setIsLooping(initialValues.isLooping ?? false);
      setTransition(initialValues.transition ?? TransitionType.CUT);
      setCameraMovement(initialValues.cameraMovement ?? CameraMovement.NONE);
      setStylePreset(initialValues.stylePreset ?? StylePreset.NONE);
      setNegativePrompt(initialValues.negativePrompt ?? '');
      setMotionIntensity(initialValues.motionIntensity ?? MotionIntensity.MEDIUM);
      setFps(initialValues.fps ?? FrameRate.FPS_30);
      setSeed(initialValues.seed);
    }
  }, [initialValues]);

  useEffect(() => {
    // Rule: Extension strictly only works in 720p
    if (generationMode === GenerationMode.EXTEND_VIDEO) {
      setResolution(Resolution.P720);
    }
    // Restrictions for R2V removed as requested.
  }, [generationMode]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modeSelectorRef.current &&
        !modeSelectorRef.current.contains(event.target as Node)
      ) {
        setIsModeSelectorOpen(false);
      }
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancingPrompt) return;
    
    setIsEnhancingPrompt(true);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (error) {
      console.error('Error enhancing prompt:', error);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        prompt,
        model,
        aspectRatio,
        resolution,
        mode: generationMode,
        startFrame,
        endFrame,
        referenceImages: referenceImagesState,
        styleImage,
        inputVideo,
        inputVideoObject,
        isLooping,
        transition,
        cameraMovement,
        stylePreset,
        negativePrompt,
        motionIntensity,
        fps,
        seed,
      });
    },
    [
      prompt,
      model,
      aspectRatio,
      resolution,
      generationMode,
      startFrame,
      endFrame,
      referenceImagesState,
      styleImage,
      inputVideo,
      inputVideoObject,
      onSubmit,
      isLooping,
      transition,
      cameraMovement,
      stylePreset,
      negativePrompt,
      motionIntensity,
      fps,
      seed,
    ],
  );

  const handleSelectMode = (mode: GenerationMode) => {
    setGenerationMode(mode);
    setIsModeSelectorOpen(false);
    // Clearing current assets to match the selected mode's requirements
    setStartFrame(null);
    setEndFrame(null);
    setReferenceImagesState([]);
    setStyleImage(null);
    setInputVideo(null);
    setInputVideoObject(null);
    setIsLooping(false);
  };

  const promptPlaceholder = {
    [GenerationMode.TEXT_TO_VIDEO]: 'Describe the video you want to create...',
    [GenerationMode.IMAGE_TO_VIDEO]: 'Describe the motion for this image...',
    [GenerationMode.FRAMES_TO_VIDEO]:
      'Describe motion between start and end frames (optional)...',
    [GenerationMode.REFERENCES_TO_VIDEO]:
      'Describe a video using reference images...',
    [GenerationMode.EXTEND_VIDEO]: 'Describe what happens next (optional)...',
  }[generationMode];

  const selectableModes = [
    GenerationMode.TEXT_TO_VIDEO,
    GenerationMode.IMAGE_TO_VIDEO,
    GenerationMode.FRAMES_TO_VIDEO,
    GenerationMode.REFERENCES_TO_VIDEO,
  ];

  const totalReferences = referenceImagesState.length + (styleImage ? 1 : 0);

  const renderMediaUploads = () => {
    if (generationMode === GenerationMode.IMAGE_TO_VIDEO) {
      return (
        <div className="mb-3 p-3 sm:p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-3 sm:gap-4">
          <ImageUpload
            label="Source Image"
            image={startFrame}
            onSelect={setStartFrame}
            onRemove={() => setStartFrame(null)}
          />
          <p className="text-[9px] sm:text-[10px] text-gray-500 italic">
            Image-to-video requires a source image.
          </p>
        </div>
      );
    }
    if (generationMode === GenerationMode.FRAMES_TO_VIDEO) {
      return (
        <div className="mb-3 p-3 sm:p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-3 sm:gap-4">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <ImageUpload
              label="Start Frame"
              image={startFrame}
              onSelect={setStartFrame}
              onRemove={() => {
                setStartFrame(null);
                setIsLooping(false);
              }}
            />
            {!isLooping && (
              <ImageUpload
                label="End Frame"
                image={endFrame}
                onSelect={setEndFrame}
                onRemove={() => setEndFrame(null)}
              />
            )}
          </div>
          <p className="text-[9px] sm:text-[10px] text-[var(--muted)] italic">
            Images-to-video requires at least a start frame.
          </p>
          {startFrame && !endFrame && (
            <div className="mt-1 flex items-center">
              <input
                id="loop-video-checkbox"
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 bg-[var(--card-bg)] border-[var(--card-border)] rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="loop-video-checkbox"
                className="ml-2 text-xs sm:text-sm font-medium text-[var(--fg)] cursor-pointer">
                Create a looping video
              </label>
            </div>
          )}
        </div>
      );
    }
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      return (
        <div className="mb-3 p-3 sm:p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col items-center gap-4 sm:gap-5">
          <div className="w-full">
            <label className="text-[10px] sm:text-xs font-semibold text-[var(--muted)] uppercase tracking-widest block mb-2 sm:mb-3 text-center">
              Content References ({referenceImagesState.length}/3)
            </label>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {referenceImagesState.map((img, index) => (
                <ImageUpload
                  key={index}
                  image={img}
                  label=""
                  onSelect={() => {}}
                  onRemove={() =>
                    setReferenceImagesState((imgs) => imgs.filter((_, i) => i !== index))
                  }
                />
              ))}
              {totalReferences < 3 && (
                <ImageUpload
                  label="Add Asset"
                  onSelect={(img) => setReferenceImagesState((imgs) => [...imgs, img])}
                />
              )}
            </div>
          </div>
        </div>
      );
    }
    if (generationMode === GenerationMode.EXTEND_VIDEO) {
      return (
        <div className="mb-3 p-3 sm:p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex items-center justify-center gap-3 sm:gap-4">
          <VideoUpload
            label={
              <>
                Input Video
                <br />
                (Previous generation)
              </>
            }
            video={inputVideo}
            onSelect={setInputVideo}
            onRemove={() => {
              setInputVideo(null);
              setInputVideoObject(null);
            }}
          />
        </div>
      );
    }
    return null;
  };

  const isExtendModeActive = generationMode === GenerationMode.EXTEND_VIDEO;
  const isReferenceModeActive = generationMode === GenerationMode.REFERENCES_TO_VIDEO;

  let isSubmitDisabled = isGenerating;
  let tooltipText = isGenerating ? 'Generation in progress...' : '';

  if (!isGenerating) {
    switch (generationMode) {
    case GenerationMode.TEXT_TO_VIDEO:
      // Rule: Prompt required
      isSubmitDisabled = !prompt.trim();
      if (isSubmitDisabled) {
        tooltipText = 'Please enter a prompt.';
      }
      break;
    case GenerationMode.IMAGE_TO_VIDEO:
      isSubmitDisabled = !startFrame;
      if (isSubmitDisabled) {
        tooltipText = 'A source image is required.';
      }
      break;
    case GenerationMode.FRAMES_TO_VIDEO:
      // Rule: Start frame required (end frame alone not supported)
      isSubmitDisabled = !startFrame;
      if (isSubmitDisabled) {
        tooltipText = 'A start frame is required.';
      }
      break;
    case GenerationMode.REFERENCES_TO_VIDEO:
      // Rule: Prompt + At least one asset required
      const hasNoPrompt = !prompt.trim();
      const hasNoAssets = referenceImagesState.length === 0;
      isSubmitDisabled = hasNoPrompt || hasNoAssets;
      if (hasNoPrompt && hasNoAssets) {
        tooltipText = 'Please enter a prompt and add at least one asset.';
      } else if (hasNoPrompt) {
        tooltipText = 'Please enter a prompt.';
      } else if (hasNoAssets) {
        tooltipText = 'At least one reference asset is required.';
      }
      break;
    case GenerationMode.EXTEND_VIDEO:
      isSubmitDisabled = !inputVideoObject;
      if (isSubmitDisabled) {
        tooltipText =
          'An input video from a previous generation is required to extend.';
      }
      break;
    }
  }

  return (
    <div className="relative w-full">
        {/* Advanced Parameters Section */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-all group/adv"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${isSettingsOpen ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-[var(--muted)] group-hover/adv:text-indigo-400'}`}>
                <SlidersHorizontalIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--fg)]">
                  Advanced Parameters
                </h3>
                <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest mt-0.5">
                  Motion, FPS, Seed, and more
                </p>
              </div>
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-[var(--muted)] transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSettingsOpen && (
            <div className="border-t border-[var(--card-border)] animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Settings Header with Tabs */}
              <div className="flex items-center justify-between border-b border-[var(--card-border)] bg-black/20">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => setSettingsTab('visual')}
                    className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-r border-[var(--card-border)] ${
                      settingsTab === 'visual' ? 'bg-indigo-500/10 text-indigo-400' : 'text-[var(--muted)] hover:text-[var(--fg)]'
                    }`}>
                    Visual Controls
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab('technical')}
                    className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-r border-[var(--card-border)] ${
                      settingsTab === 'technical' ? 'bg-indigo-500/10 text-indigo-400' : 'text-[var(--muted)] hover:text-[var(--fg)]'
                    }`}>
                    Technical Specs
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAspectRatio(AspectRatio.LANDSCAPE);
                    setResolution(Resolution.P720);
                    setCameraMovement(CameraMovement.NONE);
                    setStylePreset(StylePreset.NONE);
                    setMotionIntensity(MotionIntensity.MEDIUM);
                    setFps(FrameRate.FPS_30);
                    setSeed(undefined);
                    setNegativePrompt('');
                  }}
                  className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors">
                  Reset Defaults
                </button>
              </div>

              <div className="p-6">
                {settingsTab === 'visual' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <CustomSelect
                      label="Aspect Ratio"
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                      icon={<RectangleStackIcon className="w-5 h-5 text-gray-400" />}>
                      {Object.entries(aspectRatioDisplayNames).map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                      ))}
                    </CustomSelect>

                    <CustomSelect
                      label="Style Preset"
                      value={stylePreset}
                      onChange={(e) => setStylePreset(e.target.value as StylePreset)}
                      icon={<PaletteIcon className="w-5 h-5 text-gray-400" />}>
                      <option value={StylePreset.NONE}>None (Raw)</option>
                      <option value={StylePreset.CINEMATIC}>Cinematic</option>
                      <option value={StylePreset.CYBERPUNK}>Cyberpunk</option>
                      <option value={StylePreset.VINTAGE}>Vintage</option>
                      <option value={StylePreset.ANIME}>Anime</option>
                      <option value={StylePreset.NOIR}>Noir</option>
                      <option value={StylePreset.PIXAR}>3D Animation</option>
                      <option value={StylePreset.SURREAL}>Surreal</option>
                    </CustomSelect>

                    <CustomSelect
                      label="Camera Movement"
                      value={cameraMovement}
                      onChange={(e) => setCameraMovement(e.target.value as CameraMovement)}
                      icon={<TvIcon className="w-5 h-5 text-gray-400" />}>
                      {Object.values(CameraMovement).map((move) => (
                        <option key={move} value={move}>
                          {move.charAt(0).toUpperCase() + move.slice(1)}
                        </option>
                      ))}
                    </CustomSelect>

                    <CustomSelect
                      label="Motion Intensity"
                      value={motionIntensity}
                      onChange={(e) => setMotionIntensity(e.target.value as MotionIntensity)}
                      icon={<ActivityIcon className="w-5 h-5 text-gray-400" />}>
                      <option value={MotionIntensity.LOW}>Low</option>
                      <option value={MotionIntensity.MEDIUM}>Medium</option>
                      <option value={MotionIntensity.HIGH}>High</option>
                    </CustomSelect>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <CustomSelect
                      label="Model"
                      value={model}
                      onChange={(e) => setModel(e.target.value as VeoModel)}
                      icon={<SparklesIcon className="w-5 h-5 text-gray-400" />}>
                      {Object.values(VeoModel).map((modelValue) => (
                        <option key={modelValue} value={modelValue}>
                          {modelValue === VeoModel.VEO ? 'High Quality (Veo 3.1)' : 'Fast (Veo 3.1)'}
                        </option>
                      ))}
                    </CustomSelect>

                    <CustomSelect
                      label="Resolution"
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as Resolution)}
                      icon={<TvIcon className="w-5 h-5 text-gray-400" />}
                      disabled={isExtendMode}>
                      <option value={Resolution.P720}>720p</option>
                      <option value={Resolution.P1080}>1080p</option>
                      <option value={Resolution.P4K}>4K</option>
                    </CustomSelect>

                    <CustomSelect
                      label="Frame Rate (FPS)"
                      value={fps}
                      onChange={(e) => setFps(e.target.value as FrameRate)}
                      icon={<TimerIcon className="w-5 h-5 text-gray-400" />}>
                      <option value={FrameRate.FPS_24}>24 FPS</option>
                      <option value={FrameRate.FPS_30}>30 FPS</option>
                      <option value={FrameRate.FPS_60}>60 FPS</option>
                    </CustomSelect>

                    <div className="flex flex-col">
                      <label className="text-[10px] block mb-1.5 font-bold uppercase tracking-widest text-gray-500">
                        Seed
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <HashIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <input
                          type="number"
                          value={seed ?? ''}
                          onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Random"
                          className="w-full bg-[#151515] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:col-span-2">
                      <label className="text-[10px] block mb-1.5 font-bold uppercase tracking-widest text-gray-500">
                        Negative Prompt
                      </label>
                      <div className="relative">
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <BanIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <textarea
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          placeholder="Avoid: blurry, low quality, distorted faces..."
                          className="w-full bg-[#151515] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm min-h-[80px] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* Mode Selection Tabs */}
        <div className="flex border border-[var(--card-border)] rounded-2xl overflow-hidden bg-[var(--card-bg)]">
          {selectableModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleSelectMode(mode)}
              className={`flex-1 flex flex-col items-center gap-2 py-4 transition-all border-r last:border-r-0 border-[var(--card-border)] ${
                generationMode === mode 
                  ? 'bg-indigo-600/20 text-indigo-400' 
                  : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--card-bg)]'
              }`}>
              {modeIcons[mode]}
              <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline">
                {mode.replace(/-/g, ' ')}
              </span>
            </button>
          ))}
        </div>

        {/* Media Upload Area */}
        {renderMediaUploads()}

        {/* Style Selection Bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-x-auto no-scrollbar">
          <span className="text-[9px] uppercase tracking-widest text-[var(--muted)] font-bold mr-2 whitespace-nowrap">
            Style:
          </span>
          {styleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStylePreset(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
                stylePreset === option.value
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                  : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--fg)] hover:border-[var(--card-border)]'
              }`}>
              {option.icon}
              <span className="text-[10px] font-bold uppercase tracking-widest">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Main Input Command Center */}
        <div className="relative group">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-0 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl sm:rounded-3xl p-2 sm:p-2 shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all backdrop-blur-md overflow-hidden">
            <div className="relative flex-grow w-full">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={promptPlaceholder}
                className="w-full bg-transparent focus:outline-none resize-none text-sm sm:text-base text-[var(--fg)] placeholder-[var(--muted)] max-h-48 py-4 px-4 pr-12"
                rows={1}
              />
              {prompt.trim() && (
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancingPrompt}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 disabled:opacity-50 transition-all group/enhance"
                  title="Enhance prompt with AI">
                  <SparklesIcon className={`w-4 h-4 ${isEnhancingPrompt ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                    {isEnhancingPrompt ? 'Enhancing...' : 'Magic Enhance'}
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 p-2 sm:p-2 w-full sm:w-auto border-t border-[var(--card-border)] sm:border-none">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[var(--card-bg)] disabled:text-[var(--muted)] disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs rounded-xl sm:rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                <span>Generate</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {isSubmitDisabled && tooltipText && (
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <span className="text-[9px] text-red-400/80 uppercase tracking-widest font-bold">
                {tooltipText}
              </span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default PromptForm;
