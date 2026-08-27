import React from 'react';
import { Video, AdConfig } from '../types';
import { AdDisplay } from './AdDisplay';
import { Play, Eye, Flame, Clock, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

interface VideoGridProps {
  videos: Video[];
  adConfig: AdConfig;
  onSelectVideo: (video: Video) => void;
  selectedCategory: string;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  adConfig,
  onSelectVideo,
  selectedCategory
}) => {
  if (videos.length === 0) {
    return (
      <div className="py-20 text-center text-neutral-400">
        <Flame className="w-12 h-12 text-rose-500/50 mx-auto mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-neutral-200">কোনো ভিডিও পাওয়া যায়নি!</h3>
        <p className="text-xs text-neutral-400 mt-1">অন্য ক্যাটাগরি বা সার্চ দিয়ে চেষ্টা করুন।</p>
      </div>
    );
  }

  // Interleave videos with Native Banner Ads according to frequency
  const frequency = adConfig.nativeBanner.frequency || 3;
  const items: Array<{ type: 'video' | 'ad'; data?: Video; key: string }> = [];

  videos.forEach((video, index) => {
    items.push({ type: 'video', data: video, key: `vid-${video.id}` });
    
    if (adConfig.nativeBanner.enabled && (index + 1) % frequency === 0) {
      items.push({ type: 'ad', key: `ad-${index}` });
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Header Banner Ad if enabled */}
      {adConfig.bannerAd.enabled && adConfig.bannerAd.headerBannerCode && (
        <div className="mb-6">
          <AdDisplay
            code={adConfig.bannerAd.headerBannerCode}
            type="header"
            title="⚡ দ্রুততম স্পিডে আনলিমিটেড ভাইরাল ভিডিও ও মুভি স্ট্রিমিং সার্ভার!"
            description="ক্লিক করুন এবং হাই-স্পিডে উপভোগ করুন।"
            targetUrl={adConfig.bannerAd.customHeaderLink || adConfig.directLink.url}
            badgeText="টপ স্পনসর ব্যানার"
          />
        </div>
      )}

      {/* Grid Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
              <span>{selectedCategory === 'all' ? '🔥 আজকের সেরা ভাইরাল ভিডিও কালেকশন' : selectedCategory}</span>
              <span className="text-xs font-normal text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/40">
                {videos.length} টি ভিডিও
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-400">
              সোশ্যাল মিডিয়ায় ট্রেন্ডিং থাকা সব নতুন ভিডিও এক জায়গায়
            </p>
          </div>
        </div>
      </div>

      {/* Video + Native Ad Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {items.map((item) => {
          if (item.type === 'ad') {
            return (
              <div key={item.key} className="h-full">
                <AdDisplay
                  code={adConfig.nativeBanner.code}
                  type="native"
                  title={adConfig.nativeBanner.title}
                  description={adConfig.nativeBanner.description}
                  imageUrl={adConfig.nativeBanner.customImage}
                  targetUrl={adConfig.nativeBanner.customLink}
                  ctaText={adConfig.nativeBanner.customCta}
                  badgeText="স্পনসরড অফার"
                  className="h-full"
                />
              </div>
            );
          }

          const video = item.data!;
          return (
            <div
              key={item.key}
              id={`video-card-${video.id}`}
              onClick={() => onSelectVideo(video)}
              className="group relative overflow-hidden rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-rose-500/50 hover:shadow-xl hover:shadow-rose-950/30 transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-neutral-950 flex items-center justify-center">
                {/* Ambient blur background so image edges look great */}
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-lg opacity-30 scale-110"
                  style={{ backgroundImage: `url(${video.thumbnail})` }}
                />
                
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Duration Badge */}
                <span className="absolute bottom-2 right-2 bg-black/80 text-neutral-100 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border border-neutral-700/50">
                  {video.duration}
                </span>

                {/* Viral / Category Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  {video.isViral && (
                    <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <Flame className="w-3 h-3 fill-current animate-pulse" />
                      ভাইরাল
                    </span>
                  )}
                  <span className="bg-neutral-900/80 backdrop-blur-sm text-neutral-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-neutral-700/50">
                    {video.category}
                  </span>
                </div>

                {/* 20s Ad Gate Notice Badge */}
                <span className="absolute top-2 right-2 bg-amber-500 text-neutral-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                  <span>🔒 ২০ সে. অ্যাড</span>
                </span>

                {/* Always-visible Mobile Friendly Center Play / Image Preview Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors p-2 text-center">
                  <div className="w-11 sm:w-13 h-11 sm:h-13 rounded-full bg-rose-600/95 text-white flex items-center justify-center shadow-2xl shadow-rose-600/80 border-2 border-white/50 transform group-hover:scale-110 active:scale-90 transition-transform mb-1.5">
                    <Play className="w-5 sm:w-6 h-5 sm:h-6 fill-current translate-x-0.5 text-white" />
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] sm:text-xs font-bold text-white bg-black/80 px-2.5 py-0.5 rounded-full border border-neutral-700">
                    ফুল ভিডিও দেখতে ক্লিক করুন
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
                    {video.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                    {video.description}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800/60 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{(video.views).toLocaleString('bn-BD')} ভিউ</span>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-400">
                    <Clock className="w-3 h-3" />
                    <span>{video.createdAt}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
