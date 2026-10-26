import { nativeBridge } from './nativeBridge';

export interface RemoteVersionInfo {
  version: string;
  build: number;
  releaseDate: string;
  apkUrl: string;
  apkSize?: string;
  releaseNotes?: string[];
}

export const CURRENT_APP_VERSION = {
  version: '1.4.0',
  build: 14,
  displayVersion: 'v1.4.0 (Build 14)'
};

export interface UpdateCheckResult {
  hasUpdate: boolean;
  isError: boolean;
  errorMessage?: string;
  remote?: RemoteVersionInfo;
  current: typeof CURRENT_APP_VERSION;
}

/**
 * Fetches version.json from the live server and checks if a newer build exists
 */
export async function checkAppUpdate(): Promise<UpdateCheckResult> {
  try {
    const url = `/version.json?_t=${Date.now()}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache'
      }
    });

    if (!res.ok) {
      throw new Error(`Sürüm bilgisi alınamadı (HTTP ${res.status})`);
    }

    const data: RemoteVersionInfo = await res.json();
    const hasUpdate = (data.build || 0) > CURRENT_APP_VERSION.build;

    return {
      hasUpdate,
      isError: false,
      remote: data,
      current: CURRENT_APP_VERSION
    };
  } catch (err: any) {
    return {
      hasUpdate: false,
      isError: true,
      errorMessage: err?.message || 'Bağlantı hatası oluştu',
      current: CURRENT_APP_VERSION
    };
  }
}

/**
 * Purges Service Workers & CacheStorage, then reloads the web application
 */
export async function refreshAppCache(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(async (reg) => {
          try {
            await reg.update();
            await reg.unregister();
          } catch {}
        })
      );
    }

    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch {}

  const url = new URL(window.location.href);
  url.searchParams.set('v', Date.now().toString());
  window.location.replace(url.toString());
}

/**
 * Triggers APK download for Native Android or Web
 */
export function downloadAppApk(customUrl?: string): void {
  const url = customUrl || 'https://spor-defteri.vercel.app/GymPad.apk';
  
  if (nativeBridge.isNative()) {
    // Inside Android Capacitor webview: launch external browser / system download manager
    try {
      window.open(url, '_system');
      return;
    } catch {}
  }

  // Web / fallback: click anchor element
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GymPad.apk';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
