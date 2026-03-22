
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useState} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Palette, CheckCircle2, X, Zap, Shield, Globe, Star, Video as VideoIcon, Sparkles as SparklesIcon, Loader2 } from 'lucide-react';
import ApiKeyDialog from './components/ApiKeyDialog';
import History from './components/History';
import {ClockIcon, CurvedArrowDownIcon} from './components/icons';
import LoadingScreen from './components/LoadingScreen';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import ErrorBoundary from './components/ErrorBoundary';
import Logo from './components/Logo';
import SubscriptionModal from './components/SubscriptionModal';
import {generateVideo} from './services/geminiService';
import { PRICING_PACKAGES, LOGIN_HIGHLIGHTS } from './constants';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  getUserUsage,
  incrementUsage,
  signInAnonymously,
} from './firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  limit,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import {
  AppState,
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  HistoryItem,
  Resolution,
  VideoFile,
  ImageFile,
} from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(
    null,
  );
  const [lastVideoObject, setLastVideoObject] = useState<Video | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [usage, setUsage] = useState<any>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [generationSubMessage, setGenerationSubMessage] = useState('');
  const [isExtendMode, setIsExtendMode] = useState(false);
  const [isReferenceMode, setIsReferenceMode] = useState(false);
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>([]);
  const [canExtendState, setCanExtendState] = useState(false);

  const [initialFormValues, setInitialFormValues] =
    useState<GenerateVideoParams | null>(null);

  const handleUpgrade = async (planId: any) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      const usageRef = doc(db, 'usage', user.uid);
      await updateDoc(usageRef, {
        tier: planId,
        subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
      });
      setShowPricing(false);
      // The onSnapshot listener for usage will update the UI
    } catch (error) {
      console.error('Error upgrading plan:', error);
      handleFirestoreError(error, OperationType.UPDATE, `usage/${user.uid}`);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as any;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  useEffect(() => {
    if (!user) {
      setUsage(null);
      return;
    }

    const usageRef = doc(db, 'usage', user.uid);
    const unsubscribeUsage = onSnapshot(usageRef, (doc) => {
      if (doc.exists()) {
        setUsage(doc.data());
      } else {
        // Initialize usage for new user
        const initialUsage = {
          userId: user.uid,
          lastGenerated: 0,
          countToday: 0,
          tier: 'free'
        };
        setDoc(usageRef, initialUsage);
        setUsage(initialUsage);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `usage/${user.uid}`);
    });

    return () => unsubscribeUsage();
  }, [user]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          if (!(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyDialog(true);
          }
        } catch (error) {
          console.warn(
            'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
            error,
          );
          setShowApiKeyDialog(true);
        }
      }
    };
    checkApiKey();

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'history'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribeHistory = onSnapshot(q, (snapshot) => {
      const items: HistoryItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as HistoryItem);
      });
      setHistory(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'history');
    });

    return () => unsubscribeHistory();
  }, [user]);

  const handleLogin = async () => {
    setErrorMessage(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not authorized for Firebase Authentication. Please add the current domain to the "Authorized domains" list in the Firebase Console.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMessage('Login popup was blocked by your browser. Please allow popups for this site or try Guest Login.');
      } else {
        setErrorMessage('Google login failed. Trying guest login...');
        // Fallback to anonymous login if Google fails
        handleAnonymousLogin();
      }
      setAppState(AppState.ERROR);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      setShowLoginModal(false);
      setErrorMessage(null);
      setAppState(AppState.IDLE);
    } catch (error) {
      console.error('Anonymous login failed:', error);
      setErrorMessage('Guest login failed. Please ensure Anonymous Auth is enabled in your Firebase Console.');
      setAppState(AppState.ERROR);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const addToHistory = async (params: GenerateVideoParams, videoUrl?: string, videoUri?: string) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'history'), {
        userId: user.uid,
        params,
        timestamp: Date.now(),
        videoUrl,
        videoUri,
        id: Math.random().toString(36).substr(2, 9), // Local ID for consistency
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'history');
    }
  };

  const deleteFromHistory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'history', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `history/${id}`);
    }
  };

  const clearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your entire production log?')) {
      // For simplicity, we'll just delete the items we have in state
      // In a real app, you'd use a batch delete or a cloud function
      for (const item of history) {
        await deleteFromHistory(item.id);
      }
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setInitialFormValues(item.params);
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorMessage(null);
    setIsHistoryOpen(false);
  };

  const showStatusError = (message: string) => {
    setErrorMessage(message);
    setAppState(AppState.ERROR);
  };

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Check usage limits
    if (usage) {
      const now = Date.now();
      const lastGen = new Date(usage.lastGenerated);
      const today = new Date(now);
      
      let countToday = usage.countToday;
      if (lastGen.toDateString() !== today.toDateString()) {
        countToday = 0;
      }

      const limits: Record<string, number> = {
        'free': 1,
        'basic': 10,
        'pro': 50,
        'enterprise': Infinity
      };

      if (countToday >= limits[usage.tier]) {
        setErrorMessage(`Daily limit reached for ${usage.tier} tier (${limits[usage.tier]} videos). Upgrade for more!`);
        setAppState(AppState.ERROR);
        setShowPricing(true);
        return;
      }
    }

    if (window.aistudio) {
      try {
        if (!(await window.aistudio.hasSelectedApiKey())) {
          setShowApiKeyDialog(true);
          return;
        }
      } catch (error) {
        console.warn(
          'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
          error,
        );
        setShowApiKeyDialog(true);
        return;
      }
    }

    setAppState(AppState.LOADING);
    setErrorMessage(null);
    setLastConfig(params);
    setInitialFormValues(null);
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationMessage('Initializing Production');

    try {
      const {objectUrl, blob, video, uri} = await generateVideo(params, (progress, message, subMessage) => {
        setGenerationProgress(progress);
        setGenerationMessage(message);
        if (subMessage) setGenerationSubMessage(subMessage);
      });
      setVideoUrl(objectUrl);
      setLastVideoBlob(blob);
      setLastVideoObject(video);
      setAppState(AppState.SUCCESS);
      setIsGenerating(false);
      
      // Add to history
      addToHistory(params, objectUrl, uri);
      
      // Increment usage
      if (user) {
        await incrementUsage(user.uid);
        const newUsage = await getUserUsage(user.uid);
        setUsage(newUsage);
      }
    } catch (error) {
      setIsGenerating(false);
      console.error('Video generation failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';

      let userFriendlyMessage = `Video generation failed: ${errorMessage}`;
      let shouldOpenDialog = false;

      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('Requested entity was not found.')) {
          userFriendlyMessage =
            'Model not found. This can be caused by an invalid API key or permission issues. Please check your API key.';
          shouldOpenDialog = true;
        } else if (
          errorMessage.includes('API_KEY_INVALID') ||
          errorMessage.includes('API key not valid') ||
          errorMessage.toLowerCase().includes('permission denied') ||
          errorMessage.includes('403')
        ) {
          userFriendlyMessage =
            'Your API key is invalid or lacks permissions. Please select a valid, billing-enabled API key.';
          shouldOpenDialog = true;
        }
      }

      setErrorMessage(userFriendlyMessage);
      setAppState(AppState.ERROR);

      if (shouldOpenDialog) {
        setShowApiKeyDialog(true);
      }
    }
  }, [user]);

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      handleGenerate(lastConfig);
    }
  }, [lastConfig, handleGenerate]);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
    if (appState === AppState.ERROR && lastConfig) {
      handleRetry();
    }
  };

  const handleNewVideo = useCallback(() => {
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null);
  }, []);

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      setInitialFormValues(lastConfig);
      setAppState(AppState.IDLE);
      setErrorMessage(null);
    } else {
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo]);

  const handleExtend = useCallback(async () => {
    if (lastConfig && lastVideoBlob && lastVideoObject) {
      try {
        const file = new File([lastVideoBlob], 'last_video.mp4', {
          type: lastVideoBlob.type,
        });
        const videoFile: VideoFile = {file, base64: ''};

        setInitialFormValues({
          ...lastConfig,
          mode: GenerationMode.EXTEND_VIDEO,
          prompt: '', 
          inputVideo: videoFile, 
          inputVideoObject: lastVideoObject, 
          resolution: Resolution.P720, 
          startFrame: null,
          endFrame: null,
          referenceImages: [],
          styleImage: null,
          isLooping: false,
        });

        setAppState(AppState.IDLE);
        setVideoUrl(null);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to process video for extension:', error);
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        showStatusError(`Failed to prepare video for extension: ${message}`);
      }
    }
  }, [lastConfig, lastVideoBlob, lastVideoObject]);

  const renderError = (message: string) => (
    <div className="text-center bg-red-900/20 border border-red-500 p-8 rounded-lg">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
      <p className="text-red-300">{message}</p>
      <button
        onClick={handleTryAgainFromError}
        className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
        Try Again
      </button>
    </div>
  );

  const canExtend = lastConfig?.resolution === Resolution.P720;

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500">Initializing Factory</span>
        </div>
      </div>
    );
  }

  const renderLoginModal = () => (
    <AnimatePresence>
      {(showLoginModal || showPricing) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowLoginModal(false); setShowPricing(false); }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-[var(--bg)] border border-[var(--card-border)] rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] overflow-y-auto md:overflow-hidden"
          >
            <button 
              onClick={() => { setShowLoginModal(false); setShowPricing(false); }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-gray-500 hover:text-white z-10"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Left Side: Highlights */}
            <div className="w-full md:w-1/2 p-6 sm:p-12 bg-indigo-600/5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[var(--card-border)]">
              <div className="mb-6 sm:mb-8 scale-75 sm:scale-100 origin-left">
                <Logo />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 tracking-tight text-[var(--fg)]">Experience the future of production</h3>
              <div className="space-y-4 sm:space-y-6">
                {LOGIN_HIGHLIGHTS.map((h: any, i: number) => (
                  <div key={i} className="flex gap-3 sm:gap-4">
                    <div className="mt-1 p-1 bg-indigo-500/20 rounded-lg shrink-0">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[10px] sm:text-sm uppercase tracking-wider text-[var(--fg)] opacity-80">{h.title}</h4>
                      <p className="text-[11px] sm:text-sm text-[var(--muted)] leading-relaxed">{h.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Action/Pricing */}
            <div className="w-full md:w-1/2 p-6 sm:p-12 flex flex-col justify-center bg-[var(--card-bg)]/30">
              {showPricing ? (
                <div className="space-y-6 sm:space-y-8">
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-[var(--fg)]">Upgrade Your Factory</h3>
                    <p className="text-xs sm:text-sm text-[var(--muted)]">Choose a package that fits your production needs</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {PRICING_PACKAGES.map((pkg: any) => (
                      <div 
                        key={pkg.id}
                        className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] ${
                          pkg.popular 
                            ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                            : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-[var(--card-bg)]/80'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                          <div>
                            <h4 className="font-bold text-base sm:text-lg text-[var(--fg)]">{pkg.name}</h4>
                            <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest">{pkg.limit}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl sm:text-2xl font-black text-[var(--fg)]">{pkg.price}</span>
                            {pkg.period && <span className="text-[10px] sm:text-xs text-[var(--muted)]">{pkg.period}</span>}
                          </div>
                        </div>
                        <ul className="space-y-1.5 sm:space-y-2">
                          {pkg.features.slice(0, 3).map((f: string, i: number) => (
                            <li key={i} className="text-[10px] sm:text-[11px] text-[var(--muted)] flex items-center gap-2">
                              <div className="w-1 h-1 bg-indigo-500 rounded-full shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setShowPricing(false)}
                    className="w-full py-3 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-6 sm:space-y-8">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600/20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto mb-4 sm:mb-6 rotate-12">
                      <VideoIcon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tighter text-[var(--fg)]">Ready to Produce?</h3>
                    <p className="text-[var(--muted)] text-xs sm:text-sm max-w-xs mx-auto">
                      Join thousands of creators manufacturing cinematic content with Video Factory.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => { handleLogin(); setShowLoginModal(false); }}
                    className="w-full py-4 sm:py-5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl hover:bg-indigo-500 transition-all font-bold uppercase tracking-widest text-xs sm:text-sm shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-2 sm:gap-3"
                  >
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                    Connect with Google
                  </button>

                  <button
                    onClick={handleAnonymousLogin}
                    className="w-full py-4 sm:py-5 bg-white/5 text-gray-400 rounded-xl sm:rounded-2xl hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-xs sm:text-sm border border-white/10 flex items-center justify-center gap-2 sm:gap-3"
                  >
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                    Continue as Guest
                  </button>

                  <div className="pt-4 border-t border-[var(--card-border)]">
                    <p className="text-[9px] sm:text-[10px] text-[var(--muted)] uppercase tracking-widest mb-3 sm:mb-4">Or explore our plans</p>
                    <button 
                      onClick={() => setShowPricing(true)}
                      className="text-[10px] sm:text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                      View Pricing Packages
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col font-sans overflow-hidden relative transition-colors duration-300">
        {renderLoginModal()}
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[var(--google-blue)]/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[var(--google-red)]/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
          <div className="absolute top-1/4 right-1/4 w-[30%] h-[30%] bg-[var(--google-yellow)]/5 blur-[100px] rounded-full animate-pulse [animation-delay:4s]" />
          <div className="absolute bottom-1/4 left-1/4 w-[30%] h-[30%] bg-[var(--google-green)]/5 blur-[100px] rounded-full animate-pulse [animation-delay:6s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
          {/* Technical Grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ 
                 backgroundImage: `linear-gradient(to right, var(--grid-color) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)`,
                 backgroundSize: '40px 40px' 
               }} 
          />
        </div>

        {showApiKeyDialog && (
          <ApiKeyDialog 
            onContinue={handleApiKeyDialogContinue} 
            onClose={() => setShowApiKeyDialog(false)}
          />
        )}
        
        {/* History Sidebar Modal */}
        {isHistoryOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity"
              onClick={() => setIsHistoryOpen(false)}
            />
            <div 
              className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[var(--sidebar-bg)] backdrop-blur-3xl border-l border-[var(--card-border)] z-50 shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-right">
              <History 
                items={history} 
                onSelect={handleSelectHistoryItem}
                onDelete={deleteFromHistory}
                onClear={clearHistory}
                onClose={() => setIsHistoryOpen(false)}
              />
            </div>
          </>
        )}
        
        <header className="py-4 sm:py-8 flex items-center justify-between px-4 sm:px-8 relative z-10 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <button
                onClick={handleLogout}
                className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors border border-white/5 px-3 py-1.5 rounded-lg hover:bg-white/5">
                Logout
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--fg)] transition-all flex items-center gap-2"
              title="Toggle Theme">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span className="text-[10px] uppercase tracking-widest font-bold hidden md:inline">{theme}</span>
            </button>
            <button
              onClick={() => setShowPricing(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--fg)] transition-all flex items-center gap-2"
              title="Pricing">
              <Star className="w-4 h-4 text-[var(--google-yellow)]" />
              <span className="text-[10px] uppercase tracking-widest font-bold hidden md:inline">Pricing</span>
            </button>
          </div>
          
          <div className="scale-[0.65] sm:scale-100 origin-center">
            <Logo />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {usage && (
                  <div className="hidden sm:flex flex-col items-end px-4 border-r border-white/10">
                    <span className="text-[8px] uppercase tracking-[0.3em] text-gray-500 font-bold">{usage.tier} Plan</span>
                    <span className="text-[10px] font-mono text-indigo-400">{usage.countToday} / {usage.tier === 'free' ? '1' : usage.tier === 'pro' ? '50' : usage.tier === 'enterprise' ? '∞' : '10'}</span>
                  </div>
                )}
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                    isHistoryOpen 
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                  title="Production Log">
                  <ClockIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-5 sm:px-8 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-bold uppercase tracking-widest text-[10px] sm:text-xs shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                Login
              </button>
            )}
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center px-4 sm:px-8 pb-24 relative z-10 max-w-5xl mx-auto w-full">
          {!videoUrl && !isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12 sm:mb-20 mt-8 sm:mt-16 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
                <SparklesIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Next-Gen Video Engine</span>
              </div>
              <h1 className="text-4xl sm:text-7xl font-black tracking-tighter text-[var(--fg)] leading-[0.9] sm:leading-[0.85]">
                What will you <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  manufacture
                </span> today?
              </h1>
              <p className="text-[var(--muted)] text-xs sm:text-sm max-w-md mx-auto uppercase tracking-widest font-medium leading-relaxed">
                Transform text into high-fidelity cinematic experiences with Veo 3.1
              </p>
            </motion.div>
          )}
          
          <div className="w-full">
            {isGenerating ? (
              <div className="w-full max-w-3xl mx-auto">
                <LoadingScreen 
                  progress={generationProgress} 
                  message={generationMessage} 
                  subMessage={generationSubMessage}
                />
              </div>
            ) : (
              <div className="w-full max-w-4xl mx-auto">
                {appState === AppState.IDLE && (
                  <PromptForm
                    onSubmit={handleGenerate}
                    isGenerating={isGenerating}
                    initialValues={lastConfig}
                    isExtendMode={isExtendMode}
                    isReferenceMode={isReferenceMode}
                    referenceImages={referenceImages}
                  />
                )}
                {appState === AppState.SUCCESS && videoUrl && (
                  <VideoResult
                    videoUrl={videoUrl}
                    onRetry={handleRetry}
                    onNewVideo={handleNewVideo}
                    onExtend={handleExtend}
                    canExtend={canExtend}
                    aspectRatio={lastConfig?.aspectRatio || AspectRatio.LANDSCAPE}
                  />
                )}
                {appState === AppState.SUCCESS &&
                  !videoUrl &&
                  renderError(
                    'Video generated, but URL is missing. Please try again.',
                  )}
                {appState === AppState.ERROR &&
                  errorMessage &&
                  renderError(errorMessage)}
              </div>
            )}
          </div>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 h-10 sm:h-12 bg-[var(--bg)]/80 backdrop-blur-md border-t border-[var(--card-border)] z-50 flex items-center justify-between px-4 sm:px-8 text-[8px] sm:text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--muted)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--google-green)] animate-pulse" />
              <span>System Online</span>
            </div>
            <div className="hidden sm:block h-3 w-[1px] bg-[var(--card-border)]" />
            <span className="hidden sm:block">Region: Asia-Southeast1</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-8 sm:w-16 bg-gradient-to-r from-transparent to-[var(--card-border)]" />
            <a 
              href="https://eastindiaautomation.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 whitespace-nowrap hover:opacity-80 transition-opacity group"
            >
              <span className="font-black text-[var(--fg)]">Built with</span>
              <span className="inline-block animate-bounce text-[var(--google-red)] drop-shadow-[0_0_8px_rgba(234,67,53,0.4)]">❤️</span>
              <span className="font-black text-[var(--fg)]">by</span>
              <span className="font-black text-[var(--google-blue)] group-hover:underline">Rajib Singh</span>
            </a>
            <div className="h-[1px] w-8 sm:w-16 bg-gradient-to-l from-transparent to-[var(--card-border)]" />
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">© 2026 Video Factory</span>
            <div className="h-3 w-[1px] bg-[var(--card-border)]" />
            <span className="text-[var(--google-blue)]">v3.1.0-stable</span>
          </div>
        </footer>

        <SubscriptionModal
          isOpen={showPricing}
          onClose={() => setShowPricing(false)}
          currentStatus={usage?.tier || 'free'}
          onUpgrade={handleUpgrade}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
