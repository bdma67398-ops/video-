export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoType: 'mp4' | 'youtube' | 'embed' | 'stream';
  thumbnail: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  shares: number;
  duration: string;
  createdAt: string;
  featured?: boolean;
  isViral?: boolean;
  midrollAdEnabled: boolean;
  midrollTime: number; // in seconds, default 7
  adDuration: number; // in seconds, default 20
  directDownloadLink?: string;
  uploaderName?: string;
  blobId?: string;
  status: 'published' | 'draft';
}

export interface NativeBannerAdConfig {
  enabled: boolean;
  code: string;
  title: string;
  description: string;
  customImage: string;
  customLink: string;
  customCta: string;
  frequency: number; // Show every N items in grid
}

export interface BannerAdConfig {
  enabled: boolean;
  headerBannerCode: string;
  playerUnderBannerCode: string;
  sidebarBannerCode: string;
  footerBannerCode: string;
  customHeaderImage?: string;
  customHeaderLink?: string;
}

export interface PopunderAdConfig {
  enabled: boolean;
  code: string;
  targetUrl: string;
  triggerMode: 'any_click' | 'video_click' | 'page_load';
  frequencyLimitMinutes: number;
}

export interface SocialBarAdConfig {
  enabled: boolean;
  code: string;
  customTitle: string;
  customMessage: string;
  customLink: string;
  customIcon: string;
  customBadge: string;
  customButtonText: string;
  position: 'bottom-right' | 'bottom-left' | 'top-bar';
}

export interface DirectLinkAdConfig {
  enabled: boolean;
  url: string;
  downloadButtonText: string;
  fastServerButtonText: string;
  hdQualityButtonText: string;
  playOverlayRedirect: boolean;
  showOnVideoBadge?: boolean;
  videoBadgeText?: string;
}

export interface MonetagAdConfig {
  enabled: boolean;
  zoneId: string;
  multiTagCode: string;
  inPagePushCode: string;
  popunderCode: string;
  vignetteCode: string;
  directLinkUrl: string;
}

export interface MidrollAdGateConfig {
  enabled: boolean;
  triggerSeconds: number; // default 7
  countdownSeconds: number; // default 20
  adTitle: string;
  adDescription: string;
  adEmbedCode: string;
  adBannerImage: string;
  directLinkUrl: string;
  allowForceClick: boolean;
  customAdButtonText: string;
}

export interface AdConfig {
  nativeBanner: NativeBannerAdConfig;
  bannerAd: BannerAdConfig;
  popunder: PopunderAdConfig;
  socialBar: SocialBarAdConfig;
  directLink: DirectLinkAdConfig;
  monetag: MonetagAdConfig;
  midrollAdGate: MidrollAdGateConfig;
}

export interface VisitorLog {
  id: string;
  videoTitle: string;
  videoId: string;
  timestamp: string;
  adTriggered: boolean;
  adCompleted: boolean;
  action: string;
  device: string;
  country: string;
}

export interface TrafficAnalytics {
  totalViews: number;
  totalAdImpressions: number;
  totalAdCompleted: number;
  totalDirectClicks: number;
  dailyViews: Array<{
    date: string;
    views: number;
    adGates: number;
    adClicks: number;
  }>;
  visitorLogs: VisitorLog[];
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  announcement: string;
  enableAnnouncement: boolean;
  telegramLink: string;
  whatsappLink: string;
  adminPin: string;
}
