import React, { useState, useRef, useEffect } from 'react';
import { Video, AdConfig } from '../types';
import { MidrollAdGateModal } from './MidrollAdGateModal';
import { AdDisplay } from './AdDisplay';
import { getMediaBlobUrl } from '../utils/mediaStorage';
import { 
  ArrowLeft, ThumbsUp, Share2, Download, Eye, Clock, Flame, 
  Sparkles, MessageSquare, Send, CheckCircle2, ShieldCheck, Play, 
  Volume2, VolumeX, Maximize, AlertCircle, RotateCcw
} from 'lucide-react';

interface VideoPlayerViewProps {
  video: Video;
  allVideos: Video[];
  adConfig: AdConfig;
  onBack: () => void;
  onSelectVideo: (video: Video) => void;
  onVideoViewed: (videoId: string) => void;
  onAdTriggered: (videoId: string, type: string) => void;
  onAdCompleted: (videoId: string) => void;
}

// Convert any YouTube, Vimeo, Facebook, Google Drive or Dailymotion video URLs to embeddable player links
function getEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If user pasted a full <iframe ... src="..."> code
  const iframeSrcMatch = trimmed.match(/<iframe.*?src=["'](.*?)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    return iframeSrcMatch[1];
  }

  // YouTube URLs (standard watch, shorts, share youtu.be, embed)
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&playsinline=1&rel=0&enablejsapi=1`;
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  // Google Drive preview link
  const gdriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
  }

  // Facebook video links
  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
    if (trimmed.includes('facebook.com/plugins/video.php')) {
      return trimmed;
    }
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=0&autoplay=1`;
  }

  // Dailymotion
  const dailyMatch = trimmed.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
  if (dailyMatch && dailyMatch[1]) {
    return `https://www.dailymotion.com/embed/video/${dailyMatch[1]}?autoplay=1`;
  }

  return null;
}

// Fallback high-speed CDN video streams (Multiple global CDNs)
const CDN_FALLBACK_STREAMS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
];

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  video,
  allVideos,
  adConfig,
  onBack,
  onSelectVideo,
  onVideoViewed,
  onAdTriggered,
  onAdCompleted
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAdGateOpen, setIsAdGateOpen] = useState(false);
  const [adGateCompletedForVideo, setAdGateCompletedForVideo] = useState(false);
  const [hasTriggeredAdThisPlay, setHasTriggeredAdThisPlay] = useState(false);
  
  // Safe initial URL resolution
  const getInitialSafeUrl = () => {
    if (!video.videoUrl || video.videoUrl.startsWith('blob:')) {
      return CDN_FALLBACK_STREAMS[0];
    }
    return video.videoUrl;
  };

  const [activeUrl, setActiveUrl] = useState<string>(getInitialSafeUrl);
  const [likesCount, setLikesCount] = useState(video.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedServer, setSelectedServer] = useState<'main' | 'backup1' | 'backup2'>('main');
  
  // Comments state
  const [comments, setComments] = useState<Array<{ id: string; user: string; text: string; time: string }>>([
    { id: '1', user: 'রাকিব আহমেদ', text: 'অসাধারণ ভিডিও! অনেক হাসলাম ভাই 😂🔥', time: '১০ মিনিট আগে' },
    { id: '2', user: 'তানভীর হোসাইন', text: 'পুরো ঘটনাটা সত্যি অবিশ্বাস্য ছিল!', time: '২৫ মিনিট আগে' },
    { id: '3', user: 'সুমাইয়া জাহান', text: 'সবাইকে দেখার অনুরোধ রইল, দারুণ লাগলো।', time: '১ ঘণ্টা আগে' }
  ]);
  const [newComment, setNewComment] = useState('');

  // Determine if embed URL applies
  const embedUrl = getEmbedUrl(activeUrl) || (video.videoType === 'youtube' || video.videoType === 'embed' ? activeUrl : null);

  // Initialize and validate video source when video changes
  useEffect(() => {
    let isMounted = true;
    setLoadError(false);
    setIsBuffering(false);
    setIsPlaying(false);
    setIsMuted(false);
    setSelectedServer('main');

    const resolveVideoUrl = async () => {
      let candidateUrl = video.videoUrl;

      // Check if this video has a local blob in IndexedDB
      if (video.blobId) {
        try {
          const fresh = await getMediaBlobUrl(video.blobId);
          if (fresh && isMounted) {
            candidateUrl = fresh;
          }
        } catch (e) {
          console.warn('Could not load IndexedDB blob on this device', e);
        }
      }

      // If URL is empty or dead blob URL, use reliable CDN stream immediately
      if (!candidateUrl || candidateUrl.startsWith('blob:')) {
        candidateUrl = CDN_FALLBACK_STREAMS[0];
      }

      if (isMounted) {
        setActiveUrl(candidateUrl);
      }
    };

    resolveVideoUrl();

    setAdGateCompletedForVideo(false);
    setHasTriggeredAdThisPlay(false);
    setIsAdGateOpen(false);
    setLikesCount(video.likes);
    setHasLiked(false);
    onVideoViewed(video.id);

    // Scroll to player view on top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Attempt video playback safely with automatic fallback for mobile
    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().then(() => {
          if (isMounted) setIsPlaying(true);
        }).catch(() => {
          // If browser policy blocks sound on initial load, play muted so user can tap to unmute
          if (videoRef.current && isMounted) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => {
              if (isMounted) setIsPlaying(true);
            }).catch(() => {
              if (isMounted) setIsPlaying(false);
            });
          }
        });
      }
    }, 250);

    // If embed/youtube type, schedule midroll ad trigger at triggerSeconds (7s)
    let iframeTimer: any = null;
    if (embedUrl && adConfig.midrollAdGate.enabled && video.midrollAdEnabled) {
      const triggerSec = adConfig.midrollAdGate.triggerSeconds || 7;
      iframeTimer = setTimeout(() => {
        if (isMounted) {
          setHasTriggeredAdThisPlay(true);
          setIsAdGateOpen(true);
          onAdTriggered(video.id, 'midroll_gate');
        }
      }, triggerSec * 1000);
    }

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (iframeTimer) clearTimeout(iframeTimer);
    };
  }, [video.id, video.videoUrl, video.blobId]);

  // Handle Video Time Update for 7-second Midroll Ad Gate
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    const triggerSec = adConfig.midrollAdGate.triggerSeconds || 7;

    // Trigger Ad Gate at 7 seconds if enabled and not already completed
    if (
      adConfig.midrollAdGate.enabled &&
      video.midrollAdEnabled &&
      !adGateCompletedForVideo &&
      !hasTriggeredAdThisPlay &&
      current >= triggerSec
    ) {
      // Pause video immediately
      videoRef.current.pause();
      setIsPlaying(false);
      setHasTriggeredAdThisPlay(true);
      setIsAdGateOpen(true);
      onAdTriggered(video.id, 'midroll_gate');
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setLoadError(false);
    setIsBuffering(false);
  };

  const handleVideoError = async () => {
    // If local blob, try to retrieve fresh blob
    if (video.blobId) {
      const fresh = await getMediaBlobUrl(video.blobId);
      if (fresh && fresh !== activeUrl) {
        setActiveUrl(fresh);
        return;
      }
    }

    // Switch to first reliable CDN fallback stream
    if (activeUrl !== CDN_FALLBACK_STREAMS[0]) {
      setActiveUrl(CDN_FALLBACK_STREAMS[0]);
      setSelectedServer('backup1');
    } else if (activeUrl !== CDN_FALLBACK_STREAMS[1]) {
      setActiveUrl(CDN_FALLBACK_STREAMS[1]);
      setSelectedServer('backup2');
    } else {
      setLoadError(true);
    }
  };

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      }).catch(() => {
        // If autoplay with sound is blocked, attempt with mute
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          }).catch(() => {});
        }
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSwitchServer = (server: 'main' | 'backup1' | 'backup2') => {
    setSelectedServer(server);
    setLoadError(false);
    setIsBuffering(false);
    if (server === 'main') {
      setActiveUrl(video.videoUrl || CDN_FALLBACK_STREAMS[0]);
    } else if (server === 'backup1') {
      setActiveUrl(CDN_FALLBACK_STREAMS[0]);
    } else {
      setActiveUrl(CDN_FALLBACK_STREAMS[1]);
    }
  };

  const handleAdGateCompleted = () => {
    setIsAdGateOpen(false);
    setAdGateCompletedForVideo(true);
    onAdCompleted(video.id);

    // Auto resume playback safely
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // If blocked by browser, user can click play
      });
    }
  };

  const handleLike = () => {
    if (!hasLiked) {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
    } else {
      setLikesCount((prev) => prev - 1);
      setHasLiked(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    }
  };

  const handleDirectLinkClick = (type: 'download' | 'server2' | 'hd') => {
    onAdTriggered(video.id, `direct_link_${type}`);
    const directUrl = adConfig.directLink.url || video.directDownloadLink || 'https://example.com/direct-offer';
    window.open(directUrl, '_blank');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      {
        id: Date.now().toString(),
        user: 'দর্শক (আপনি)',
        text: newComment.trim(),
        time: 'এইমাত্র'
      },
      ...comments
    ]);
    setNewComment('');
  };

  const relatedVideos = allVideos.filter(v => v.id !== video.id).slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 animate-fadeIn">
      {/* 7-Second Ad Gate Modal */}
      <MidrollAdGateModal
        config={adConfig.midrollAdGate}
        isOpen={isAdGateOpen}
        onAdCompleted={handleAdGateCompleted}
        videoTitle={video.title}
        onDirectClick={() => onAdTriggered(video.id, 'midroll_sponsor_click')}
      />

      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-rose-500" />
          <span>সকল ভিডিওতে ফিরে যান</span>
        </button>

        <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/70 border border-rose-800/40 px-3 py-1.5 rounded-full font-bold">
          <Flame className="w-3.5 h-3.5" />
          {video.category}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Player Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Video Container */}
          <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-neutral-800 shadow-2xl shadow-black/90">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  key={activeUrl}
                  ref={videoRef}
                  src={activeUrl}
                  poster={video.thumbnail}
                  autoPlay
                  playsInline
                  webkit-playsinline="true"
                  controls
                  preload="auto"
                  controlsList="nodownload"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onWaiting={() => setIsBuffering(true)}
                  onPlaying={() => {
                    setIsPlaying(true);
                    setIsBuffering(false);
                    setLoadError(false);
                  }}
                  onCanPlay={() => {
                    setIsBuffering(false);
                    setLoadError(false);
                  }}
                  onError={handleVideoError}
                  onPlay={() => {
                    setIsPlaying(true);
                    setLoadError(false);
                  }}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-full object-contain bg-black"
                >
                  <source src={activeUrl} type="video/mp4" />
                  <source src={CDN_FALLBACK_STREAMS[0]} type="video/mp4" />
                  <source src={CDN_FALLBACK_STREAMS[1]} type="video/mp4" />
                </video>

                {/* Error Fallback Notice */}
                {loadError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/95 text-center p-6 z-20">
                    <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
                    <p className="text-white font-bold text-sm">ভিডিও লোড হতে সমস্যা হয়েছে</p>
                    <button
                      type="button"
                      onClick={() => {
                        setLoadError(false);
                        setActiveUrl(CDN_FALLBACK_STREAMS[0]);
                        if (videoRef.current) {
                          videoRef.current.load();
                          videoRef.current.play().catch(() => {});
                        }
                      }}
                      className="mt-3 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ব্যাকআপ সার্ভার দিয়ে চালান</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Direct Link Floating Button on Video */}
            {adConfig.directLink.enabled && (
              <div className="absolute top-3 right-3 z-10">
                <button
                  type="button"
                  onClick={() => handleDirectLinkClick('server2')}
                  className="bg-gradient-to-r from-amber-500 via-rose-600 to-rose-700 hover:from-amber-400 hover:to-rose-600 text-white text-[11px] sm:text-xs font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-xl shadow-black/80 flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 border border-white/20 animate-pulse cursor-pointer"
                  title="ডাইরেক্ট লিংক"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                  <span>{adConfig.directLink.videoBadgeText || '⚡ ডাইরেক্ট লিংক / হাই স্পিড ➜'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Streaming Server Switcher Bar for Seamless Playback */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
            <span className="text-neutral-400 font-semibold flex items-center gap-1.5 pl-1">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>স্ট্রিমিং সার্ভার:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSwitchServer('main')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedServer === 'main'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                ⚡ সার্ভার ১ (মেইন)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchServer('backup1')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedServer === 'backup1'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                🚀 সার্ভার ২ (ফাস্ট)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchServer('backup2')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedServer === 'backup2'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                🌐 সার্ভার ৩ (CDN)
              </button>
            </div>
          </div>

          {/* Video Title and Metadata */}
          <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                ট্রেন্ডিং ভাইরাল
              </span>
              <span className="bg-neutral-800 text-neutral-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {video.category}
              </span>
              <span className="text-neutral-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {video.createdAt}
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-bold text-white leading-snug">
              {video.title}
            </h1>

            {/* Stats and Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-4 text-xs sm:text-sm text-neutral-300">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>{(video.views).toLocaleString('bn-BD')} ভিউ</span>
                </div>
                <div className="text-neutral-500">•</div>
                <div className="text-neutral-400">
                  আপলোডকারী: <span className="text-white font-semibold">{video.uploaderName || 'অ্যাডমিন'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLike}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    hasLiked
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                  <span>{(likesCount).toLocaleString('bn-BD')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs sm:text-sm font-bold transition-all"
                >
                  <Share2 className="w-4 h-4 text-rose-400" />
                  <span>শেয়ার</span>
                </button>
              </div>
            </div>

            {/* Direct Link Action Buttons */}
            {adConfig.directLink.enabled && (
              <div className="mt-4 pt-4 border-t border-neutral-800">
                <div className="text-xs font-bold text-amber-400 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ডাউনলোড ও হাই-স্পিড প্লেব্যাক লিংক:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDirectLinkClick('download')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{adConfig.directLink.downloadButtonText || '📥 HD ডাউনলোড করুন'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectLinkClick('server2')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{adConfig.directLink.fastServerButtonText || '⚡ সার্ভার ২ (হাই-স্পিড)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectLinkClick('hd')}
                    className="w-full py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>{adConfig.directLink.hdQualityButtonText || '💎 1080p ফুল কোয়ালিটি'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Under-Player Banner Ad */}
          {adConfig.bannerAd.enabled && (
            <AdDisplay
              code={adConfig.bannerAd.playerUnderBannerCode}
              type="banner"
              title="⚡ দ্রুততম স্পিডে আনলিমিটেড ভিডিও স্ট্রিমিং ও ডাউনলোড"
              description="কোনো বাফারিং ছাড়া যেকোনো ভিডিও ফুল স্পিডে দেখতে ক্লিক করুন।"
              targetUrl={adConfig.directLink.url}
              badgeText="প্লেয়ার স্পনসর ব্যানার"
              onAdClick={() => onAdTriggered(video.id, 'player_under_banner')}
            />
          )}

          {/* Video Description */}
          <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4">
            <h3 className="text-sm font-bold text-neutral-200 mb-2">ভিডিওর বিবরণ:</h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {video.description}
            </p>

            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-neutral-800/60">
                {video.tags.map((tag, idx) => (
                  <span key={idx} className="text-[11px] text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                মন্তব্যসমূহ ({comments.length})
              </h3>
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="আপনার মন্তব্য লিখুন..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>পাঠান</span>
              </button>
            </form>

            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-rose-400">{comment.user}</span>
                    <span className="text-[10px] text-neutral-500">{comment.time}</span>
                  </div>
                  <p className="text-xs text-neutral-300">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column (Related Videos & Native/Sidebar Ads) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Sidebar Banner Ad */}
          {adConfig.bannerAd.enabled && (
            <AdDisplay
              code={adConfig.bannerAd.sidebarBannerCode}
              type="sidebar"
              title="🎁 আজকের মেগা অফার ও রিওয়ার্ড"
              description="সরাসরি সাইট ভিজিট করে আকর্ষণীয় পুরষ্কার বুঝে নিন।"
              targetUrl={adConfig.directLink.url}
              badgeText="সাইডবার বিজ্ঞাপন"
              onAdClick={() => onAdTriggered(video.id, 'sidebar_banner')}
            />
          )}

          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
            <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              আরও ভাইরাল ভিডিও দেখুন
            </h3>
          </div>

          <div className="space-y-3">
            {relatedVideos.map((relVid, index) => (
              <React.Fragment key={relVid.id}>
                <div
                  onClick={() => onSelectVideo(relVid)}
                  className="group flex gap-3 p-2 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/90 border border-neutral-800/80 hover:border-rose-500/40 cursor-pointer transition-all"
                >
                  <div className="relative aspect-video w-32 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-950">
                    <img
                      src={relVid.thumbnail}
                      alt={relVid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white font-mono px-1.5 py-0.2 rounded font-bold">
                      {relVid.duration}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-2 leading-tight">
                      {relVid.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
                      <span>{(relVid.views).toLocaleString('bn-BD')} ভিউ</span>
                      <span>•</span>
                      <span>{relVid.category}</span>
                    </div>
                  </div>
                </div>

                {/* Insert Native Banner after 2nd related video */}
                {index === 1 && adConfig.nativeBanner.enabled && (
                  <AdDisplay
                    code={adConfig.nativeBanner.code}
                    type="native"
                    title={adConfig.nativeBanner.title}
                    description={adConfig.nativeBanner.description}
                    imageUrl={adConfig.nativeBanner.customImage}
                    targetUrl={adConfig.nativeBanner.customLink}
                    ctaText={adConfig.nativeBanner.customCta}
                    badgeText="স্পনসরড অফার"
                    onAdClick={() => onAdTriggered(video.id, 'related_native_ad')}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {showShareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>ভিডিও লিংক কপি করা হয়েছে!</span>
        </div>
      )}
    </div>
  );
};
