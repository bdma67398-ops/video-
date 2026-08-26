import React, { useEffect, useRef } from 'react';
import { ExternalLink, Sparkles, AlertCircle } from 'lucide-react';

interface AdDisplayProps {
  code?: string;
  type?: 'banner' | 'native' | 'sidebar' | 'header' | 'footer' | 'custom';
  title?: string;
  description?: string;
  imageUrl?: string;
  targetUrl?: string;
  ctaText?: string;
  className?: string;
  onAdClick?: () => void;
  badgeText?: string;
}

export const AdDisplay: React.FC<AdDisplayProps> = ({
  code,
  type = 'banner',
  title,
  description,
  imageUrl,
  targetUrl = 'https://example.com/ad-click',
  ctaText = 'বিস্তারিত দেখুন ➔',
  className = '',
  onAdClick,
  badgeText = 'স্পনসরড বিজ্ঞাপন'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!code || !containerRef.current) return;

    // Check if code contains script tags
    const hasScript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(code);

    if (hasScript) {
      // Clear container
      containerRef.current.innerHTML = '';
      
      // Parse and execute scripts safely
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = code;

      Array.from(tempDiv.childNodes).forEach((node) => {
        if (node.nodeName === 'SCRIPT') {
          const script = document.createElement('script');
          const originalScript = node as HTMLScriptElement;
          
          Array.from(originalScript.attributes).forEach((attr) => {
            script.setAttribute(attr.name, attr.value);
          });
          
          script.innerHTML = originalScript.innerHTML;
          containerRef.current?.appendChild(script);
        } else {
          containerRef.current?.appendChild(node.cloneNode(true));
        }
      });
    }
  }, [code]);

  const handleClick = (e: React.MouseEvent) => {
    if (onAdClick) onAdClick();
  };

  // If valid raw HTML code without pure script is passed and not empty
  if (code && code.trim().length > 0 && !code.trim().startsWith('<!-- empty')) {
    const isPureScript = code.trim().startsWith('<script') && !code.includes('<div') && !code.includes('<a') && !code.includes('<img');

    if (!isPureScript) {
      return (
        <div className={`ad-code-container relative overflow-hidden ${className}`}>
          <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            {badgeText}
          </div>
          <div 
            dangerouslySetInnerHTML={{ __html: code }} 
            onClick={handleClick}
          />
        </div>
      );
    } else {
      return (
        <div className={`ad-script-container relative ${className}`}>
          <div ref={containerRef} />
        </div>
      );
    }
  }

  // Fallback / High-CTR Visual Graphic Ad Cards
  if (type === 'native') {
    return (
      <div 
        id="native-ad-card"
        onClick={handleClick}
        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-rose-950/40 border border-rose-500/30 p-4 transition-all duration-300 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-950/40 ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-600/90 text-white uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            {badgeText}
          </span>
          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
            অ্যাড <ExternalLink className="w-3 h-3 text-neutral-400" />
          </span>
        </div>

        {imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-950 mb-3">
            <img 
              src={imageUrl} 
              alt={title || 'Ad'} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
              <span className="bg-amber-500 text-neutral-950 text-xs font-black px-2 py-0.5 rounded">
                মেগা অফার 🔥
              </span>
            </div>
          </div>
        )}

        <h4 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-2">
          {title || '🔥 ঘরে বসেই মোবাইল দিয়ে আয় করুন প্রতিদিন ১০০০-৩০০০ টাকা!'}
        </h4>
        <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
          {description || 'সহজ কাজের সুযোগ। কোনো অভিজ্ঞতা ছাড়াই মাত্র ১০ মিনিট কাজ করে ইনকাম করুন।'}
        </p>

        <a 
          href={targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95"
        >
          {ctaText}
        </a>
      </div>
    );
  }

  // Default Banner Layout
  return (
    <div 
      id="banner-ad-card"
      onClick={handleClick}
      className={`relative overflow-hidden rounded-xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-4 text-center ${className}`}
    >
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 uppercase font-semibold mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        {badgeText}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
        <div className="text-left">
          <div className="text-sm sm:text-base font-bold text-amber-400">
            {title || '⚡ আল্ট্রা ফাস্ট স্ট্রিমিং ও আনলিমিটেড ভাইরাল ভিডিও এক ক্লিকে!'}
          </div>
          <div className="text-xs text-neutral-400">
            {description || 'সরাসরি হাই-কোয়ালিটি সার্ভার থেকে ভিডিও ও ক্লিপ দেখতে ক্লিক করুন।'}
          </div>
        </div>

        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
        >
          <span>{ctaText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
