import React, { useState, useRef } from 'react';
import { Video, AdConfig, TrafficAnalytics, SiteSettings, VisitorLog } from '../types';
import { 
  Shield, Film, Megaphone, BarChart3, Settings, Plus, Trash2, Edit3, 
  Check, Save, Eye, Sparkles, ExternalLink, RefreshCw, Layers, 
  ToggleLeft, ToggleRight, Radio, Link as LinkIcon, Bell, DollarSign,
  Play, Lock, Clock, AlertTriangle, ArrowUpRight, Upload, Image as ImageIcon,
  Video as VideoIcon, Camera, CheckCircle2, XCircle, FileVideo
} from 'lucide-react';
import { saveMediaBlob, generateVideoThumbnail, fileToDataUrl } from '../utils/mediaStorage';

interface AdminPanelProps {
  videos: Video[];
  adConfig: AdConfig;
  analytics: TrafficAnalytics;
  siteSettings: SiteSettings;
  onUpdateVideos: (videos: Video[]) => void;
  onDeleteVideo?: (videoId: string) => void;
  onUpdateAdConfig: (config: AdConfig) => void;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  videos,
  adConfig,
  analytics,
  siteSettings,
  onUpdateVideos,
  onDeleteVideo,
  onUpdateAdConfig,
  onUpdateSiteSettings,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'ads' | 'videos' | 'analytics' | 'settings'>('ads');
  const [activeAdSubTab, setActiveAdSubTab] = useState<'midroll' | 'native' | 'banner' | 'popunder' | 'socialbar' | 'directlink' | 'monetag'>('midroll');
  
  // Local state for Ad Config
  const [localAdConfig, setLocalAdConfig] = useState<AdConfig>(adConfig);
  const [localSettings, setLocalSettings] = useState<SiteSettings>(siteSettings);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  // Video Source & Thumbnail Source Modes
  const [videoSourceMode, setVideoSourceMode] = useState<'gallery' | 'url'>('gallery');
  const [thumbSourceMode, setThumbSourceMode] = useState<'gallery' | 'url' | 'capture'>('gallery');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumbFile, setSelectedThumbFile] = useState<File | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [isCapturingThumb, setIsCapturingThumb] = useState(false);
  const [videoFileInfo, setVideoFileInfo] = useState<{ name: string; size: string; duration: string } | null>(null);

  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);

  // New Video Form State
  const [newVideo, setNewVideo] = useState<Partial<Video>>({
    title: '',
    description: '',
    videoUrl: '',
    videoType: 'mp4',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    category: '😂 ফানি ভিডিও',
    tags: ['ভাইরাল', 'ভিডিও'],
    duration: '03:45',
    midrollAdEnabled: true,
    midrollTime: 7,
    adDuration: 20,
    directDownloadLink: '',
    uploaderName: 'অ্যাডমিন',
    status: 'published',
    isViral: true
  });

  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleSaveAds = () => {
    onUpdateAdConfig(localAdConfig);
    showNotification('✅ বিজ্ঞাপন সেটিংস সফলভাবে সেভ করা হয়েছে!');
  };

  const handleSaveSettings = () => {
    onUpdateSiteSettings(localSettings);
    showNotification('✅ সাইট সেটিংস সফলভাবে আপডেট করা হয়েছে!');
  };

  // Handle Video file selected from phone/PC gallery
  const handleVideoFilePicked = async (file: File) => {
    if (!file) return;
    try {
      setIsProcessingVideo(true);
      setSelectedVideoFile(file);

      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      
      // Auto-fill title if empty
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      if (!newVideo.title) {
        setNewVideo(prev => ({ ...prev, title: fileNameWithoutExt }));
      }

      // Generate thumbnail & extract duration from video frame
      let durationStr = '03:30';
      try {
        const result = await generateVideoThumbnail(file);
        if (result.duration) {
          durationStr = result.duration;
        }
        if (result.thumbnailUrl && (!newVideo.thumbnail || newVideo.thumbnail.includes('unsplash.com'))) {
          setNewVideo(prev => ({ ...prev, thumbnail: result.thumbnailUrl }));
        }
      } catch (err) {
        console.warn('Thumbnail auto-generation skipped', err);
      }

      // Save blob to IndexedDB & get workable blob url
      const videoBlobId = `video_blob_${Date.now()}`;
      const blobUrl = await saveMediaBlob(videoBlobId, file, 'video', file.name);

      setVideoFileInfo({
        name: file.name,
        size: sizeInMb,
        duration: durationStr
      });

      setNewVideo(prev => ({
        ...prev,
        videoUrl: blobUrl,
        blobId: videoBlobId,
        videoType: 'mp4',
        duration: durationStr
      }));

      showNotification('✅ ভিডিও সফলভাবে গ্যালারি থেকে লোড হয়েছে!');
    } catch (error) {
      alert('ভিডিও ফাইল প্রসেসিং এ সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsProcessingVideo(false);
    }
  };

  // Handle Thumbnail image file selected from phone/PC gallery
  const handleThumbFilePicked = async (file: File) => {
    if (!file) return;
    try {
      setSelectedThumbFile(file);
      const dataUrl = await fileToDataUrl(file);
      setNewVideo(prev => ({ ...prev, thumbnail: dataUrl }));
      showNotification('✅ থাম্বনেইল ছবি গ্যালারি থেকে যুক্ত হয়েছে!');
    } catch (error) {
      alert('থাম্বনেইল ইমেজ লোড করতে সমস্যা হয়েছে।');
    }
  };

  // Capture frame from active video as thumbnail
  const handleCaptureVideoFrame = async () => {
    if (!selectedVideoFile) {
      alert('প্রথমে গ্যালারি থেকে একটি ভিডিও ফাইল সিলেক্ট করুন।');
      return;
    }
    try {
      setIsCapturingThumb(true);
      const result = await generateVideoThumbnail(selectedVideoFile);
      if (result.thumbnailUrl) {
        setNewVideo(prev => ({ ...prev, thumbnail: result.thumbnailUrl }));
        showNotification('📸 ভিডিও ফ্রেম থেকে থাম্বনেইল ক্যাপচার সম্পন্ন!');
      }
    } catch (error) {
      alert('ভিডিও ফ্রেম ক্যাপচার করা সম্ভব হয়নি।');
    } finally {
      setIsCapturingThumb(false);
    }
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideo.title || !newVideo.videoUrl) {
      alert('দয়া করে ভিডিওর টাইটেল এবং গ্যালারি থেকে ভিডিও ফাইল সিলেক্ট করুন অথবা ভিডিও লিঙ্ক দিন!');
      return;
    }

    // Format video URL if YouTube or standard stream link
    let finalVideoUrl = newVideo.videoUrl || '';
    let finalVideoType: 'mp4' | 'youtube' | 'embed' | 'stream' = (newVideo.videoType as any) || 'mp4';

    if (finalVideoUrl.includes('youtube.com/watch?v=')) {
      const vidId = finalVideoUrl.split('v=')[1]?.split('&')[0];
      if (vidId) {
        finalVideoUrl = `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`;
        finalVideoType = 'youtube';
      }
    } else if (finalVideoUrl.includes('youtu.be/')) {
      const vidId = finalVideoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (vidId) {
        finalVideoUrl = `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`;
        finalVideoType = 'youtube';
      }
    } else if (finalVideoUrl.includes('youtube.com/shorts/')) {
      const vidId = finalVideoUrl.split('shorts/')[1]?.split('?')[0];
      if (vidId) {
        finalVideoUrl = `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`;
        finalVideoType = 'youtube';
      }
    }

    if (editingVideoId) {
      // Update existing video
      const updated = videos.map((v) => {
        if (v.id === editingVideoId) {
          return {
            ...v,
            ...newVideo,
            videoUrl: finalVideoUrl,
            videoType: finalVideoType,
            tags: Array.isArray(newVideo.tags) ? newVideo.tags : (newVideo.tags as any).split(',').map((t: string) => t.trim())
          } as Video;
        }
        return v;
      });
      onUpdateVideos(updated);
      setEditingVideoId(null);
      showNotification('✅ ভিডিও সফলভাবে আপডেট করা হয়েছে!');
    } else {
      // Add new video
      const created: Video = {
        id: `vid-${Date.now()}`,
        title: newVideo.title || 'নতুন ভাইরাল ভিডিও',
        description: newVideo.description || 'আজকের সেরা ভাইরাল ক্লিপ।',
        videoUrl: finalVideoUrl,
        videoType: finalVideoType,
        blobId: newVideo.blobId,
        thumbnail: newVideo.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        category: newVideo.category || '😂 ফানি ভিডিও',
        tags: Array.isArray(newVideo.tags) ? newVideo.tags : (newVideo.tags as any).split(',').map((t: string) => t.trim()),
        views: Math.floor(Math.random() * 5000) + 1200,
        likes: Math.floor(Math.random() * 500) + 100,
        shares: Math.floor(Math.random() * 200) + 50,
        duration: newVideo.duration || '03:30',
        createdAt: 'এইমাত্র আপলোড',
        featured: false,
        isViral: true,
        midrollAdEnabled: newVideo.midrollAdEnabled ?? true,
        midrollTime: newVideo.midrollTime || 7,
        adDuration: newVideo.adDuration || 20,
        directDownloadLink: newVideo.directDownloadLink || '',
        uploaderName: newVideo.uploaderName || 'অ্যাডমিন',
        status: 'published'
      };

      onUpdateVideos([created, ...videos]);
      showNotification('✅ নতুন ভিডিও সফলভাবে সাইটে পাবলিশ করা হয়েছে!');
    }

    // Reset Form
    setSelectedVideoFile(null);
    setSelectedThumbFile(null);
    setVideoFileInfo(null);
    setNewVideo({
      title: '',
      description: '',
      videoUrl: '',
      videoType: 'mp4',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      category: '😂 ফানি ভিডিও',
      tags: ['ভাইরাল', 'ভিডিও'],
      duration: '03:45',
      midrollAdEnabled: true,
      midrollTime: 7,
      adDuration: 20,
      directDownloadLink: '',
      uploaderName: 'অ্যাডমিন',
      status: 'published',
      isViral: true
    });
  };

  const handleEditVideo = (v: Video) => {
    setEditingVideoId(v.id);
    setNewVideo({
      title: v.title,
      description: v.description,
      videoUrl: v.videoUrl,
      videoType: v.videoType,
      thumbnail: v.thumbnail,
      category: v.category,
      tags: v.tags,
      duration: v.duration,
      midrollAdEnabled: v.midrollAdEnabled,
      midrollTime: v.midrollTime,
      adDuration: v.adDuration,
      directDownloadLink: v.directDownloadLink,
      uploaderName: v.uploaderName,
      status: v.status,
      isViral: v.isViral
    });
    setActiveTab('videos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVideo = (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত এই ভিডিওটি ডিলিট করতে চান?')) {
      if (onDeleteVideo) {
        onDeleteVideo(id);
      } else {
        onUpdateVideos(videos.filter(v => v.id !== id));
      }
      showNotification('🗑️ ভিডিও ডিলিট করা হয়েছে!');
    }
  };

  // Sample video presets for fast testing
  const samplePresets = [
    {
      name: 'কম্পিউটার অ্যানিমেশন ভাইরাল কমেডি',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumb: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      cat: '😂 ফানি ভিডিও'
    },
    {
      name: 'অ্যাডভেঞ্চার ড্রামা ক্লিপ',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumb: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
      cat: '💥 ব্রেকিং নিউজ'
    },
    {
      name: 'স্পেশাল রোমান্টিক সিন',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumb: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
      cat: '🎬 নাটক ও মুভি'
    }
  ];

  return (
    <div id="admin-panel" className="max-w-7xl mx-auto px-3 sm:px-6 py-6 animate-fadeIn">
      {/* Admin Panel Header */}
      <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  মাস্টার অ্যাডমিন কন্ট্রোল প্যানেল
                </h2>
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Active
                </span>
                <span className="bg-sky-950/90 text-sky-300 border border-sky-800/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  ☁️ রিয়েল-টাইম ক্লাউড ডাটাবেজ কানেক্টেড (Firebase)
                </span>
                <span className="bg-rose-950/80 text-rose-300 border border-rose-800/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  ❤️ লগইন ইউজার
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400">
                বিজ্ঞাপন সেটআপ (Native, Banner, Popunder, Social Bar, Direct Link, Monetag, 7s Gate) ও ভিডিও ট্রাফিক নিয়ন্ত্রণ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg cursor-pointer active:scale-95"
              title="অ্যাডমিন প্যানেল লক করুন ও বের হন"
            >
              <Lock className="w-4 h-4 text-rose-400 group-hover:text-white" />
              <span>🔒 লক করুন ও লগআউট</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs sm:text-sm font-bold transition-all"
            >
              <span>সাইট প্রিভিউ</span>
              <span>➔</span>
            </button>
          </div>
        </div>

        {/* Real-time Top Statistics (Traffic & Revenue Overview) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="bg-neutral-950/80 rounded-2xl border border-neutral-800 p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-neutral-400 mb-1 text-xs">
              <span>মোট ভিডিও ভিউজ</span>
              <Eye className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {(analytics.totalViews).toLocaleString('bn-BD')}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +১২.৪% বৃদ্ধি
            </div>
          </div>

          <div className="bg-neutral-950/80 rounded-2xl border border-neutral-800 p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-neutral-400 mb-1 text-xs">
              <span>৭ সে. অ্যাড গেট ইমপ্রেশন</span>
              <Play className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {(analytics.totalAdImpressions).toLocaleString('bn-BD')}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              ভিডিওর মাঝখানে দেখা হয়েছে
            </div>
          </div>

          <div className="bg-neutral-950/80 rounded-2xl border border-neutral-800 p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-neutral-400 mb-1 text-xs">
              <span>২০ সে. অ্যাড ফুল ওয়াচ</span>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {(analytics.totalAdCompleted).toLocaleString('bn-BD')}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              ১০০% কমপ্লিট ট্রাফিক
            </div>
          </div>

          <div className="bg-neutral-950/80 rounded-2xl border border-neutral-800 p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-neutral-400 mb-1 text-xs">
              <span>ডাইরেক্ট ও ব্যানার ক্লিক</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {(analytics.totalDirectClicks).toLocaleString('bn-BD')}
            </div>
            <div className="text-[11px] text-cyan-400 mt-1">
              অ্যাড নেটওয়ার্ক কনভার্সন
            </div>
          </div>
        </div>

        {/* Primary Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'ads'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>📢 অ্যাড সেটআপ সেন্টার</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'videos'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>🎬 ভিডিও আপলোড ও ম্যানেজার ({videos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'analytics'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 ট্রাফিক ও ভিউজ অ্যানালিটিক্স</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'settings'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>⚙️ সাইট সেটিংস</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AD SETUP CENTER */}
      {activeTab === 'ads' && (
        <div className="space-y-6">
          {/* Quick Ad Placement Map Guide Banner */}
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <span className="p-2 bg-amber-500/20 rounded-xl text-lg">📌</span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  বিজ্ঞাপন গাইড ম্যাপ: কোন অ্যাড কোন জায়গায় দিবেন?
                </h3>
                <p className="text-xs text-neutral-400">
                  Adsterra / Monetag / অন্যান্য নেটওয়ার্কের অ্যাড কোড ও ডাইরেক্ট লিংক সঠিক জায়গায় বসানোর পূর্ণাঙ্গ নির্দেশিকা:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Midroll Ad Gate */}
              <div 
                onClick={() => setActiveAdSubTab('midroll')}
                className="p-3 rounded-2xl bg-neutral-950/80 border border-amber-500/30 hover:border-amber-400 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>⏱️</span> ৭ সে. ভিডিও অ্যাড গেট
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">ভিডিওর মাঝে</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  <strong className="text-white">কোথায় শো করবে:</strong> ভিডিও চলার ৭ম সেকেন্ডে ফুলস্ক্রিনে ২০ সেকেন্ড বিরতি হিসেবে।
                </p>
                <p className="text-[11px] text-amber-400/90 font-medium">
                  👉 <strong>কী দিবেন:</strong> ব্যানার অ্যাড কোড, ইমেজ অথবা ডাইরেক্ট অফার লিংক।
                </p>
              </div>

              {/* Direct Link */}
              <div 
                onClick={() => setActiveAdSubTab('directlink')}
                className="p-3 rounded-2xl bg-neutral-950/80 border border-rose-500/30 hover:border-rose-400 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300 flex items-center gap-1.5">
                    <span>🔗</span> ডাইরেক্ট লিংক (Direct Link)
                  </span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">ভিডিও প্লেয়ারে</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  <strong className="text-white">কোথায় শো করবে:</strong> ভিডিওর উপর ফ্লোটিং বাটন এবং প্লেয়ারের নিচে ৩টি হাই-স্পিড ডাউনলোড বাটনে।
                </p>
                <p className="text-[11px] text-rose-400/90 font-medium">
                  👉 <strong>কী দিবেন:</strong> Adsterra Smartlink বা Monetag Direct Link URL।
                </p>
              </div>

              {/* Native Banner */}
              <div 
                onClick={() => setActiveAdSubTab('native')}
                className="p-3 rounded-2xl bg-neutral-950/80 border border-purple-500/30 hover:border-purple-400 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <span>🪧</span> নেটিভ ব্যানার (Native)
                  </span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">ভিডিও লিস্টে</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  <strong className="text-white">কোথায় শো করবে:</strong> হোমপেজে প্রতি ৩টি ভিডিওর পর পর কার্ড আকারে মিশে থাকবে।
                </p>
                <p className="text-[11px] text-purple-400/90 font-medium">
                  👉 <strong>কী দিবেন:</strong> Adsterra 4:1 Native Banner Script কোড।
                </p>
              </div>

              {/* Banner Ads */}
              <div 
                onClick={() => setActiveAdSubTab('banner')}
                className="p-3 rounded-2xl bg-neutral-950/80 border border-emerald-500/30 hover:border-emerald-400 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>🖼️</span> ব্যানার অ্যাড (Banner Ads)
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">হেডার ও সাইডবার</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  <strong className="text-white">কোথায় শো করবে:</strong> সাইটের টপ হেডার (728x90), প্লেয়ারের নিচে ও সাইডবারে।
                </p>
                <p className="text-[11px] text-emerald-400/90 font-medium">
                  👉 <strong>কী দিবেন:</strong> 728x90 বা 300x250 সাইজের ব্যানার HTML/JS স্ক্রিপ্ট।
                </p>
              </div>

              {/* Popunder */}
              <div 
                onClick={() => setActiveAdSubTab('popunder')}
                className="p-3 rounded-2xl bg-neutral-950/80 border border-blue-500/30 hover:border-blue-400 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300 flex items-center gap-1.5">
                    <span>🌐</span> পপ-আন্ডার (Popunder)
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">ক্লিকের পর ব্যাকগ্রাউন্ডে</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  <strong className="text-white">কোথায় শো করবে:</strong> ভিজিটর সাইটে প্রথম যেকোনো ক্লিক করলে নতুন উইন্ডোতে খুলবে।
                </p>
                <p className="text-[11px] text-blue-400/90 font-medium">
                  👉 <strong>কী দিবেন:</strong> Adsterra/Monetag OnClick Popunder Script বা URL।
                </p>
              </div>

              {/* Social Bar & Monetag */}
              <div 
                onClick={() => setActiveAdSubTab('socialbar')}
                className="p-3 rounded-2xl bg-neutral-950/80 border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>💬</span> সোশ্যাল বার ও পুশ
                  </span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">স্ক্রিনের নিচে ফ্লোটিং</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  <strong className="text-white">কোথায় শো করবে:</strong> মোবাইল বা কম্পিউটারের নিচে চ্যাট নোটিফিকেশনের মতো ভেসে থাকবে।
                </p>
                <p className="text-[11px] text-cyan-400/90 font-medium">
                  👉 <strong>কী দিবেন:</strong> সোশ্যাল বার টেক্সট, কাস্টম অফার ও রিডাইরেক্ট লিংক।
                </p>
              </div>
            </div>
          </div>

          {/* Ad Sub-Tabs */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-neutral-900/80 rounded-2xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveAdSubTab('midroll')}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAdSubTab === 'midroll'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>⏱️ ৭ সে. ভিডিও অ্যাড গেট</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdSubTab('native')}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAdSubTab === 'native'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🪧 Native Banner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdSubTab('banner')}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAdSubTab === 'banner'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🖼️ Banner Ads</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdSubTab('popunder')}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAdSubTab === 'popunder'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>🌐 Popunder Ad</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdSubTab('socialbar')}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAdSubTab === 'socialbar'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>💬 Social Bar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdSubTab('directlink')}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAdSubTab === 'directlink'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>🔗 Direct Link</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdSubTab('monetag')}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeAdSubTab === 'monetag'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>🏷️ মুনিটেগ (Monetag)</span>
            </button>
          </div>

          {/* SUBTAB 1: 7-SECOND MIDROLL AD GATE */}
          {activeAdSubTab === 'midroll' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <Clock className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      ৭ সেকেন্ড ভিডিও অ্যাড গেট কনফিগারেশন (7s Midroll Ad Gate)
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    ইউজার ভিডিও চালু করার ৭ সেকেন্ড পর ভিডিও থেমে যাবে এবং ২০ সেকেন্ড বাধ্যতামূলক অ্যাড দেখতে হবে।
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-300">
                    {localAdConfig.midrollAdGate.enabled ? '🟢 অ্যাড গেট সক্রিয় (ON)' : '🔴 অ্যাড গেট বন্ধ (OFF)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocalAdConfig({
                      ...localAdConfig,
                      midrollAdGate: {
                        ...localAdConfig.midrollAdGate,
                        enabled: !localAdConfig.midrollAdGate.enabled
                      }
                    })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      localAdConfig.midrollAdGate.enabled ? 'bg-amber-500' : 'bg-neutral-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      localAdConfig.midrollAdGate.enabled ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Guide Note */}
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <span>📍</span>
                  <span>কোথায় দেখাবে ও কী কোড দিবেন:</span>
                </div>
                <p className="text-neutral-300 text-[11px]">
                  • <strong>কোথায় দেখাবে:</strong> যেকোনো ভিডিও ওপেন করে প্লে করার ৭ সেকেন্ড পর পুরো স্ক্রিন জুড়ে পপআপ মডাল আসবে।
                </p>
                <p className="text-neutral-300 text-[11px]">
                  • <strong>কী কোড/লিংক দিবেন:</strong> Adsterra/Monetag ব্যানার কোড অথবা আপনার সিপিএ/স্পনসর ডাইরেক্ট লিংক পেস্ট করুন।
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    ভিডিও চলার কত সেকেন্ড পর অ্যাড শো করবে? (ডিফল্ট: 7 সেকেন্ড)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={localAdConfig.midrollAdGate.triggerSeconds}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      midrollAdGate: {
                        ...localAdConfig.midrollAdGate,
                        triggerSeconds: Number(e.target.value) || 7
                      }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    কত সেকেন্ড অ্যাড বাধ্যতামূলক দেখতে হবে? (ডিফল্ট: 20 সেকেন্ড)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={localAdConfig.midrollAdGate.countdownSeconds}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      midrollAdGate: {
                        ...localAdConfig.midrollAdGate,
                        countdownSeconds: Number(e.target.value) || 20
                      }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  অ্যাড গেটের শিরোনাম (Title)
                </label>
                <input
                  type="text"
                  value={localAdConfig.midrollAdGate.adTitle}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    midrollAdGate: { ...localAdConfig.midrollAdGate, adTitle: e.target.value }
                  })}
                  placeholder="ফুল ভিডিও দেখতে হলে আপনাকে ২০ সেকেন্ড অ্যাড দেখতে হবে"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  এখানে ৭ সেকেন্ড অ্যাড গেট HTML / স্ক্রিপ্ট / আইফ্রেম কোড বসান
                </label>
                <textarea
                  rows={4}
                  value={localAdConfig.midrollAdGate.adEmbedCode}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    midrollAdGate: { ...localAdConfig.midrollAdGate, adEmbedCode: e.target.value }
                  })}
                  placeholder="<script> অথবা <div style='...'> এখানে অ্যাড নেটওয়ার্ক কোড বা স্পনসর কোড পেস্ট করুন..."
                  className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    স্পনসর ডাইরেক্ট লিংক (Sponsor Redirect URL)
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.midrollAdGate.directLinkUrl}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      midrollAdGate: { ...localAdConfig.midrollAdGate, directLinkUrl: e.target.value }
                    })}
                    placeholder="https://example.com/sponsor-link"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    স্পনসর ব্যানার ইমেজ লিংক (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.midrollAdGate.adBannerImage}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      midrollAdGate: { ...localAdConfig.midrollAdGate, adBannerImage: e.target.value }
                    })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAds}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>৭ সেকেন্ড অ্যাড গেট সেটিংস সেভ করুন</span>
              </button>
            </div>
          )}

          {/* SUBTAB 2: NATIVE BANNER */}
          {activeAdSubTab === 'native' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400">
                      <Layers className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Native Banner (নেটিভ ব্যানার বিজ্ঞাপন)
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    ভিডিও গ্রিডের মাঝে স্বাভাবিক ভিডিও কার্ডের মতো নেটিভ ব্যানার বিজ্ঞাপন প্রদর্শন করে।
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-300">
                    {localAdConfig.nativeBanner.enabled ? '🟢 অন (ON)' : '🔴 অফ (OFF)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocalAdConfig({
                      ...localAdConfig,
                      nativeBanner: {
                        ...localAdConfig.nativeBanner,
                        enabled: !localAdConfig.nativeBanner.enabled
                      }
                    })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      localAdConfig.nativeBanner.enabled ? 'bg-rose-600' : 'bg-neutral-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      localAdConfig.nativeBanner.enabled ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Guide Note */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-purple-300">
                  <span>📍</span>
                  <span>কোথায় দেখাবে ও কী কোড দিবেন:</span>
                </div>
                <p className="text-neutral-300 text-[11px]">
                  • <strong>কোথায় দেখাবে:</strong> হোমপেজ ও ক্যাটাগরি পেইজে ভিডিও লিস্টের মাঝে প্রতি ৩টি বা ৪টি ভিডিও পর পর স্বয়ংক্রিয় কার্ড হিসেবে শো করবে।
                </p>
                <p className="text-neutral-300 text-[11px]">
                  • <strong>কী কোড দিবেন:</strong> Adsterra 4:1 Native Banner Script কোড অথবা কাস্টম টাইটেল, লিংক ও ইমেজ।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  এখানে নেটিভ ব্যানার অ্যাড কোড / স্ক্রিপ্ট / HTML বসান:
                </label>
                <textarea
                  rows={4}
                  value={localAdConfig.nativeBanner.code}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    nativeBanner: { ...localAdConfig.nativeBanner, code: e.target.value }
                  })}
                  placeholder="<script> অথবা <div style='...'> আপনার অ্যাড কোড এখানে পেস্ট করুন..."
                  className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    নেটিভ অ্যাড টাইটেল (যদি কাস্টম কার্ড ব্যবহার করতে চান)
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.nativeBanner.title}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      nativeBanner: { ...localAdConfig.nativeBanner, title: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    নেটিভ অ্যাড টার্গেট লিংক (Click Redirect Link)
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.nativeBanner.customLink}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      nativeBanner: { ...localAdConfig.nativeBanner, customLink: e.target.value }
                    })}
                    placeholder="https://example.com/offer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    নেটিভ ব্যানার ইমেজ URL
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.nativeBanner.customImage}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      nativeBanner: { ...localAdConfig.nativeBanner, customImage: e.target.value }
                    })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    কতগুলো ভিডিওর পর পর নেটিভ অ্যাড বসবে? (যেমন: প্রতি ৩টি ভিডিও পর)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={localAdConfig.nativeBanner.frequency}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      nativeBanner: { ...localAdConfig.nativeBanner, frequency: Number(e.target.value) || 3 }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAds}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>নেটিভ ব্যানার সেটিংস সেভ করুন</span>
              </button>
            </div>
          )}

          {/* SUBTAB 3: BANNER ADS */}
          {activeAdSubTab === 'banner' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400">
                      <Sparkles className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Banner Ads (টপ হেডার, প্লেয়ার ও সাইডবার ব্যানার অ্যাড)
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    সাইটের বিভিন্ন নির্ধারিত জায়গায় ব্যানার বিজ্ঞাপন কোড বসান।
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-300">
                    {localAdConfig.bannerAd.enabled ? '🟢 অন (ON)' : '🔴 অফ (OFF)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocalAdConfig({
                      ...localAdConfig,
                      bannerAd: { ...localAdConfig.bannerAd, enabled: !localAdConfig.bannerAd.enabled }
                    })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      localAdConfig.bannerAd.enabled ? 'bg-rose-600' : 'bg-neutral-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      localAdConfig.bannerAd.enabled ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Guide Note */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <span>📍</span>
                  <span>কোথায় দেখাবে ও কী কোড দিবেন:</span>
                </div>
                <p className="text-neutral-300 text-[11px]">
                  • <strong>১. টপ হেডার ব্যানার:</strong> সাইটের একদম উপরে 728x90 ব্যানার কোড শো করবে।
                </p>
                <p className="text-neutral-300 text-[11px]">
                  • <strong>২. প্লেয়ারের নিচে ব্যানার:</strong> ভিডিও প্লেয়ারের ঠিক নিচে 728x90 বা 300x250 রেসপনসিভ ব্যানার কোড শো করবে।
                </p>
                <p className="text-neutral-300 text-[11px]">
                  • <strong>৩. সাইডবার ব্যানার:</strong> ভিডিও দেখার পেইজের সাইডবারে 300x250 সাইজের ব্যানার শো করবে।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1.5">
                  ১. এখানে টপ হেডার ব্যানার অ্যাড কোড বসান (Header 728x90 Banner)
                </label>
                <textarea
                  rows={3}
                  value={localAdConfig.bannerAd.headerBannerCode}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    bannerAd: { ...localAdConfig.bannerAd, headerBannerCode: e.target.value }
                  })}
                  placeholder="<script> অথবা <div style='...'> টপ হেডার ব্যানার কোড..."
                  className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1.5">
                  ২. এখানে প্লেয়ারের নিচে ব্যানার অ্যাড কোড বসান (Under Video Player Banner)
                </label>
                <textarea
                  rows={3}
                  value={localAdConfig.bannerAd.playerUnderBannerCode}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    bannerAd: { ...localAdConfig.bannerAd, playerUnderBannerCode: e.target.value }
                  })}
                  placeholder="<script> অথবা <div style='...'> ভিডিওর নিচের ব্যানার কোড..."
                  className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-cyan-400 mb-1.5">
                  ৩. এখানে সাইডবার ব্যানার অ্যাড কোড বসান (Sidebar 300x250 Banner)
                </label>
                <textarea
                  rows={3}
                  value={localAdConfig.bannerAd.sidebarBannerCode}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    bannerAd: { ...localAdConfig.bannerAd, sidebarBannerCode: e.target.value }
                  })}
                  placeholder="<script> অথবা <div style='...'> সাইডবার ব্যানার কোড..."
                  className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveAds}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>সব ব্যানার অ্যাড সেটিংস সেভ করুন</span>
              </button>
            </div>
          )}

          {/* SUBTAB 4: POPUNDER AD */}
          {activeAdSubTab === 'popunder' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400">
                      <ArrowUpRight className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Popunder Ad (পপআন্ডার বিজ্ঞাপন)
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    ইউজার সাইটে বা ভিডিওতে যেকোনো জায়গায় প্রথম ক্লিক করলে ব্যাকগ্রাউন্ডে নতুন ট্যাবে আপনার দেওয়া লিংক ওপেন হবে।
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-300">
                    {localAdConfig.popunder.enabled ? '🟢 অন (ON)' : '🔴 অফ (OFF)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocalAdConfig({
                      ...localAdConfig,
                      popunder: { ...localAdConfig.popunder, enabled: !localAdConfig.popunder.enabled }
                    })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      localAdConfig.popunder.enabled ? 'bg-rose-600' : 'bg-neutral-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      localAdConfig.popunder.enabled ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Guide Note */}
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-300">
                  <span>📍</span>
                  <span>কোথায় দেখাবে ও কী কোড দিবেন:</span>
                </div>
                <p className="text-neutral-300 text-[11px]">
                  • <strong>কোথায় দেখাবে:</strong> ব্যবহারকারী সাইটের যেকোনো অংশে বা ভিডিও প্লে করার বাটনে ক্লিক করলেই ব্যাকগ্রাউন্ডে নতুন উইন্ডোতে লোড হবে।
                </p>
                <p className="text-neutral-300 text-[11px]">
                  • <strong>কী কোড দিবেন:</strong> Adsterra/Monetag OnClick Popunder Script অথবা সরাসরি ডাইরেক্ট ল্যান্ডিং পেজ URL।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  পপআন্ডার টার্গেট ডাইরেক্ট URL (Popunder Direct Link):
                </label>
                <input
                  type="text"
                  value={localAdConfig.popunder.targetUrl}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    popunder: { ...localAdConfig.popunder, targetUrl: e.target.value }
                  })}
                  placeholder="https://example.com/popunder-landing"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  অথবা এখানে পপআন্ডার স্ক্রিপ্ট কোড বসান (Script Code):
                </label>
                <textarea
                  rows={3}
                  value={localAdConfig.popunder.code}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    popunder: { ...localAdConfig.popunder, code: e.target.value }
                  })}
                  placeholder="<script> ... পপআন্ডার স্ক্রিপ্ট কোড পেস্ট করুন </script>"
                  className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  পপআন্ডার ফ্রিকোয়েন্সি লিমিট (প্রতি ইউজারের জন্য কত মিনিট পর পর খুলবে?)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={localAdConfig.popunder.frequencyLimitMinutes}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    popunder: { ...localAdConfig.popunder, frequencyLimitMinutes: Number(e.target.value) || 5 }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveAds}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>পপআন্ডার অ্যাড সেটিংস সেভ করুন</span>
              </button>
            </div>
          )}

          {/* SUBTAB 5: SOCIAL BAR */}
          {activeAdSubTab === 'socialbar' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400">
                      <Bell className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Social Bar (সোশ্যাল বার পুশ নোটিফিকেশন অ্যাড)
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    স্ক্রিনের কোণায় ফ্লোটিং নোটিফিকেশন বার দেখায়, যা ক্লিক রেট বাড়িয়ে দেয়।
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-300">
                    {localAdConfig.socialBar.enabled ? '🟢 অন (ON)' : '🔴 অফ (OFF)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocalAdConfig({
                      ...localAdConfig,
                      socialBar: { ...localAdConfig.socialBar, enabled: !localAdConfig.socialBar.enabled }
                    })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      localAdConfig.socialBar.enabled ? 'bg-rose-600' : 'bg-neutral-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      localAdConfig.socialBar.enabled ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    সোশ্যাল বার টাইটেল:
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.socialBar.customTitle}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      socialBar: { ...localAdConfig.socialBar, customTitle: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    টার্গেট লিংক (Redirect Link):
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.socialBar.customLink}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      socialBar: { ...localAdConfig.socialBar, customLink: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  সোশ্যাল বার মেসেজ টেক্সট:
                </label>
                <input
                  type="text"
                  value={localAdConfig.socialBar.customMessage}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    socialBar: { ...localAdConfig.socialBar, customMessage: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    বাটন টেক্সট:
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.socialBar.customButtonText}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      socialBar: { ...localAdConfig.socialBar, customButtonText: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    ব্যাজ টেক্সট:
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.socialBar.customBadge}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      socialBar: { ...localAdConfig.socialBar, customBadge: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    ডিসপ্লে পজিশন:
                  </label>
                  <select
                    value={localAdConfig.socialBar.position}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      socialBar: { ...localAdConfig.socialBar, position: e.target.value as any }
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="bottom-right">ডান পাশের নিচে (Bottom Right)</option>
                    <option value="bottom-left">বাম পাশের নিচে (Bottom Left)</option>
                    <option value="top-bar">উপরে টপ বারে (Top Bar)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAds}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>সোশ্যাল বার সেটিংস সেভ করুন</span>
              </button>
            </div>
          )}

          {/* SUBTAB 6: DIRECT LINK */}
          {activeAdSubTab === 'directlink' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400">
                      <LinkIcon className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      Direct Link (ডাইরেক্ট লিংক বাটন ও ভিডিও অপশন সেটআপ)
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    ভিডিও প্লেয়ারের ওপর ফ্লোটিং বাটন এবং প্লেয়ারের নিচের ৩টি ডাউনলোড/সার্ভার বাটনে ডাইরেক্ট অফার লিংক সেট করুন।
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-300">
                    {localAdConfig.directLink.enabled ? '🟢 অন (ON)' : '🔴 অফ (OFF)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocalAdConfig({
                      ...localAdConfig,
                      directLink: { ...localAdConfig.directLink, enabled: !localAdConfig.directLink.enabled }
                    })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      localAdConfig.directLink.enabled ? 'bg-rose-600' : 'bg-neutral-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      localAdConfig.directLink.enabled ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Guide Card */}
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <span>💡</span>
                  <span>ডাইরেক্ট লিংক কোথায় কোথায় শো করে?</span>
                </div>
                <ul className="list-disc list-inside text-neutral-300 space-y-1 text-[11px] leading-relaxed">
                  <li><strong className="text-white">১. ভিডিও প্লেয়ারের উপর ফ্লোটিং বাটন:</strong> ভিডিও চলার সময় ডানপাশের উপরের কোণায় "⚡ ডাইরেক্ট লিংক / হাই স্পিড" হিসেবে ব্লিঙ্ক করবে।</li>
                  <li><strong className="text-white">২. ভিডিও প্লেয়ারের নিচে ৩টি হাই-স্পিড বাটন:</strong> "HD ডাউনলোড", "সার্ভার ২ হাই-স্পিড" এবং "1080p কোয়ালিটি"।</li>
                  <li><strong className="text-white">৩. ভিডিও আপলোড করার সময় স্পেসিফিক লিংক:</strong> প্রতি ভিডিও আপলোডের সময় চাইলে আলাদা ডাউনলোড লিংকও দিতে পারবেন।</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1.5">
                  🔗 এখানে আপনার মূল ডাইরেক্ট লিংক URL বসান (Adsterra Smartlink / Monetag Direct Link):
                </label>
                <input
                  type="text"
                  value={localAdConfig.directLink.url}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    directLink: { ...localAdConfig.directLink, url: e.target.value }
                  })}
                  placeholder="https://www.profitablecpmrate.com/your-smartlink-code"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              {/* Floating on-video badge settings */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">
                      ভিডিও প্লেয়ারের উপর ফ্লোটিং ডাইরেক্ট লিংক বাটন দেখান (On-Video Direct Link Button)
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      ভিডিও স্ক্রিনের উপরে সরাসরি ক্লিক করার জন্য অ্যানিমেটেড বাটন ভেসে থাকবে।
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localAdConfig.directLink.showOnVideoBadge !== false}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      directLink: { ...localAdConfig.directLink, showOnVideoBadge: e.target.checked }
                    })}
                    className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    ভিডিওর ওপর ফ্লোটিং বাটনের লেখা:
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.directLink.videoBadgeText || '⚡ ডাইরেক্ট লিংক / হাই স্পিড ➜'}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      directLink: { ...localAdConfig.directLink, videoBadgeText: e.target.value }
                    })}
                    placeholder="⚡ ডাইরেক্ট লিংক / হাই স্পিড ➜"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    ডাউনলোড বাটন নাম (Button 1):
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.directLink.downloadButtonText}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      directLink: { ...localAdConfig.directLink, downloadButtonText: e.target.value }
                    })}
                    placeholder="📥 HD ভিডিও ডাউনলোড করুন"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    সার্ভার ২ বাটন নাম (Button 2):
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.directLink.fastServerButtonText}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      directLink: { ...localAdConfig.directLink, fastServerButtonText: e.target.value }
                    })}
                    placeholder="⚡ সার্ভার ২ (হাই-স্পিড মিরর)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    HD কোয়ালিটি বাটন নাম (Button 3):
                  </label>
                  <input
                    type="text"
                    value={localAdConfig.directLink.hdQualityButtonText}
                    onChange={(e) => setLocalAdConfig({
                      ...localAdConfig,
                      directLink: { ...localAdConfig.directLink, hdQualityButtonText: e.target.value }
                    })}
                    placeholder="💎 1080p ফুল কোয়ালিটি লিংক"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAds}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ডাইরেক্ট লিংক সেটিংস সেভ করুন</span>
              </button>
            </div>
          )}

          {/* SUBTAB 7: MONETAG */}
          {activeAdSubTab === 'monetag' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400">
                      <DollarSign className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      মুনিটেগ (Monetag Ad Network Integration)
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Monetag এর MultiTag, In-Page Push, OnClick Popunder ও Direct Link কোড এক ক্লিকে সেটআপ করুন।
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-300">
                    {localAdConfig.monetag.enabled ? '🟢 মুনিটেগ চালু (ON)' : '🔴 মুনিটেগ বন্ধ (OFF)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocalAdConfig({
                      ...localAdConfig,
                      monetag: { ...localAdConfig.monetag, enabled: !localAdConfig.monetag.enabled }
                    })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      localAdConfig.monetag.enabled ? 'bg-rose-600' : 'bg-neutral-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      localAdConfig.monetag.enabled ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Guide Note */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <span>📍</span>
                  <span>Monetag কোথায় শো করবে & কীভাবে কাজ করবে:</span>
                </div>
                <p className="text-neutral-300 text-[11px]">
                  • <strong>MultiTag কোড:</strong> Monetag এর অল-ইন-ওয়ান MultiTag স্ক্রিপ্ট দিলে স্বয়ংক্রিয়ভাবে ভিজিটরদের কাছে হাই-সিপিএম বিজ্ঞাপন দেখাবে।
                </p>
                <p className="text-neutral-300 text-[11px]">
                  • <strong>In-Page Push & Direct Link:</strong> পুশ নোটিফিকেশন ও ডাউনলোড বাটন রিডাইরেক্টেড হিসেবে কাজ করবে।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Monetag Zone ID (যেমন: 9847231):
                </label>
                <input
                  type="text"
                  value={localAdConfig.monetag.zoneId}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    monetag: { ...localAdConfig.monetag, zoneId: e.target.value }
                  })}
                  placeholder="9847231"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  এখানে Monetag MultiTag Script কোড বসান:
                </label>
                <textarea
                  rows={3}
                  value={localAdConfig.monetag.multiTagCode}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    monetag: { ...localAdConfig.monetag, multiTagCode: e.target.value }
                  })}
                  placeholder="<script src='https://alwingulla.com/...' data-zone='...'></script>"
                  className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  এখানে Monetag In-Page Push কোড বসান:
                </label>
                <textarea
                  rows={3}
                  value={localAdConfig.monetag.inPagePushCode}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    monetag: { ...localAdConfig.monetag, inPagePushCode: e.target.value }
                  })}
                  placeholder="<script> (function(s,u,z,p){ ... })(document.createElement('script'), ...); </script>"
                  className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Monetag Direct Smartlink URL:
                </label>
                <input
                  type="text"
                  value={localAdConfig.monetag.directLinkUrl}
                  onChange={(e) => setLocalAdConfig({
                    ...localAdConfig,
                    monetag: { ...localAdConfig.monetag, directLinkUrl: e.target.value }
                  })}
                  placeholder="https://example.com/monetag-direct"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveAds}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>মুনিটেগ কনফিগারেশন সেভ করুন</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VIDEO UPLOAD & MANAGEMENT */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          {/* Upload / Edit Video Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-600/20 text-rose-400">
                  <Film className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-white">
                  {editingVideoId ? 'ভিডিও এডিট করুন' : 'নতুন ভিডিও আপলোড করুন'}
                </h3>
              </div>

              {editingVideoId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingVideoId(null);
                    setNewVideo({
                      title: '',
                      description: '',
                      videoUrl: '',
                      thumbnail: '',
                      category: '😂 ফানি ভিডিও',
                      tags: ['ভাইরাল'],
                      duration: '03:30',
                      midrollAdEnabled: true
                    });
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  ✕ বাতিল করুন
                </button>
              )}
            </div>

            {/* Quick Sample Presets Picker */}
            {!editingVideoId && (
              <div className="mb-5 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
                <span className="text-xs font-bold text-amber-400 block mb-2">
                  ⚡ ১ ক্লিকে ডেমো ভাইরাল ভিডিও লোড করুন (দ্রুত পরীক্ষার জন্য):
                </span>
                <div className="flex flex-wrap gap-2">
                  {samplePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewVideo({
                          ...newVideo,
                          title: preset.name,
                          videoUrl: preset.url,
                          thumbnail: preset.thumb,
                          category: preset.cat,
                          description: `${preset.name} - আজকের সবচেয়ে ট্রেন্ডিং ক্লিপ!`
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleAddVideo} className="space-y-5">
              {/* VIDEO SOURCE SECTION */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-850 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400">
                      <FileVideo className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">ভিডিও আপলোড সোর্স (Video File Source)</h4>
                      <p className="text-[11px] text-neutral-400">ফোন বা কম্পিউটারের গ্যালারি থেকে সরাসরি ভিডিও ফাইল দিন অথবা অনলাইন লিংক ব্যবহার করুন</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setVideoSourceMode('gallery')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        videoSourceMode === 'gallery'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>গ্যালারি / ফাইল</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoSourceMode('url')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        videoSourceMode === 'url'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>ভিডিও লিংক (URL)</span>
                    </button>
                  </div>
                </div>

                {videoSourceMode === 'gallery' ? (
                  <div>
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleVideoFilePicked(e.target.files[0]);
                        }
                      }}
                    />

                    {!newVideo.videoUrl || videoSourceMode === 'url' ? (
                      <div
                        onClick={() => videoFileInputRef.current?.click()}
                        className="border-2 border-dashed border-neutral-750 hover:border-rose-500/80 bg-neutral-900/60 hover:bg-neutral-900 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-rose-600/10 text-rose-500 border border-rose-600/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="w-7 h-7" />
                        </div>
                        <h5 className="text-sm font-bold text-white mb-1">
                          ফোন / পিসির গ্যালারি থেকে ভিডিও আপলোড করতে এখানে ক্লিক করুন
                        </h5>
                        <p className="text-xs text-neutral-400 mb-3">
                          MP4, WebM, MOV, MKV ইত্যাদি যেকোনো ভিডিও ফরম্যাট সাপোর্টেড
                        </p>
                        <button
                          type="button"
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                        >
                          <FileVideo className="w-4 h-4" />
                          <span>গ্যালারি থেকে ভিডিও নির্বাচন করুন</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            <div>
                              <span className="text-xs font-bold text-emerald-400 block">ভিডিও লোড সম্পন্ন হয়েছে</span>
                              <span className="text-xs text-white font-medium break-all">
                                {videoFileInfo?.name || 'নির্বাচিত ভিডিও'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {videoFileInfo?.size && (
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-amber-400 font-mono">
                                সাইজ: {videoFileInfo.size}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => videoFileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>ভিডিও পরিবর্তন</span>
                            </button>
                          </div>
                        </div>

                        {/* Video Player Preview */}
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-56 mx-auto border border-neutral-800">
                          <video
                            src={newVideo.videoUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-xs text-neutral-400">
                            দৈর্ঘ্য: <strong className="text-white">{newVideo.duration || '03:30'}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={handleCaptureVideoFrame}
                            disabled={isCapturingThumb}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{isCapturingThumb ? 'ক্যাপচার হচ্ছে...' : '🎬 এই ভিডিও থেকে থাম্বনেইল বানান'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      ভিডিও লিঙ্ক পেস্ট করুন (YouTube, Facebook, Google Drive, MP4 বা যেকোনো ভিডিও URL):
                    </label>
                    <input
                      type="url"
                      required={videoSourceMode === 'url'}
                      value={newVideo.videoUrl || ''}
                      onChange={(e) => setNewVideo({ ...newVideo, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... বা https://.../video.mp4"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1.5">
                      💡 YouTube ভিডিও, Shorts, Facebook ভিডিও, Google Drive শেয়ার লিঙ্ক অথবা সরাসরি MP4 স্ট্রিমিং লিঙ্ক যেকোনো একটি পেস্ট করলেই অটোমেটিক চলবে।
                    </p>
                  </div>
                )}
              </div>

              {/* THUMBNAIL SOURCE SECTION */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-850 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">ভিডিও থাম্বনেইল ইমেজ (Video Thumbnail)</h4>
                      <p className="text-[11px] text-neutral-400">গ্যালারি থেকে ফটো আপলোড করুন অথবা ভিডিওর ফ্রেম থেকে অটো-ক্যাপচার করুন</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setThumbSourceMode('gallery')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        thumbSourceMode === 'gallery'
                          ? 'bg-amber-500 text-neutral-950 shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>গ্যালারি ফটো</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbSourceMode('url')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        thumbSourceMode === 'url'
                          ? 'bg-amber-500 text-neutral-950 shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>ইমেজ URL</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Thumbnail Preview Card */}
                  <div className="sm:col-span-5">
                    <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 aspect-video shadow-md group">
                      {newVideo.thumbnail ? (
                        <img
                          src={newVideo.thumbnail}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 p-4 text-center">
                          <ImageIcon className="w-8 h-8 mb-1" />
                          <span className="text-xs">কোন থাম্বনেইল নির্বাচন করা হয়নি</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] text-white font-bold">
                        প্রিভিউ
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Controls */}
                  <div className="sm:col-span-7 space-y-3">
                    <input
                      ref={thumbFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleThumbFilePicked(e.target.files[0]);
                        }
                      }}
                    />

                    {thumbSourceMode === 'gallery' ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => thumbFileInputRef.current?.click()}
                          className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 hover:border-amber-500/60 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow"
                        >
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>গ্যালারি থেকে থাম্বনেইল ফটো নির্বাচন করুন</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCaptureVideoFrame}
                          disabled={!selectedVideoFile && !newVideo.videoUrl}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Camera className="w-4 h-4 text-amber-400" />
                          <span>{isCapturingThumb ? 'ক্যাপচার হচ্ছে...' : '🎬 বর্তমান ভিডিও থেকে ফ্রেম ক্যাপচার করুন'}</span>
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                          থাম্বনেইল ছবির অনলাইন URL:
                        </label>
                        <input
                          type="url"
                          value={newVideo.thumbnail || ''}
                          onChange={(e) => setNewVideo({ ...newVideo, thumbnail: e.target.value })}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TITLE & DETAILS */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    ভিডিওর শিরোনাম (Video Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVideo.title || ''}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    placeholder="যেমন: 🔥 ফেসবুকে তুমুল ভাইরাল হওয়া নতুন মজার ভিডিওটি একবার হলেও দেখুন!"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      ক্যাটাগরি
                    </label>
                    <select
                      value={newVideo.category}
                      onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="😂 ফানি ভিডিও">😂 ফানি ভিডিও</option>
                      <option value="💥 ব্রেকিং নিউজ">💥 ব্রেকিং নিউজ</option>
                      <option value="🎬 নাটক ও মুভি">🎬 নাটক ও মুভি</option>
                      <option value="📱 রিলস ও শর্টস">📱 রিলস ও শর্টস</option>
                      <option value="🏏 খেলাধুলা">🏏 খেলাধুলা</option>
                      <option value="🎵 ভাইরাল গান">🎵 ভাইরাল গান</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      ভিডিওর দৈর্ঘ্য (Duration যেমন 04:20)
                    </label>
                    <input
                      type="text"
                      value={newVideo.duration || '03:45'}
                      onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                      placeholder="03:45"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      আপলোডকারী নাম
                    </label>
                    <input
                      type="text"
                      value={newVideo.uploaderName || 'অ্যাডমিন'}
                      onChange={(e) => setNewVideo({ ...newVideo, uploaderName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    ভিডিওর বিবরণ (Description)
                  </label>
                  <textarea
                    rows={2}
                    value={newVideo.description || ''}
                    onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                    placeholder="আজকের ভাইরাল ঘটনার ভিডিও..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* 7-Second Ad Gate Toggle for this video */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-amber-500/30 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold text-white block">
                      ⏱️ এই ভিডিওতে ৭ সেকেন্ড পর ২০ সেকেন্ড অ্যাড লক চালু থাকবে?
                    </span>
                    <span className="text-xs text-neutral-400">
                      চালু রাখলে ইউজার ভিডিও দেখার ৭ম সেকেন্ডে বিজ্ঞাপন দেখতে বাধ্য হবে।
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNewVideo({ ...newVideo, midrollAdEnabled: !newVideo.midrollAdEnabled })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      newVideo.midrollAdEnabled ? 'bg-amber-500' : 'bg-neutral-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      newVideo.midrollAdEnabled ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessingVideo}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-60"
              >
                {editingVideoId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                <span>{editingVideoId ? 'ভিডিও আপডেট সেভ করুন' : 'ভিডিও সাইটে পাবলিশ করুন'}</span>
              </button>
            </form>
          </div>

          {/* Video List Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-white">
                আপলোড করা ভিডিওর তালিকা ও ট্রাফিক ({videos.length})
              </h3>
              <span className="text-xs text-neutral-400">সর্বশেষ আপলোড অনুযায়ী সাজানো</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">ভিডিও ও থাম্বনেইল</th>
                    <th className="py-3 px-3">ক্যাটাগরি</th>
                    <th className="py-3 px-3">মোট ভিউজ</th>
                    <th className="py-3 px-3">৭ সে. অ্যাড গেট</th>
                    <th className="py-3 px-3">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {videos.map((vid) => (
                    <tr key={vid.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                            <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="max-w-xs">
                            <h4 className="font-bold text-white line-clamp-1">{vid.title}</h4>
                            <span className="text-[10px] text-neutral-400 font-mono">{vid.duration}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-300">{vid.category}</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {(vid.views).toLocaleString('bn-BD')} ভিউ
                      </td>
                      <td className="py-3 px-3">
                        {vid.midrollAdEnabled ? (
                          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            চালু (Active)
                          </span>
                        ) : (
                          <span className="bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full text-[10px]">
                            বন্ধ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditVideo(vid)}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded-lg transition-colors"
                            title="এডিট করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(vid.id)}
                            className="p-1.5 bg-neutral-800 hover:bg-rose-950 text-rose-400 rounded-lg transition-colors"
                            title="ডিলিট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRAFFIC & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Daily Traffic Breakdown */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <span>দৈনিক ট্রাফিক ও অ্যাড কনভার্সন রিপোর্ট</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">তারিখ</th>
                    <th className="py-3 px-3">ভিডিও প্লে / ভিউজ</th>
                    <th className="py-3 px-3">৭ সে. অ্যাড গেট ভিউ</th>
                    <th className="py-3 px-3">ডাইরেক্ট অ্যাড ক্লিক</th>
                    <th className="py-3 px-3">সাকসেস রেট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono">
                  {analytics.dailyViews.map((day, idx) => (
                    <tr key={idx} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-3 font-sans font-bold text-white">{day.date}</td>
                      <td className="py-3 px-3 text-neutral-200">{(day.views).toLocaleString('bn-BD')}</td>
                      <td className="py-3 px-3 text-rose-400">{(day.adGates).toLocaleString('bn-BD')}</td>
                      <td className="py-3 px-3 text-amber-400">{(day.adClicks).toLocaleString('bn-BD')}</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">
                        {((day.adGates / day.views) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Visitor Activity Stream */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  রিয়েল-টাইম ভিজিটর ট্রাফিক অ্যাক্টিভিটি
                </h3>
              </div>
              <span className="text-xs text-neutral-400">স্বয়ংক্রিয় লাইভ আপডেট</span>
            </div>

            <div className="space-y-3">
              {analytics.visitorLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{log.country}</span>
                      <span className="text-[10px] text-neutral-500">• {log.device}</span>
                      <span className="text-[10px] text-amber-400">• {log.timestamp}</span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-0.5 line-clamp-1">{log.videoTitle}</p>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800/40">
                    <Check className="w-3 h-3 text-emerald-400" />
                    {log.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SITE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="border-b border-neutral-800 pb-4">
            <h3 className="text-lg font-bold text-white">সাধারণ সাইট সেটিংস</h3>
            <p className="text-xs text-neutral-400 mt-1">
              ওয়েবসাইটের নাম, স্লোগান, নোটিশ বার ও টেলিগ্রাম চ্যানেল পরিবর্তন করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                ওয়েবসাইটের নাম (Site Name):
              </label>
              <input
                type="text"
                value={localSettings.siteName}
                onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                স্লোগান / ট্যাগলাইন:
              </label>
              <input
                type="text"
                value={localSettings.siteTagline}
                onChange={(e) => setLocalSettings({ ...localSettings, siteTagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-300">
                টপ নোটিশ / ঘোষণা বার (Announcement):
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400">
                <input
                  type="checkbox"
                  checked={localSettings.enableAnnouncement}
                  onChange={(e) => setLocalSettings({ ...localSettings, enableAnnouncement: e.target.checked })}
                  className="rounded accent-rose-600"
                />
                <span>নোটিশ চালু রাখুন</span>
              </label>
            </div>
            <input
              type="text"
              value={localSettings.announcement}
              onChange={(e) => setLocalSettings({ ...localSettings, announcement: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                টেলিগ্রাম চ্যানেল লিংক:
              </label>
              <input
                type="text"
                value={localSettings.telegramLink}
                onChange={(e) => setLocalSettings({ ...localSettings, telegramLink: e.target.value })}
                placeholder="https://t.me/yourchannel"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5 flex items-center justify-between">
                <span>অ্যাডমিন লগইন পাসওয়ার্ড / পিন (Admin Password):</span>
                <span className="text-[10px] text-amber-400 font-normal">ডিফল্ট: mominul</span>
              </label>
              <input
                type="text"
                value={localSettings.adminPin}
                onChange={(e) => setLocalSettings({ ...localSettings, adminPin: e.target.value })}
                placeholder="mominul"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>সাইট সেটিংস সেভ করুন</span>
          </button>
        </div>
      )}

      {/* Saved Toast Notification */}
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-2xl animate-bounce flex items-center gap-2 border border-emerald-400/40">
          <Check className="w-5 h-5" />
          <span>{savedToast}</span>
        </div>
      )}
    </div>
  );
};
