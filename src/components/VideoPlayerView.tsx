import React, { useState, useRef, useEffect } from 'react';
import { Video, AdConfig } from '../types';
import { AdDisplay } from './AdDisplay';
import { getMediaBlobUrl } from '../utils/mediaStorage';
import { 
  ArrowLeft, ThumbsUp, Share2, Eye, Clock, Flame, 
  Sparkles, MessageSquare, Send, CheckCircle2, Play, 
  ExternalLink, Lock, Zap, ArrowRight, ShieldCheck, SendHorizontal
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
  telegramLink?: string;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  video,
  allVideos,
  adConfig,
  onBack,
  onSelectVideo,
  onVideoViewed,
  onAdTriggered,
  onAdCompleted,
  telegramLink = 'https://t.me/+6WMf5P3PMaowZjk1'
}) => {
  const [likesCount, setLikesCount] = useState(video.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [displayImage, setDisplayImage] = useState<string>(video.thumbnail);

  // 20-Second Ad Gate State Management
  const countdownDuration = video.adDuration || adConfig.midrollAdGate.countdownSeconds || 20;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(countdownDuration);
  const [adClicked, setAdClicked] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // Target ad url to monetize traffic
  const fallbackAdUrl = 'https://www.profitableratecpmnetwork.com/fhk12swps?key=431d1e23619240ac97ef4d6285054d6a';
  const targetAdUrl = adConfig.midrollAdGate.directLinkUrl && adConfig.midrollAdGate.directLinkUrl.trim().length > 0 && !adConfig.midrollAdGate.directLinkUrl.includes('example.com')
    ? adConfig.midrollAdGate.directLinkUrl
    : fallbackAdUrl;

  // Target Video / Telegram Link for "এখন ভিডিও দেখুন"
  const targetVideoDestination = (video.videoUrl && video.videoUrl.startsWith('http') && !video.videoUrl.includes('sample'))
    ? video.videoUrl
    : (video.directDownloadLink && video.directDownloadLink.startsWith('http'))
      ? video.directDownloadLink
      : (telegramLink || 'https://t.me/+6WMf5P3PMaowZjk1');

  // Comments state
  const [comments, setComments] = useState<Array<{ id: string; user: string; text: string; time: string }>>([
    { id: '1', user: 'রাকিব আহমেদ', text: 'অসাধারণ কনটেন্ট! অনেক ভালো লাগলো 🔥', time: '১০ মিনিট আগে' },
    { id: '2', user: 'তানভীর হোসাইন', text: 'ফুল ভিডিও দেখে শান্তি পেলাম, ধন্যবাদ!', time: '২৫ মিনিট আগে' },
    { id: '3', user: 'সুমাইয়া জাহান', text: 'টেলিগ্রামেও সব ভিডিওগুলো দেওয়া আছে দারুণ।', time: '১ ঘণ্টা আগে' }
  ]);
  const [newComment, setNewComment] = useState('');

  // When video changes, load image and reset 20s gate
  useEffect(() => {
    let isMounted = true;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSecondsRemaining(countdownDuration);
    setAdClicked(false);
    setIsUnlocked(false);
    setLikesCount(video.likes);
    setHasLiked(false);
    onVideoViewed(video.id);

    const resolveImage = async () => {
      if (video.blobId) {
        try {
          const fresh = await getMediaBlobUrl(video.blobId);
          if (fresh && isMounted) {
            setDisplayImage(fresh);
            return;
          }
        } catch (e) {
          console.warn('Could not retrieve image from storage', e);
        }
      }
      if (isMounted) {
        setDisplayImage(video.thumbnail);
      }
    };

    resolveImage();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [video.id, countdownDuration]);

  // Handle "অ্যাড দেখুন" button click
  const handleWatchAdClick = () => {
    // 1. Open the Ad link in a new tab immediately
    window.open(targetAdUrl, '_blank');
    onAdTriggered(video.id, 'watch_ad_click');

    // 2. Start 20s Countdown Timer
    setAdClicked(true);
    setSecondsRemaining(countdownDuration);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsUnlocked(true);
          onAdCompleted(video.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle "এখন ভিডিও দেখুন" button click
  const handleWatchVideoNow = () => {
    // Open full video / telegram link
    window.open(targetVideoDestination, '_blank');
  };

  const handleLike = () => {
    if (!hasLiked) {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    } else {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      { id: Date.now().toString(), user: 'ব্যবহারকারী', text: newComment.trim(), time: 'এইমাত্র' },
      ...comments
    ]);
    setNewComment('');
  };

  const progressPercent = Math.min(100, Math.max(0, ((countdownDuration - secondsRemaining) / countdownDuration) * 100));

  const relatedVideos = allVideos
    .filter(v => v.id !== video.id)
    .slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all text-xs sm:text-sm font-semibold active:scale-95 cursor-pointer shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 text-rose-500" />
        <span>সকল পোস্ট দেখুন (Back to Home)</span>
      </button>

      {/* Top Banner Ad Spot */}
      {adConfig.bannerAd.enabled && adConfig.bannerAd.playerUnderBannerCode && (
        <div className="mb-5">
          <AdDisplay
            code={adConfig.bannerAd.playerUnderBannerCode}
            type="header"
            title="⚡ হাই স্পিডে ফুল ভিডিও দেখতে ক্লিক করুন!"
            description="স্পনসর অফার চেক করুন এবং বোনাস উপভোগ করুন।"
            targetUrl={adConfig.bannerAd.customHeaderLink || targetAdUrl}
            badgeText="স্পনসরড অফার"
          />
        </div>
      )}

      {/* Main Grid: Post Card & Unlocker + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Image Preview & 20s Ad Unlocker */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* HD Image / Poster Container */}
          <div className="relative rounded-3xl overflow-hidden bg-neutral-950 border-2 border-neutral-800 shadow-2xl shadow-rose-950/20">
            {/* Blurred ambient background to fit any aspect ratio without cutting */}
            <div className="relative w-full overflow-hidden flex items-center justify-center bg-neutral-950 min-h-[300px] sm:min-h-[420px] max-h-[600px]">
              {/* Soft background glow from the image itself */}
              <div 
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-25 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${displayImage})` }}
              />

              {/* Full Image Display - object-contain prevents any cropping */}
              <img
                src={displayImage}
                alt={video.title}
                className="relative z-10 w-full max-h-[560px] object-contain mx-auto"
              />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              {/* Overlay Badges */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <span className="bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-rose-600/40">
                  <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                  <span>{video.category}</span>
                </span>
                {video.isViral && (
                  <span className="bg-amber-500 text-neutral-950 text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                    🔥 ভাইরাল
                  </span>
                )}
              </div>

              {/* Center Lock / Play Visual Indicator */}
              <div 
                onClick={!isUnlocked ? handleWatchAdClick : handleWatchVideoNow}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 hover:bg-black/30 cursor-pointer transition-all p-4 text-center group"
              >
                {!isUnlocked ? (
                  <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-2xl shadow-rose-600/80 border-2 border-white/60 transform group-hover:scale-110 active:scale-95 transition-transform mb-3">
                    <Lock className="w-8 sm:w-10 h-8 sm:h-10 text-white animate-pulse" />
                  </div>
                ) : (
                  <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/80 border-2 border-white transform group-hover:scale-110 active:scale-95 transition-transform mb-3">
                    <Play className="w-8 sm:w-10 h-8 sm:h-10 fill-current translate-x-0.5 text-white" />
                  </div>
                )}
                <span className="px-4 py-1.5 rounded-full bg-black/80 border border-neutral-700 text-white text-xs sm:text-sm font-bold shadow-xl">
                  {!isUnlocked ? '🔒 ফুল ভিডিও দেখতে নিচে ২০ সে. অ্যাড দেখুন' : '✅ ভিডিও আনলক হয়েছে - দেখতে ক্লিক করুন'}
                </span>
              </div>
            </div>

            {/* Poster Info Bar */}
            <div className="p-4 bg-neutral-900/95 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{(likesCount * 12 + 450).toLocaleString('bn-BD')} ভিউ</span>
                </span>
                <span>•</span>
                <span>আপলোডকারী: <strong className="text-white">{video.uploaderName || 'অফিসিয়াল টিম'}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-neutral-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{video.createdAt}</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              ⭐ 20-SECOND AD WATCH & UNLOCK SECTION (MAIN CORE) ⭐
             ======================================================== */}
          <div 
            id="ad-unlock-section"
            className="relative rounded-3xl bg-neutral-900 border-2 border-rose-500/80 p-5 sm:p-7 shadow-2xl shadow-rose-950/50 overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-24 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header Badge */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>ভিডিও আনলক সিস্টেম • Video Unlock</span>
              </span>
            </div>

            {/* Main Instruction Headline */}
            <h2 className="text-lg sm:text-2xl font-black text-white text-center leading-snug mb-2">
              ফুল ভিডিও দেখতে হলে ২০ সেকেন্ড অ্যাড দেখতে হবে
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 text-center max-w-xl mx-auto mb-5">
              {!isUnlocked 
                ? 'নিচের "অ্যাড দেখুন" বাটনে ক্লিক করে ২০ সেকেন্ড অপেক্ষা করুন। এরপর "এখন ভিডিও দেখুন" বাটনে ক্লিক করলেই আপনার কাঙ্ক্ষিত ফুল ভিডিও ওপেন হয়ে যাবে।'
                : 'অ্যাড দেখা সফল হয়েছে! নিচের "এখন ভিডিও দেখুন" বাটনে ক্লিক করে সম্পূর্ণ ভিডিও উপভোগ করুন।'
              }
            </p>

            {/* Stage 1: Before clicking "অ্যাড দেখুন" */}
            {!adClicked && !isUnlocked && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md mb-2">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-200">
                    অ্যাড দেখতে নিচের <span className="text-amber-400 font-bold">"অ্যাড দেখুন"</span> বাটনে চাপুন
                  </p>
                </div>

                {/* Primary Button: "অ্যাড দেখুন" */}
                <button
                  id="btn-watch-ad"
                  type="button"
                  onClick={handleWatchAdClick}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-rose-700 hover:from-amber-400 hover:to-rose-500 text-white font-black text-base sm:text-xl shadow-2xl shadow-rose-900/60 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer animate-pulse border border-white/20"
                >
                  <Zap className="w-6 h-6 text-amber-200 fill-amber-200" />
                  <span>👉 অ্যাড দেখুন</span>
                  <ExternalLink className="w-5 h-5 text-white/90" />
                </button>
              </div>
            )}

            {/* Stage 2: Active 20-Second Countdown Timer */}
            {adClicked && !isUnlocked && (
              <div className="space-y-4 p-5 rounded-2xl bg-neutral-950/90 border border-amber-500/40 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-400 text-sm sm:text-base font-bold">
                  <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                  <span>অ্যাড দেখা হচ্ছে... অনুগ্রহ করে ২০ সেকেন্ড অপেক্ষা করুন</span>
                </div>

                {/* Big Seconds Left Counter */}
                <div className="py-2">
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-neutral-900 border border-amber-500/50 text-white font-mono text-3xl sm:text-4xl font-black shadow-inner">
                    <span className="text-amber-400">{secondsRemaining}</span>
                    <span className="text-xs text-neutral-400 font-sans font-normal">সেকেন্ড বাকি</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-900 rounded-full h-4 overflow-hidden border border-neutral-800 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 rounded-full transition-all duration-1000 ease-linear shadow-md"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>০ সে.</span>
                  <span className="text-amber-400 font-bold">{Math.round(progressPercent)}% সম্পন্ন</span>
                  <span>২০ সে.</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/90 text-neutral-400 text-xs flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>বিজ্ঞাপন সাইটটি ওপেন হয়েছে। ২০ সেকেন্ড শেষ হলেই ভিডিও আনলক হবে...</span>
                </div>
              </div>
            )}

            {/* Stage 3: Ad Finished -> Unlocked "এখন ভিডিও দেখুন" Button */}
            {isUnlocked && (
              <div className="space-y-4 p-5 rounded-2xl bg-neutral-950/90 border border-emerald-500/60 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/50">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>অ্যাড দেখা সফল হয়েছে!</span>
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    আপনার সম্পূর্ণ ভিডিওটি প্রস্তুত!
                  </h3>
                </div>

                {/* The Unlocked Watch Video Button */}
                <button
                  id="btn-watch-video-now"
                  type="button"
                  onClick={handleWatchVideoNow}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base sm:text-xl shadow-2xl shadow-emerald-950/80 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer animate-pulse border border-emerald-300/40"
                >
                  <Play className="w-6 h-6 text-white fill-white" />
                  <span>🎬 এখন ভিডিও দেখুন</span>
                  <ArrowRight className="w-6 h-6 text-white" />
                </button>
              </div>
            )}

            {/* Direct Telegram Channel Button */}
            <div className="mt-4 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-neutral-400 text-center sm:text-left">
                সরাসরি টেলিগ্রাম চ্যানেলে সব ভাইরাল ভিডিও দেখতে:
              </span>
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
              >
                <SendHorizontal className="w-4 h-4" />
                <span>টেলিগ্রাম চ্যানেল জয়েন করুন ➔</span>
              </a>
            </div>
          </div>

          {/* Post Title, Description & Action Buttons */}
          <div className="rounded-3xl bg-neutral-900/90 border border-neutral-800 p-5 sm:p-6 space-y-4">
            <h1 className="text-lg sm:text-2xl font-bold text-white leading-snug">
              {video.title}
            </h1>
            
            <p className="text-sm text-neutral-300 leading-relaxed">
              {video.description}
            </p>

            {/* Like, Share, Telegram Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLike}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                    hasLiked
                      ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                  <span>{(likesCount).toLocaleString('bn-BD')} লাইক</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-rose-400" />
                  <span>শেয়ার করুন</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>নিরাপদ ও ভাইরাস মুক্ত লিংক</span>
              </div>
            </div>

            {showShareToast && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-fadeIn">
                ✓ লিংক কপি করা হয়েছে! বন্ধুদের সাথে শেয়ার করুন।
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="rounded-3xl bg-neutral-900/90 border border-neutral-800 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
              <MessageSquare className="w-4 h-4 text-rose-500" />
              <span>মন্তব্য ও প্রতিক্রিয়া ({comments.length})</span>
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="আপনার মন্তব্য লিখুন..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>পোস্ট</span>
              </button>
            </form>

            {/* Comment List */}
            <div className="space-y-3 pt-2">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-400">{c.user}</span>
                    <span className="text-neutral-500 text-[10px]">{c.time}</span>
                  </div>
                  <p className="text-xs text-neutral-300">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Related Videos & Banner Ad */}
        <div className="space-y-6">
          {/* Telegram Channel Promo Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-sky-950/80 to-neutral-900 border border-sky-600/40 shadow-xl space-y-3 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/40">
              <SendHorizontal className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">অফিসিয়াল টেলিগ্রাম চ্যানেল</h3>
            <p className="text-xs text-neutral-300">
              সব নতুন নতুন ভাইরাল ভিডিও সবার আগে দেখতে আমাদের টেলিগ্রামে জয়েন করুন!
            </p>
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/30 active:scale-95 transition-all"
            >
              টেলিগ্রামে জয়েন করুন ➔
            </a>
          </div>

          {/* Sidebar Banner Ad */}
          {adConfig.bannerAd.enabled && adConfig.bannerAd.sidebarBannerCode && (
            <AdDisplay
              code={adConfig.bannerAd.sidebarBannerCode}
              type="sidebar"
              title="🎁 স্পেশাল মেগা বোনাস অফার!"
              description="ক্লিক করে ফ্রি রিওয়ার্ড ক্লেইম করুন।"
              targetUrl={adConfig.bannerAd.customHeaderLink || targetAdUrl}
              badgeText="স্পনসরড অফার"
            />
          )}

          {/* Related Posts Grid */}
          <div className="rounded-3xl bg-neutral-900/90 border border-neutral-800 p-4 sm:p-5 space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>অন্যান্য ভাইরাল ভিডিওসমূহ</span>
            </h3>

            <div className="space-y-3">
              {relatedVideos.map((rVideo) => (
                <div
                  key={rVideo.id}
                  onClick={() => onSelectVideo(rVideo)}
                  className="group flex gap-3 p-2 rounded-2xl bg-neutral-950/60 hover:bg-neutral-800/60 border border-neutral-800/80 hover:border-rose-500/40 transition-all cursor-pointer"
                >
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-neutral-900 shrink-0">
                    <img
                      src={rVideo.thumbnail}
                      alt={rVideo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10">
                      <Lock className="w-3.5 h-3.5 text-white/90" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <h4 className="text-xs font-bold text-neutral-200 group-hover:text-rose-400 line-clamp-2 leading-snug">
                      {rVideo.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                      <span>{(rVideo.views).toLocaleString('bn-BD')} ভিউ</span>
                      <span>•</span>
                      <span className="text-rose-400">{rVideo.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
