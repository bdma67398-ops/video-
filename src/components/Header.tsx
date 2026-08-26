import React, { useState } from 'react';
import { Flame, Search, Shield, Send, Sparkles, Video as VideoIcon, Radio, Share2, TrendingUp, Lock } from 'lucide-react';
import { SiteSettings } from '../types';

interface HeaderProps {
  siteSettings: SiteSettings;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenAdmin: () => void;
  isAdminOpen: boolean;
  categories: string[];
}

export const Header: React.FC<HeaderProps> = ({
  siteSettings,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onOpenAdmin,
  isAdminOpen,
  categories
}) => {
  const [showShareNotification, setShowShareNotification] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: siteSettings.siteName,
        text: 'সেরা ভাইরাল ভিডিও দেখুন এই সাইটে!',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShowShareNotification(true);
      setTimeout(() => setShowShareNotification(false), 2500);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 shadow-xl">
      {/* Announcement Bar */}
      {siteSettings.enableAnnouncement && siteSettings.announcement && (
        <div className="bg-gradient-to-r from-rose-950 via-neutral-900 to-rose-950 border-b border-rose-500/20 py-1.5 px-3 text-center text-xs sm:text-sm text-rose-200 flex items-center justify-center gap-2 overflow-hidden">
          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
          <span className="font-semibold text-rose-300">ঘোষণা:</span>
          <span className="truncate">{siteSettings.announcement}</span>
          {siteSettings.telegramLink && (
            <a
              href={siteSettings.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 hidden sm:inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors"
            >
              <Send className="w-2.5 h-2.5" />
              টেলিগ্রাম জয়েন
            </a>
          )}
        </div>
      )}

      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Live Badge */}
        <div className="w-full md:w-auto flex items-center justify-between gap-4">
          <div 
            onClick={() => onSelectCategory('all')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform">
                <Flame className="w-6 h-6 text-white animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 text-xs select-none">❤️</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-rose-400 transition-colors font-['Outfit',sans-serif]">
                  {siteSettings.siteName || 'ভাইরাল ভিডিও দেখুন'}
                </h1>
                <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">
                  <Radio className="w-2.5 h-2.5" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium line-clamp-1">
                {siteSettings.siteTagline || 'দ্রুততম স্পিডে আনলিমিটেড ভাইরাল ভিডিও দেখুন'}
              </p>
            </div>
          </div>

          {/* Mobile Share Action */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
              title="সাইট শেয়ার করুন"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full md:max-w-md relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="যেকোনো ভাইরাল ভিডিও, খবর বা নাটক খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-900/90 border border-neutral-800 focus:border-rose-500 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          {siteSettings.telegramLink && (
            <a
              href={siteSettings.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] border border-[#229ED9]/30 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              টেলিগ্রাম চ্যানেল
            </a>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-rose-400" />
            শেয়ার
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 border-t border-neutral-900 overflow-x-auto no-scrollbar flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>🔥 সব ভাইরাল ভিডিও</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {showShareNotification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>লিংক কপি করা হয়েছে! বন্ধুদের সাথে শেয়ার করুন</span>
        </div>
      )}
    </header>
  );
};
