import { Video, AdConfig, TrafficAnalytics, SiteSettings } from '../types';

export const INITIAL_VIDEOS: Video[] = [
  {
    id: 'vid-1',
    title: '🔥 ফেসবুকে তুমুল ভাইরাল হওয়া নতুন ভিডিওটি একবার হলেও দেখুন!',
    description: 'আজকের সবচেয়ে বেশি শেয়ার হওয়া দুর্দান্ত ক্লিপ। দেখুন এবং বন্ধুদের সাথে শেয়ার করুন!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoType: 'mp4',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    category: '🇧🇩 বাংলাদেশি ভিডিও',
    tags: ['বাংলাদেশি', 'ভাইরাল', 'ট্রেন্ডিং'],
    views: 342500,
    likes: 24800,
    shares: 12400,
    duration: '০৯:৫৬',
    createdAt: 'আজকের ভাইরাল',
    featured: true,
    isViral: true,
    midrollAdEnabled: true,
    midrollTime: 0,
    adDuration: 20,
    directDownloadLink: 'https://t.me/+6WMf5P3PMaowZjk1',
    uploaderName: 'অফিসিয়াল টিম',
    status: 'published'
  },
  {
    id: 'vid-2',
    title: '💃 ইন্ডিয়ান বৌদির নতুন ভাইরাল হট ডান্স ও ভিডিও ফুটেজ!',
    description: 'সামাজিক মাধ্যমে তোলপাড় সৃষ্টি করা সম্পূর্ণ আসল ভিডিওটি এখানে দেখুন।',
    videoUrl: 'https://t.me/+6WMf5P3PMaowZjk1',
    videoType: 'mp4',
    thumbnail: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    category: '💃 ইন্ডিয়ান বৌদি ভিডিও',
    tags: ['ইন্ডিয়ান', 'বৌদি', 'ভাইরাল_ভিডিও'],
    views: 521800,
    likes: 41200,
    shares: 28900,
    duration: '১০:৫৩',
    createdAt: '২ ঘণ্টা আগে',
    featured: true,
    isViral: true,
    midrollAdEnabled: true,
    midrollTime: 0,
    adDuration: 20,
    directDownloadLink: 'https://t.me/+6WMf5P3PMaowZjk1',
    uploaderName: 'ভাইরাল এক্সপ্রেস',
    status: 'published'
  },
  {
    id: 'vid-3',
    title: '🇨🇳 চায়না টিকটকের দুর্দান্ত ভাইরাল ট্রেন্ডিং কালেকশন ভিডিও',
    description: 'চায়নার টিকটক ও সামাজিক মাধ্যমে কোটি ভিউ পাওয়া দুর্দান্ত ভিডিও ফুটেজ!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoType: 'mp4',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    category: '🇨🇳 চায়না ভিডিও',
    tags: ['চায়না', 'টিকটক', 'ভাইরাল'],
    views: 189400,
    likes: 15300,
    shares: 5400,
    duration: '১২:১৫',
    createdAt: '৫ ঘণ্টা আগে',
    featured: false,
    isViral: true,
    midrollAdEnabled: true,
    midrollTime: 0,
    adDuration: 20,
    directDownloadLink: 'https://t.me/+6WMf5P3PMaowZjk1',
    uploaderName: 'গ্লোবাল মিডিয়া',
    status: 'published'
  },
  {
    id: 'vid-4',
    title: '🇸🇦 সৌদি আরবের বিলাসবহুল লাইফস্টাইল ও ভাইরাল রিলস ভিডিও',
    description: 'সৌদি আরবের সবচেয়ে বেশি দেখা ট্রেন্ডিং ভিডিও কালেকশন। মিস করবেন না!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    videoType: 'mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    category: '🇸🇦 সৌদি আরব ভিডিও',
    tags: ['সৌদি', 'আরব', 'রিলস', 'ভাইরাল'],
    views: 458900,
    likes: 67300,
    shares: 34100,
    duration: '০৮:৪৫',
    createdAt: '১ দিন আগে',
    featured: false,
    isViral: true,
    midrollAdEnabled: true,
    midrollTime: 0,
    adDuration: 20,
    directDownloadLink: 'https://t.me/+6WMf5P3PMaowZjk1',
    uploaderName: 'আরব ট্রেন্ডস',
    status: 'published'
  },
  {
    id: 'vid-5',
    title: '🔥 নেট দুনিয়ায় সবচেয়ে বেশি খোঁজা আজকের স্পেশাল ভাইরাল ভিডিও',
    description: 'সোশ্যাল মিডিয়ায় রেকর্ড তৈরি করা দুর্দান্ত ভাইরাল ভিডিও ফুটেজ!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    videoType: 'mp4',
    thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80',
    category: '🔥 ভাইরাল ভিডিও',
    tags: ['ভাইরাল', 'হট', 'ট্রেন্ড'],
    views: 612400,
    likes: 89000,
    shares: 42000,
    duration: '১১:২০',
    createdAt: '১ দিন আগে',
    featured: true,
    isViral: true,
    midrollAdEnabled: true,
    midrollTime: 0,
    adDuration: 20,
    directDownloadLink: 'https://t.me/+6WMf5P3PMaowZjk1',
    uploaderName: 'ভাইরাল কিং',
    status: 'published'
  },
  {
    id: 'vid-6',
    title: '🎬 আজ রাতের ধামাকা স্পেশাল ভিডিও - এক ক্লিকেই সম্পূর্ণ উপভোগ করুন',
    description: 'দর্শকদের বিশেষ অনুরোধের সেরা আনকাট ভিডিও সিন।',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    videoType: 'mp4',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    category: '🎬 স্পেশাল ভিডিও',
    tags: ['স্পেশাল', 'আনকাট', 'ভাইরাল'],
    views: 789200,
    likes: 112000,
    shares: 63000,
    duration: '১৫:৩০',
    createdAt: '২ দিন আগে',
    featured: false,
    isViral: true,
    midrollAdEnabled: true,
    midrollTime: 0,
    adDuration: 20,
    directDownloadLink: 'https://t.me/+6WMf5P3PMaowZjk1',
    uploaderName: 'স্পেশাল জোন',
    status: 'published'
  }
];

export const INITIAL_AD_CONFIG: AdConfig = {
  nativeBanner: {
    enabled: true,
    code: `<div style="background: linear-gradient(135deg, #1e1e24 0%, #16161a 100%); border: 1px solid #ff4d4f; border-radius: 12px; padding: 14px; text-align: center; color: #fff; box-shadow: 0 4px 15px rgba(255,77,79,0.15);">
  <span style="background: #ff4d4f; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Sponsored</span>
  <h4 style="margin: 8px 0 4px; font-size: 16px; font-weight: 700; color: #ffeb3b;">🚀 অনলাইন থেকে প্রতিদিন ১০০০-৩০০০ টাকা আয় করুন ঘরে বসেই!</h4>
  <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 10px;">সহজ নিয়মে মোবাইল দিয়ে কাজ শুরু করুন আজই। কোনো অভিজ্ঞতার প্রয়োজন নেই।</p>
  <a href="https://example.com/native-ad-offer" target="_blank" style="display: inline-block; background: #ff4d4f; color: #fff; font-weight: bold; padding: 8px 18px; border-radius: 6px; text-decoration: none; font-size: 13px;">👉 এখনই ফ্রি জয়েন করুন</a>
</div>`,
    title: '🚀 ঘরে বসেই মোবাইল দিয়ে আয় করার সহজ সুযোগ!',
    description: 'প্রতিদিন ১০০০-৩০০০ টাকা ইনকাম করুন সহজে। এখনই ফ্রিতে বিস্তারিত দেখে নিন।',
    customImage: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&auto=format&fit=crop&q=80',
    customLink: 'https://example.com/native-offer',
    customCta: '👉 এখনই অফার দেখুন',
    frequency: 3
  },
  bannerAd: {
    enabled: true,
    headerBannerCode: `<div style="background: #111; border: 1px dashed #ef4444; padding: 10px; text-align: center; border-radius: 8px;">
  <span style="color: #9ca3af; font-size: 11px;">[ 728x90 ব্যানার অ্যাড বিজ্ঞাপন ]</span>
  <div style="font-weight: bold; color: #f59e0b; margin-top: 4px;">⚡ দ্রুততম স্পিডে আনলিমিটেড ভাইরাল ভিডিও ও মুভি স্ট্রিমিং সার্ভার!</div>
  <a href="https://example.com/banner-click" target="_blank" style="display: inline-block; margin-top: 6px; background: #dc2626; color: #fff; padding: 4px 14px; border-radius: 4px; font-size: 12px; text-decoration: none; font-weight: 600;">ক্লিক করুন ও উপভোগ করুন ➔</a>
</div>`,
    playerUnderBannerCode: `<div style="background: #18181b; border: 1px solid #3f3f46; padding: 12px; text-align: center; border-radius: 8px; margin: 10px 0;">
  <p style="color: #e4e4e7; font-size: 14px; font-weight: 600; margin-bottom: 6px;">📥 হাই-স্পিড ফুল HD ভিডিও ডাউনলোড লিংক (ফ্রি)</p>
  <a href="https://example.com/fast-download" target="_blank" style="background: #16a34a; color: white; padding: 7px 18px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 13px; display: inline-block;">🚀 Direct Download (Fast Link)</a>
</div>`,
    sidebarBannerCode: `<div style="background: #18181b; border: 1px solid #27272a; padding: 16px; text-align: center; border-radius: 10px;">
  <span style="color: #71717a; font-size: 10px;">SPONSORED AD (300x250)</span>
  <h5 style="color: #fbbf24; font-size: 15px; margin: 8px 0; font-weight: 700;">🎁 স্পেশাল অফার ও গিফট পেতে ক্লিক করুন</h5>
  <p style="color: #a1a1aa; font-size: 12px; margin-bottom: 12px;">আজকের মেগা লাকি ড্রতে অংশগ্রহণ করুন সম্পূর্ণ বিনামূল্যে!</p>
  <a href="https://example.com/gift-offer" target="_blank" style="background: #e11d48; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold; display: block;">ক্লেম করুন এখনই ➜</a>
</div>`,
    footerBannerCode: `<div style="text-align: center; padding: 12px; background: #09090b; border-top: 1px solid #27272a; color: #a1a1aa; font-size: 12px;">
  <span>বিজ্ঞাপন স্পট: আপনার বিজ্ঞাপন দিতে যোগাযোগ করুন</span>
</div>`,
    customHeaderImage: '',
    customHeaderLink: 'https://www.profitableratecpmnetwork.com/fhk12swps?key=431d1e23619240ac97ef4d6285054d6a'
  },
  popunder: {
    enabled: false,
    code: `<!-- Popunder Script Code Box -->
<script>
  console.log("Popunder Ad Activated");
</script>`,
    targetUrl: 'https://www.profitableratecpmnetwork.com/fhk12swps?key=431d1e23619240ac97ef4d6285054d6a',
    triggerMode: 'any_click',
    frequencyLimitMinutes: 5
  },
  socialBar: {
    enabled: true,
    code: `<!-- Social Bar Script Code Box -->`,
    customTitle: '🔥 ১টি নতুন ভাইরাল সিক্রেট ভিডিও যুক্ত হয়েছে!',
    customMessage: 'এখনই সম্পূর্ণ ভিডিও ক্লিপটি দেখুন আনকাট ভার্সন সহ...',
    customLink: 'https://www.profitableratecpmnetwork.com/fhk12swps?key=431d1e23619240ac97ef4d6285054d6a',
    customIcon: '🔔',
    customBadge: 'Live Update',
    customButtonText: 'এখনই দেখুন ➔',
    position: 'bottom-right'
  },
  directLink: {
    enabled: true,
    url: 'https://www.profitableratecpmnetwork.com/fhk12swps?key=431d1e23619240ac97ef4d6285054d6a',
    downloadButtonText: '📥 HD ভিডিও ডাউনলোড করুন (ডিরেক্ট)',
    fastServerButtonText: '⚡ সার্ভার ২ (হাই-স্পিড মিরর)',
    hdQualityButtonText: '💎 1080p ফুল কোয়ালিটি লিংক',
    playOverlayRedirect: true,
    showOnVideoBadge: true,
    videoBadgeText: '⚡ ডাইরেক্ট লিংক / হাই স্পিড ডাউনলোড ➜'
  },
  monetag: {
    enabled: false,
    zoneId: '9847231',
    multiTagCode: `<!-- Monetag MultiTag Code -->
<script src="https://alwingulla.com/88/tag.min.js" data-zone="9847231" async data-cfasync="false"></script>`,
    inPagePushCode: `<!-- Monetag In-Page Push Code -->
<script>(function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),'https://inklinkor.com/tag.min.js',9847231,document.body||document.documentElement)</script>`,
    popunderCode: `<!-- Monetag OnClick Popunder -->`,
    vignetteCode: `<!-- Monetag Vignette Banner -->`,
    directLinkUrl: 'https://www.profitableratecpmnetwork.com/fhk12swps?key=431d1e23619240ac97ef4d6285054d6a'
  },
  midrollAdGate: {
    enabled: true,
    triggerSeconds: 7,
    countdownSeconds: 20,
    adTitle: 'ফুল ভিডিও দেখতে হলে আপনাকে ২০ সেকেন্ড অ্যাড দেখতে হবে',
    adDescription: 'সম্পূর্ণ ভিডিও উপভোগ করতে নিচের "অ্যাড দেখুন" বাটনে ক্লিক করুন অথবা ২০ সেকেন্ড অপেক্ষা করুন।',
    adEmbedCode: `<div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border: 2px solid #ec4899; border-radius: 12px; padding: 20px; text-align: center; color: white;">
  <span style="background: #ec4899; color: white; font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: bold; text-transform: uppercase;">SPONSORED VIDEO AD</span>
  <h3 style="font-size: 20px; margin: 12px 0 6px; font-weight: 800; color: #facc15;">🎁 বিশেষ বোনাস অফার: ১ ক্লিকেই জিতে নিন পুরস্কার!</h3>
  <p style="font-size: 14px; color: #e2e8f0; margin-bottom: 16px;">বিজ্ঞাপনটিতে ক্লিক করে সাইটটি ভিজিট করুন ও আকর্ষণীয় রিওয়ার্ড উপভোগ করুন।</p>
  <a href="https://www.profitableratecpmnetwork.com/fhk12swps?key=431d1e23619240ac97ef4d6285054d6a" target="_blank" style="display: inline-block; background: #ec4899; color: white; font-weight: bold; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 15px; box-shadow: 0 4px 15px rgba(236,72,153,0.4);">👉 অফারটি দেখতে এখানে ক্লিক করুন</a>
</div>`,
    adBannerImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    directLinkUrl: 'https://www.profitableratecpmnetwork.com/fhk12swps?key=431d1e23619240ac97ef4d6285054d6a',
    allowForceClick: false,
    customAdButtonText: '👉 অ্যাড দেখুন'
  }
};

export const INITIAL_ANALYTICS: TrafficAnalytics = {
  totalViews: 2909800,
  totalAdImpressions: 1845200,
  totalAdCompleted: 1220400,
  totalDirectClicks: 489300,
  dailyViews: [
    { date: '২০২৬-০৮-১৯', views: 320400, adGates: 240100, adClicks: 65400 },
    { date: '২০২৬-০৮-২০', views: 385600, adGates: 290800, adClicks: 79200 },
    { date: '২০২৬-০৮-২১', views: 442100, adGates: 335400, adClicks: 91500 },
    { date: '২০২৬-০৮-২২', views: 512900, adGates: 390200, adClicks: 104800 },
    { date: '২০২৬-০৮-২৩', views: 589400, adGates: 448000, adClicks: 121000 },
    { date: '২০২৬-০৮-২৪', views: 659400, adGates: 504000, adClicks: 138000 }
  ],
  visitorLogs: [
    {
      id: 'log-1',
      videoTitle: '🔥 ফেসবুকে তুমুল ভাইরাল হওয়া নতুন মজার ভিডিওটি একবার হলেও দেখুন!',
      videoId: 'vid-1',
      timestamp: 'এইমাত্র',
      adTriggered: true,
      adCompleted: true,
      action: '২০ সেকেন্ড অ্যাড সম্পূর্ণ দেখেছে',
      device: 'Mobile (Android)',
      country: 'Bangladesh 🇧🇩'
    },
    {
      id: 'log-2',
      videoTitle: '💥 ব্রেকিং: এইমাত্র ঘটে যাওয়া তুমুল আলোচিত ঘটনার অবিশ্বাস্য ভিডিও ফুটেজ!',
      videoId: 'vid-2',
      timestamp: '২ মিনিট আগে',
      adTriggered: true,
      adCompleted: true,
      action: 'ডাইরেক্ট লিংক ক্লিক',
      device: 'Mobile (iOS)',
      country: 'Bangladesh 🇧🇩'
    },
    {
      id: 'log-3',
      videoTitle: '🏏 শেষ ওভারে অবিশ্বাস্য নাটকীয়তা! ভাইরাল ক্রিকেট ম্যাচের দৃশ্য',
      videoId: 'vid-5',
      timestamp: '৫ মিনিট আগে',
      adTriggered: true,
      adCompleted: true,
      action: '৭ সেকেন্ড পর অ্যাড লক ভিউ',
      device: 'Desktop (Windows)',
      country: 'India 🇮🇳'
    },
    {
      id: 'log-4',
      videoTitle: '📱 টিকটক ও ইনস্টাগ্রামে ঝড় তোলা ভাইরাল শর্টস রিলস ডান্স',
      videoId: 'vid-4',
      timestamp: '৯ মিনিট আগে',
      adTriggered: true,
      adCompleted: false,
      action: 'সোশ্যাল বার ক্লিক',
      device: 'Mobile (Android)',
      country: 'Bangladesh 🇧🇩'
    }
  ]
};

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteName: 'ভাইরাল ভিডিও পোর্টাল',
  siteTagline: 'সবচেয়ে দ্রুত ভাইরাল ভিডিও ও কনটেন্ট দেখুন',
  announcement: '🔥 আজকের সব নতুন ভাইরাল ভিডিও সবার আগে দেখতে আমাদের টেলিগ্রাম চ্যানেলে জয়েন করুন!',
  enableAnnouncement: true,
  telegramLink: 'https://t.me/+6WMf5P3PMaowZjk1',
  whatsappLink: 'https://whatsapp.com/channel/example',
  adminPin: 'mominul'
};
