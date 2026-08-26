import React from 'react';
import { SiteSettings, AdConfig } from '../types';
import { AdDisplay } from './AdDisplay';
import { Flame, Shield, Send, Heart } from 'lucide-react';

interface FooterProps {
  siteSettings: SiteSettings;
  adConfig: AdConfig;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  siteSettings,
  adConfig,
  onOpenAdmin
}) => {
  return (
    <footer className="mt-12 bg-neutral-950 border-t border-neutral-900 text-neutral-400">
      {/* Footer Banner Ad */}
      {adConfig.bannerAd.enabled && adConfig.bannerAd.footerBannerCode && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-6">
          <AdDisplay
            code={adConfig.bannerAd.footerBannerCode}
            type="footer"
            badgeText="স্পনসর পার্টনার"
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">
              {siteSettings.siteName || 'ভাইরাল ভিডিও দেখুন'}
            </h4>
            <p className="text-[11px] text-neutral-400">
              {siteSettings.siteTagline || 'দ্রুততম স্পিডে আনলিমিটেড ভাইরাল ভিডিও দেখুন'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {siteSettings.telegramLink && (
            <a
              href={siteSettings.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Send className="w-3 h-3 text-[#229ED9]" />
              টেলিগ্রাম চ্যানেল
            </a>
          )}

          {/* Admin Login Button at Bottom with Heart ❤️ */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-rose-500/50 text-neutral-300 hover:text-white transition-all text-xs font-semibold active:scale-95 cursor-pointer shadow-sm group"
            title="অ্যাডমিন প্যানেল লগইন"
          >
            <span className="text-sm group-hover:scale-125 transition-transform duration-200">❤️</span>
            <span>অ্যাডমিন লগইন</span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-400 flex items-center gap-1">
          <span>সর্বস্বত্ব সংরক্ষিত &copy; {new Date().getFullYear()}</span>
          <span>•</span>
          <span className="text-neutral-400">সকল ভিডিও উন্মুক্ত পাবলিক উৎস থেকে সংগৃহীত</span>
        </div>
      </div>
    </footer>
  );
};
