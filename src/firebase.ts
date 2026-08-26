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

/**
 * Seed initial data if cloud database is empty
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
    }

    // Seed Config
    const adConfigRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.AD_CONFIG);
    const settingsRef = doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.SETTINGS);
    const trafficRef = doc(db, COLLECTIONS.ANALYTICS, CONFIG_DOCS.TRAFFIC);

    // Only set if not existing
    const adSnap = await getDocs(collection(db, COLLECTIONS.CONFIG));
    if (adSnap.empty) {
      await setDoc(adConfigRef, INITIAL_AD_CONFIG);
      await setDoc(settingsRef, INITIAL_SITE_SETTINGS);
      await setDoc(trafficRef, INITIAL_ANALYTICS);
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
        videos.push({ ...d.data(), id: d.id } as Video);
      });
      // Sort newest first
      videos.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(videos);
    } else {
      callback(INITIAL_VIDEOS);
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
      callback(docSnap.data() as AdConfig);
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
