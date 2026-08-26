import React, { useState, useEffect, useRef } from 'react';
import { MidrollAdGateConfig } from '../types';
import { Play, Lock, CheckCircle2, Clock, Sparkles, ExternalLink, ShieldAlert, Zap, ArrowRight } from 'lucide-react';

interface MidrollAdGateModalProps {
  config: MidrollAdGateConfig;
  isOpen: boolean;
  onAdCompleted: () => void;
  videoTitle: string;
  onDirectClick?: () => void;
}

export const MidrollAdGateModal: React.FC<MidrollAdGateModalProps> = ({
  config,
  isOpen,
  onAdCompleted,
  videoTitle,
  onDirectClick
}) => {
  const totalDuration = config.countdownSeconds || 20;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalDuration);
  const [adClicked, setAdClicked] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  const fallbackUrl = 'https://www.profitableratecpmnetwork.com/fhk12swps?key=431d1e23619240ac97ef4d6285054d6a';
  const targetUrl = config.directLinkUrl && config.directLinkUrl.trim().length > 0 && !config.directLinkUrl.includes('example.com')
    ? config.directLinkUrl
    : fallbackUrl;

  // Reset states whenever modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setSecondsRemaining(totalDuration);
      setAdClicked(false);
      setIsUnlocked(false);
      return;
    }

    setSecondsRemaining(totalDuration);
    setAdClicked(false);
    setIsUnlocked(false);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, totalDuration]);

  // When ad is clicked, start the 20-second active countdown timer
  const handleWatchAdClick = () => {
    // Open ad link in new tab immediately
    window.open(targetUrl, '_blank');
    if (onDirectClick) onDirectClick();

    setAdClicked(true);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsUnlocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // When traffic clicks "এখন ভিডিও দেখুন"
  const handleResumeVideo = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onAdCompleted();
  };

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - secondsRemaining) / totalDuration) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/95 backdrop-blur-lg animate-fadeIn select-none">
      <div 
        id="midroll-ad-gate-modal"
        className="relative w-full max-w-xl bg-neutral-900 border-2 border-rose-500 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-rose-950/90 overflow-hidden text-center"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-600/30 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Badge */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-600/20 border border-rose-500/50 text-rose-400 text-xs font-black uppercase tracking-wider shadow-inner">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>বিজ্ঞাপন বিরতি • Ad Break</span>
          </span>
        </div>

        {/* Required Main Title */}
        <h3 className="text-lg sm:text-2xl font-black text-white leading-tight mb-2">
          ফুল ভিডিও দেখতে হলে আপনাকে ২০ সেকেন্ড অ্যাড দেখতে হবে
        </h3>

        {/* Video Name */}
        <p className="text-xs sm:text-sm text-neutral-400 font-medium line-clamp-1 mb-4">
          🎬 {videoTitle}
        </p>

        {/* Content Box */}
        <div className="bg-neutral-950/90 rounded-2xl border border-neutral-800 p-4 sm:p-5 mb-5 shadow-inner">
          {!adClicked ? (
            /* Stage 1: Before clicking "অ্যাড দেখমু" */
            <div className="space-y-4 py-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
                <Lock className="w-7 h-7 animate-pulse" />
              </div>

              <div className="space-y-1">
                <p className="text-sm sm:text-base font-bold text-neutral-200">
                  নিচের <span className="text-amber-400 font-black">"অ্যাড দেখমু"</span> বাটনে ক্লিক করে ২০ সেকেন্ড অ্যাড দেখুন।
                </p>
                <p className="text-xs text-neutral-400">
                  অ্যাড দেখা শেষ হলে <span className="text-emerald-400 font-bold">"এখন ভিডিও দেখুন"</span> বাটন আসবে এবং ভিডিও আবার চলবে।
                </p>
              </div>

              {/* Glowing Primary CTA Button: "অ্যাড দেখমু" */}
              <button
                id="watch-ad-action-btn"
                type="button"
                onClick={handleWatchAdClick}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-rose-700 hover:from-amber-400 hover:to-rose-500 text-white font-black text-base sm:text-lg shadow-2xl shadow-rose-900/70 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer animate-pulse border border-white/20"
              >
                <Zap className="w-5 h-5 text-amber-200 fill-amber-200" />
                <span>অ্যাড দেখমু</span>
                <ExternalLink className="w-4 h-4 text-white/90" />
              </button>
            </div>
          ) : !isUnlocked ? (
            /* Stage 2: Ad clicked, 20-second active countdown */
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-center gap-2 text-amber-400 text-sm sm:text-base font-bold">
                <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                <span>অ্যাড দেখা হচ্ছে... অনুগ্রহ করে ২০ সেকেন্ড অপেক্ষা করুন</span>
              </div>

              {/* Active Countdown Big Display */}
              <div className="py-2">
                <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-neutral-900 border border-amber-500/40 text-white font-mono text-2xl sm:text-3xl font-black shadow-inner">
                  <span className="text-amber-400">{secondsRemaining}</span>
                  <span className="text-xs text-neutral-400 font-sans font-normal">সেকেন্ড বাকি</span>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-neutral-900 rounded-full h-3.5 overflow-hidden border border-neutral-800 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 rounded-full transition-all duration-1000 ease-linear shadow-md"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                <span>শুরু</span>
                <span className="text-amber-400 font-bold">{Math.round(progressPercent)}% সম্পন্ন</span>
                <span>আনলক</span>
              </div>

              {/* Waiting status */}
              <div className="py-2 px-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-400 text-xs flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>অ্যাড সাইটটি ওপেন হয়েছে। ২০ সেকেন্ড পূর্ণ হলেই ভিডিও আনলক হবে...</span>
              </div>
            </div>
          ) : (
            /* Stage 3: 20-second completed -> Ready to watch video */
            <div className="space-y-4 py-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/50">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-black">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>অ্যাড দেখা সফল হয়েছে!</span>
                </span>
                <h4 className="text-base sm:text-lg font-black text-white mt-1">
                  আপনার সম্পূর্ণ ভিডিওটি আনলক করা হয়েছে
                </h4>
                <p className="text-xs text-neutral-300">
                  নিচের বাটনে ক্লিক করে সম্পূর্ণ ভিডিওটি চালিয়ে যান।
                </p>
              </div>

              {/* Required Action Button: "এখন ভিডিও দেখুন" */}
              <button
                id="watch-video-now-btn"
                type="button"
                onClick={handleResumeVideo}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base sm:text-xl shadow-2xl shadow-emerald-950/80 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer animate-pulse border border-emerald-300/30"
              >
                <Play className="w-6 h-6 text-white fill-white" />
                <span>এখন ভিডিও দেখুন</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>এইচডি কোয়ালিটি ও দ্রুত স্ট্রিমিং নিশ্চিত করতে স্পনসর সাপোর্ট প্রয়োজন</span>
        </div>
      </div>
    </div>
  );
};
