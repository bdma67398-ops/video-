import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import config from '../firebase-applet-config.json';
import { Video, AdConfig, SiteSettings, TrafficAnalytics } from './types';
import { INITIAL_VIDEOS, INITIAL_AD_CONFIG, INITIAL_SITE_SETTINGS, INITIAL_ANALYTICS } from './data/initialData';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(config) : getApp();

// Use the designated database ID if provided, otherwise default
export const db = config.firestoreDatabaseId 
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

// Firestore Collections & Doc keys
export const COLLECTIONS = {
  VIDEOS: 'videos',
  CONFIG: 'config',
  ANALYTICS: 'analytics'
};

export const CONFIG_DOCS = {
  AD_CONFIG: 'ad_config',
  SETTINGS: 'settings',
  TRAFFIC: 'traffic'
};

const CATEGORY_MAP: Record<string, string> = {
  '😂 ফানি ভিডিও': '🇧🇩 বাংলাদেশি ভিডিও',
  '💥 ব্রেকিং নিউজ': '💃 ইন্ডিয়ান বৌদি ভিডিও',
  '🎬 নাটক ও মুভি': '🇨🇳 চায়না ভিডিও',
  '📱 রিলস ও শর্টস': '🇸🇦 সৌদি আরব ভিডিও',
  '🏏 খেলাধুলা': '🔥 ভাইরাল ভিডিও',
  '🎵 ভাইরাল গান': '🎬 স্পেশাল ভিডিও',
  '🎵 গান ও নাচ': '🎬 স্পেশাল ভিডিও'
};

const TARGET_AD_URL = 'https://www.profitableratecpmnetwork.com/fhk12swps?key=431d1e23619240ac97ef4d6285054d6a';

export function normalizeVideoCategory(vid: Video): Video {
  let cat = vid.category;
  if (CATEGORY_MAP[cat]) {
    cat = CATEGORY_MAP[cat];
  }
  return { ...vid, category: cat };
}

/**
 * Seed initial data or migrate existing records to new categories in Firestore
 */
export async function initializeFirestoreData() {
  try {
    const videosRef = collection(db, COLLECTIONS.VIDEOS);
    const snapshot = await getDocs(videosRef);

    if (snapshot.empty) {
      console.log('Seeding initial videos to Firestore...');
      for (const video of INITIAL_VIDEOS) {
        await setDoc(doc(db, COLLECTIONS.VIDEOS, video.id), {
          ...video,
          createdAtServer: serverTimestamp()
        });
      }
    } else {
      // Migrate existing documents that have old categories or need initial updates
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Video;
        const initialMatch = INITIAL_VIDEOS.find(v => v.id === docSnap.id);
        
        let needsUpdate = false;
        const updates: Partial<Video> = {};

        if (CATEGORY_MAP[data.category]) {
          updates.category = CATEGORY_MAP[data.category];
          needsUpdate = true;
        } else if (initialMatch && data.category !== initialMatch.category) {
          updates.category = initialMatch.category;
          needsUpdate = true;
        }

        if (initialMatch && (!data.title || data.title.includes('ব্রেকিং নিউজ') || data.title.includes('মজার ভিডিওটি'))) {
          updates.title = initialMatch.title;
          updates.description = initialMatch.description;
          updates.duration = initialMatch.duration;
          updates.category = initialMatch.category;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(doc(db, COLLECTIONS.VIDEOS, docSnap.id), updates);
        }
      }
    }

    // Seed/Update Config
    const adConfigRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.AD_CONFIG);
    const settingsRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.SETTINGS);
    const trafficRef = doc(db, COLLECTIONS.ANALYTICS, CONFIG_DOCS.TRAFFIC);

    const adSnap = await getDocs(collection(db, COLLECTIONS.CONFIG));
    if (adSnap.empty) {
      await setDoc(adConfigRef, INITIAL_AD_CONFIG);
      await setDoc(settingsRef, INITIAL_SITE_SETTINGS);
      await setDoc(trafficRef, INITIAL_ANALYTICS);
    } else {
      // Ensure target ad URL is properly set in Firestore
      await setDoc(adConfigRef, {
        midrollAdGate: {
          ...INITIAL_AD_CONFIG.midrollAdGate,
          enabled: true,
          directLinkUrl: TARGET_AD_URL,
          countdownSeconds: 20,
          triggerSeconds: 7
        },
        directLink: {
          ...INITIAL_AD_CONFIG.directLink,
          enabled: true,
          url: TARGET_AD_URL,
          showOnVideoBadge: true,
          videoBadgeText: '⚡ ডাইরেক্ট লিংক / হাই স্পিড ডাউনলোড ➜'
        }
      }, { merge: true });
    }
  } catch (err) {
    console.error('Error initializing Firestore data:', err);
  }
}

/**
 * Real-time Videos Subscription
 */
export function subscribeToVideos(callback: (videos: Video[]) => void) {
  const videosRef = collection(db, COLLECTIONS.VIDEOS);
  return onSnapshot(videosRef, (snapshot) => {
    if (!snapshot.empty) {
      const videos: Video[] = [];
      snapshot.forEach((d) => {
        const raw = { ...d.data(), id: d.id } as Video;
        videos.push(normalizeVideoCategory(raw));
      });
      // Sort newest first
      videos.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(videos);
    } else {
      callback(INITIAL_VIDEOS.map(normalizeVideoCategory));
    }
  }, (error) => {
    console.error('Error subscribing to videos:', error);
  });
}

/**
 * Real-time Ad Config Subscription
 */
export function subscribeToAdConfig(callback: (config: AdConfig) => void) {
  const adConfigRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.AD_CONFIG);
  return onSnapshot(adConfigRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as AdConfig;
      if (!data.midrollAdGate?.directLinkUrl || data.midrollAdGate.directLinkUrl.includes('example.com')) {
        data.midrollAdGate = {
          ...INITIAL_AD_CONFIG.midrollAdGate,
          ...(data.midrollAdGate || {}),
          enabled: true,
          directLinkUrl: TARGET_AD_URL,
          countdownSeconds: 20,
          triggerSeconds: 7
        };
      }
      callback(data);
    } else {
      callback(INITIAL_AD_CONFIG);
    }
  }, (error) => {
    console.error('Error subscribing to ad config:', error);
  });
}

/**
 * Real-time Site Settings Subscription
 */
export function subscribeToSiteSettings(callback: (settings: SiteSettings) => void) {
  const settingsRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.SETTINGS);
  return onSnapshot(settingsRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as SiteSettings);
    } else {
      callback(INITIAL_SITE_SETTINGS);
    }
  }, (error) => {
    console.error('Error subscribing to site settings:', error);
  });
}

/**
 * Real-time Traffic Analytics Subscription
 */
export function subscribeToAnalytics(callback: (analytics: TrafficAnalytics) => void) {
  const trafficRef = doc(db, COLLECTIONS.ANALYTICS, CONFIG_DOCS.TRAFFIC);
  return onSnapshot(trafficRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as TrafficAnalytics);
    } else {
      callback(INITIAL_ANALYTICS);
    }
  }, (error) => {
    console.error('Error subscribing to analytics:', error);
  });
}

/**
 * Cloud Operations: Add or Update Video
 */
export async function saveVideoToCloud(video: Video): Promise<void> {
  const videoRef = doc(db, COLLECTIONS.VIDEOS, video.id);
  await setDoc(videoRef, {
    ...video,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Cloud Operations: Delete Video
 */
export async function deleteVideoFromCloud(videoId: string): Promise<void> {
  const videoRef = doc(db, COLLECTIONS.VIDEOS, videoId);
  await deleteDoc(videoRef);
}

/**
 * Cloud Operations: Save Ad Config
 */
export async function saveAdConfigToCloud(config: AdConfig): Promise<void> {
  const adConfigRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.AD_CONFIG);
  await setDoc(adConfigRef, config, { merge: true });
}

/**
 * Cloud Operations: Save Site Settings
 */
export async function saveSiteSettingsToCloud(settings: SiteSettings): Promise<void> {
  const settingsRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.SETTINGS);
  await setDoc(settingsRef, settings, { merge: true });
}

/**
 * Cloud Operations: Increment View Count
 */
export async function incrementVideoViewsInCloud(videoId: string, currentViews: number): Promise<void> {
  try {
    const videoRef = doc(db, COLLECTIONS.VIDEOS, videoId);
    await updateDoc(videoRef, {
      views: (currentViews || 0) + 1
    });
  } catch (e) {
    console.error('Error incrementing view in cloud:', e);
  }
}
