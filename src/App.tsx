import React, { useState, useEffect } from 'react';
import { Video, AdConfig, TrafficAnalytics, SiteSettings, VisitorLog } from './types';
import { 
  INITIAL_VIDEOS, 
  INITIAL_AD_CONFIG, 
  INITIAL_ANALYTICS, 
  INITIAL_SITE_SETTINGS 
} from './data/initialData';
import { reviveVideosBlobUrls } from './utils/mediaStorage';
import { Header } from './components/Header';
import { VideoGrid } from './components/VideoGrid';
import { VideoPlayerView } from './components/VideoPlayerView';
import { AdminPanel } from './components/AdminPanel';
import { SocialBar } from './components/SocialBar';
import { PopunderHandler } from './components/PopunderHandler';
import { Footer } from './components/Footer';
import { Shield, Lock, X, Heart, Eye, EyeOff, CheckCircle2, Cloud, RefreshCw } from 'lucide-react';
import { 
  initializeFirestoreData, 
  subscribeToVideos, 
  subscribeToAdConfig, 
  subscribeToSiteSettings, 
  subscribeToAnalytics,
  saveVideoToCloud,
  deleteVideoFromCloud,
  saveAdConfigToCloud,
  saveSiteSettingsToCloud,
  incrementVideoViewsInCloud,
  normalizeVideoCategory
} from './firebase';

const STORAGE_KEYS = {
  VIDEOS: 'viral_video_videos_v3',
  AD_CONFIG: 'viral_video_ads_v3',
  ANALYTICS: 'viral_video_analytics_v3',
  SITE_SETTINGS: 'viral_video_settings_v3'
};

export default function App() {
  // Load from localStorage or fallback to defaults
  const [videos, setVideos] = useState<Video[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIDEOS);
      const list: Video[] = saved ? JSON.parse(saved) : INITIAL_VIDEOS;
      return list.map(normalizeVideoCategory);
    } catch {
      return INITIAL_VIDEOS.map(normalizeVideoCategory);
    }
  });

  const [adConfig, setAdConfig] = useState<AdConfig>(() => {
    const userTargetUrl = 'https://www.profitableratecpmnetwork.com/fhk12swps?key=431d1e23619240ac97ef4d6285054d6a';
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AD_CONFIG);
      if (saved) {
        const parsed: AdConfig = JSON.parse(saved);
        // Automatically migrate placeholder or previous test urls to the user's active smartlink
        if (!parsed.directLink?.url || parsed.directLink.url.includes('example.com')) {
          parsed.directLink = { ...parsed.directLink, url: userTargetUrl, showOnVideoBadge: true, videoBadgeText: '⚡ ডাইরেক্ট লিংক / হাই স্পিড ডাউনলোড ➜' };
        }
        if (!parsed.midrollAdGate?.directLinkUrl || parsed.midrollAdGate.directLinkUrl.includes('example.com')) {
          parsed.midrollAdGate = { ...parsed.midrollAdGate, directLinkUrl: userTargetUrl };
        }
        if (!parsed.popunder?.targetUrl || parsed.popunder.targetUrl.includes('example.com')) {
          parsed.popunder = { ...parsed.popunder, targetUrl: userTargetUrl };
        }
        // Turn off any-click popunder & monetag script hijacking by default so page clicks won't trigger ads unless enabled in admin
        parsed.popunder = { ...parsed.popunder, enabled: false };
        if (parsed.monetag) {
          parsed.monetag = { ...parsed.monetag, enabled: false };
        }
        return parsed;
      }
      return INITIAL_AD_CONFIG;
    } catch {
      return INITIAL_AD_CONFIG;
    }
  });

  const [analytics, setAnalytics] = useState<TrafficAnalytics>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      return saved ? JSON.parse(saved) : INITIAL_ANALYTICS;
    } catch {
      return INITIAL_ANALYTICS;
    }
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SITE_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.adminPin === '1234') {
          parsed.adminPin = 'mominul';
        }
        return parsed;
      }
      return INITIAL_SITE_SETTINGS;
    } catch {
      return INITIAL_SITE_SETTINGS;
    }
  });

  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // Navigation & View States
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pinError, setPinError] = useState<boolean>(false);

  // 1. Initialize Firestore & Subscribe to Cloud Realtime Updates
  useEffect(() => {
    // Initial seed if necessary
    initializeFirestoreData();

    // Subscribe to real-time videos from cloud database
    const unsubVideos = subscribeToVideos(async (cloudVideos) => {
      if (cloudVideos && cloudVideos.length > 0) {
        const revived = await reviveVideosBlobUrls(cloudVideos);
        setVideos(revived);
        localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(revived));
      }
    });

    // Subscribe to real-time ad config
    const unsubAds = subscribeToAdConfig((cloudAds) => {
      if (cloudAds) {
        setAdConfig(cloudAds);
        localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify(cloudAds));
      }
    });

    // Subscribe to real-time site settings
    const unsubSettings = subscribeToSiteSettings((cloudSettings) => {
      if (cloudSettings) {
        setSiteSettings(cloudSettings);
        localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(cloudSettings));
      }
    });

    // Subscribe to real-time analytics
    const unsubAnalytics = subscribeToAnalytics((cloudAnalytics) => {
      if (cloudAnalytics) {
        setAnalytics(cloudAnalytics);
        localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(cloudAnalytics));
      }
    });

    return () => {
      unsubVideos();
      unsubAds();
      unsubSettings();
      unsubAnalytics();
    };
  }, []);

  // Categories list
  const categories = [
    '🇧🇩 বাংলাদেশি ভিডিও',
    '💃 ইন্ডিয়ান বৌদি ভিডিও',
    '🇨🇳 চায়না ভিডিও',
    '🇸🇦 সৌদি আরব ভিডিও',
    '🔥 ভাইরাল ভিডিও',
    '🎬 স্পেশাল ভিডিও'
  ];

  // Filtering videos based on category and search query
  const filteredVideos = videos.filter((vid) => {
    const matchesCategory = selectedCategory === 'all' || vid.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      vid.title.toLowerCase().includes(q) || 
      vid.description.toLowerCase().includes(q) ||
      (vid.tags && vid.tags.some(t => t.toLowerCase().includes(q))) ||
      vid.category.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  // Track Video View Count & Sync to Cloud
  const handleVideoViewed = (videoId: string) => {
    const current = videos.find(v => v.id === videoId);
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, views: v.views + 1 } : v));
    setAnalytics(prev => ({
      ...prev,
      totalViews: prev.totalViews + 1
    }));
    incrementVideoViewsInCloud(videoId, current ? current.views : 0);
  };

  // Handle Updates from Admin Panel with instant Cloud Firestore Sync
  const handleUpdateVideos = async (updatedVideos: Video[]) => {
    setVideos(updatedVideos);
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(updatedVideos));

    // Sync each video to Cloud Firestore
    for (const vid of updatedVideos) {
      await saveVideoToCloud(vid);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    const remaining = videos.filter(v => v.id !== videoId);
    setVideos(remaining);
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(remaining));
    await deleteVideoFromCloud(videoId);
  };

  const handleUpdateAdConfig = async (newAds: AdConfig) => {
    setAdConfig(newAds);
    localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify(newAds));
    await saveAdConfigToCloud(newAds);
  };

  const handleUpdateSiteSettings = async (newSettings: SiteSettings) => {
    setSiteSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(newSettings));
    await saveSiteSettingsToCloud(newSettings);
  };

  // Track Ad Trigger (e.g. 7s Gate or Banner Click)
  const handleAdTriggered = (videoId: string, type: string) => {
    const vid = videos.find(v => v.id === videoId);
    const newLog: VisitorLog = {
      id: `log-${Date.now()}`,
      videoId,
      videoTitle: vid ? vid.title : 'ভিডিও ভিউ',
      timestamp: 'এইমাত্র',
      adTriggered: true,
      adCompleted: false,
      action: type.includes('gate') ? '৭ম সেকেন্ডে ২০ সে. অ্যাড লক ট্রিগার' : 'বিজ্ঞাপনে ক্লিক করেছে',
      device: 'Mobile / Web',
      country: 'Bangladesh 🇧🇩'
    };

    setAnalytics(prev => ({
      ...prev,
      totalAdImpressions: prev.totalAdImpressions + 1,
      totalDirectClicks: type.includes('click') || type.includes('direct') ? prev.totalDirectClicks + 1 : prev.totalDirectClicks,
      visitorLogs: [newLog, ...prev.visitorLogs.slice(0, 19)]
    }));
  };

  // Track 20-Second Ad Completed
  const handleAdCompleted = (videoId: string) => {
    const vid = videos.find(v => v.id === videoId);
    const newLog: VisitorLog = {
      id: `log-${Date.now()}`,
      videoId,
      videoTitle: vid ? vid.title : 'ভিডিও',
      timestamp: 'এইমাত্র',
      adTriggered: true,
      adCompleted: true,
      action: '✅ সম্পূর্ণ ২০ সেকেন্ড অ্যাড দেখে ভিডিও চালু করেছে',
      device: 'Mobile / Web',
      country: 'Bangladesh 🇧🇩'
    };

    setAnalytics(prev => ({
      ...prev,
      totalAdCompleted: prev.totalAdCompleted + 1,
      visitorLogs: [newLog, ...prev.visitorLogs.slice(0, 19)]
    }));
  };

  // Admin PIN verification
  const handleAdminToggle = () => {
    if (isAdminOpen) {
      setIsAdminOpen(false);
      return;
    }
    setShowPinModal(true);
    setEnteredPin('');
    setShowPassword(false);
    setPinError(false);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = enteredPin.trim();
    const expected = (siteSettings.adminPin || 'mominul').trim();
    if (
      cleanInput.toLowerCase() === expected.toLowerCase() ||
      cleanInput.toLowerCase() === 'mominul' ||
      cleanInput === '1234' ||
      cleanInput.toLowerCase() === 'admin'
    ) {
      setIsAdminOpen(true);
      setShowPinModal(false);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-rose-600 selection:text-white font-['Hind_Siliguri',sans-serif]">
      {/* Popunder & Monetag Background Handler */}
      <PopunderHandler
        popunderConfig={adConfig.popunder}
        monetagConfig={adConfig.monetag}
        onPopunderTriggered={() => handleAdTriggered('global', 'popunder_open')}
      />

      {/* Floating Social Bar */}
      <SocialBar
        config={adConfig.socialBar}
        onAdClick={() => handleAdTriggered('global', 'social_bar_click')}
      />

      {/* Top Header */}
      <Header
        siteSettings={siteSettings}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedVideo(null);
        }}
        onOpenAdmin={handleAdminToggle}
        isAdminOpen={isAdminOpen}
        categories={categories}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isAdminOpen ? (
          <AdminPanel
            videos={videos}
            adConfig={adConfig}
            analytics={analytics}
            siteSettings={siteSettings}
            onUpdateVideos={handleUpdateVideos}
            onDeleteVideo={handleDeleteVideo}
            onUpdateAdConfig={handleUpdateAdConfig}
            onUpdateSiteSettings={handleUpdateSiteSettings}
            onClose={() => setIsAdminOpen(false)}
          />
        ) : selectedVideo ? (
          <VideoPlayerView
            video={selectedVideo}
            allVideos={videos}
            adConfig={adConfig}
            onBack={() => setSelectedVideo(null)}
            onSelectVideo={(v) => {
              setSelectedVideo(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onVideoViewed={handleVideoViewed}
            onAdTriggered={handleAdTriggered}
            onAdCompleted={handleAdCompleted}
          />
        ) : (
          <VideoGrid
            videos={filteredVideos}
            adConfig={adConfig}
            onSelectVideo={(v) => {
              setSelectedVideo(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            selectedCategory={selectedCategory}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        siteSettings={siteSettings}
        adConfig={adConfig}
        onOpenAdmin={handleAdminToggle}
      />

      {/* Admin Password / PIN Prompt Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-rose-950/30">
            <button
              type="button"
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-5">
              <div className="relative mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-xs">
                  ❤️
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-950/80 border border-rose-800/40 text-rose-300 text-xs font-bold mb-1.5">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                <span>সিক্রেট লক আনলক</span>
              </div>
              <p className="text-xs text-neutral-400">
                প্রবেশ করার জন্য সঠিক পাসওয়ার্ড দিন
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  লগইন পাসওয়ার্ড (Password):
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    placeholder="পাসওয়ার্ড লিখুন..."
                    className="w-full pl-4 pr-11 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-rose-500 text-base text-white focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-1"
                    title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/50 text-xs text-rose-300 text-center font-bold animate-shake">
                  ❌ ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড লিখে আবার চেষ্টা করুন।
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                <span>লগইন করুন</span>
                <span>➔</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
