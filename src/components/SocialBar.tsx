import React, { useState } from 'react';
import { SocialBarAdConfig } from '../types';
import { Bell, X, ExternalLink, Sparkles } from 'lucide-react';

interface SocialBarProps {
  config: SocialBarAdConfig;
  onAdClick?: () => void;
}

export const SocialBar: React.FC<SocialBarProps> = ({ config, onAdClick }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!config.enabled || !isOpen) return null;

  const handleClick = () => {
    if (onAdClick) onAdClick();
    if (config.customLink) {
      window.open(config.customLink, '_blank');
    }
  };

  return (
    <div 
      id="social-bar-widget"
      className={`fixed z-40 p-3 max-w-md w-full sm:w-auto transition-all duration-300 animate-slideUp ${
        config.position === 'bottom-left' 
          ? 'bottom-4 left-4' 
          : config.position === 'top-bar'
          ? 'top-16 right-4'
          : 'bottom-4 right-4'
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900/95 border border-rose-500/50 p-3.5 shadow-2xl shadow-rose-950/60 backdrop-blur-md flex items-start gap-3">
        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-white rounded-full bg-neutral-800/60 hover:bg-neutral-700 transition-colors"
          title="বিজ্ঞাপন বন্ধ করুন"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Icon / Avatar */}
        <div className="flex-shrink-0 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white text-lg shadow-md shadow-rose-600/30">
            {config.customIcon || <Bell className="w-5 h-5 animate-bounce" />}
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-rose-950 text-rose-300 border border-rose-800/50">
              {config.customBadge || 'নতুন ভাইরাল'}
            </span>
            <span className="text-[11px] text-neutral-400">এইমাত্র</span>
          </div>

          <h5 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
            {config.customTitle || '🔥 ১টি নতুন ভাইরাল সিক্রেট ভিডিও যুক্ত হয়েছে!'}
          </h5>
          <p className="text-[11px] sm:text-xs text-neutral-300 line-clamp-1 mt-0.5">
            {config.customMessage || 'এখনই সম্পূর্ণ ভিডিও ক্লিপটি দেখুন আনকাট ভার্সন সহ...'}
          </p>

          <button
            type="button"
            onClick={handleClick}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-3 py-1 rounded-lg border border-amber-400/30 transition-all active:scale-95"
          >
            <span>{config.customButtonText || 'এখনই দেখুন ➔'}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
