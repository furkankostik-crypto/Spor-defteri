import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

const REST_TIMER_NOTIFICATION_ID = 7701;
const STORAGE_VIBRATION_KEY = 'spor_vibration_enabled';

class NativeBridge {
  private wakeLockSentinel: any = null;
  private isKeepAwakeRequested = false;
  private iosHapticLabel: HTMLLabelElement | null = null;
  public vibrationEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem(STORAGE_VIBRATION_KEY);
        if (saved !== null) {
          this.vibrationEnabled = saved === 'true';
        }
      } catch {}
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isKeepAwakeRequested) {
          this.acquireWakeLock();
        }
      });
    }
  }

  public setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_VIBRATION_KEY, String(enabled));
      }
    } catch {}
  }

  /**
   * Returns true when running inside the compiled Native Android / iOS Capacitor shell
   */
  public isNative(): boolean {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }

  public getPlatform(): string {
    try {
      return Capacitor.getPlatform();
    } catch {
      return 'web';
    }
  }

  /**
   * Initializes Native StatusBar, SplashScreen, and Notification Channel on startup
   */
  public async initNativeShell(): Promise<void> {
    if (!this.isNative()) return;

    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('is-native');
    }

    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setOverlaysWebView({ overlay: true });
    } catch {}

    try {
      await SplashScreen.hide();
    } catch {}

    try {
      await LocalNotifications.createChannel({
        id: 'rest-timer',
        name: 'Set Arası Dinlenme Sayacı',
        description: 'Set arası dinlenme süresi dolduğunda bildirim verir',
        importance: 5,
        visibility: 1,
        vibration: true
      });
    } catch {}
  }

  // ============================================================================
  // 1. HAPTICS (TACTILE FEEDBACK - ANDROID NATIVE, WEB VIBRATE & iOS 17.4+ TAPTIC)
  // ============================================================================

  /**
   * Triggers Apple Taptic Engine on iOS 17.4+ / iOS 18+ Safari & Home Screen PWA
   * via a hidden <input type="checkbox" switch> element when navigator.vibrate is unavailable.
   */
  private triggerIosWebHaptic(): void {
    try {
      if (typeof document === 'undefined' || typeof navigator === 'undefined') return;
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (!isIOS) return;

      if (!this.iosHapticLabel) {
        const label = document.createElement('label');
        label.setAttribute('aria-hidden', 'true');
        label.style.cssText =
          'position:fixed;top:-100px;left:-100px;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;z-index:-1;';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.setAttribute('switch', '');
        label.appendChild(input);
        if (document.body) {
          document.body.appendChild(label);
          this.iosHapticLabel = label;
        }
      }
      if (this.iosHapticLabel) {
        this.iosHapticLabel.click();
      }
    } catch {}
  }

  /**
   * Ultra-crisp micro-tick when scrolling the Weight/Rep ruler wheel
   */
  public async vibrateSelectionTick(): Promise<void> {
    if (!this.vibrationEnabled) return;
    try {
      if (this.isNative()) {
        await Haptics.selectionChanged();
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(6);
        return;
      }
      this.triggerIosWebHaptic();
    } catch {}
  }

  /**
   * Light tactile tap for normal button presses and tab switches
   */
  public async vibrateLight(): Promise<void> {
    if (!this.vibrationEnabled) return;
    try {
      if (this.isNative()) {
        await Haptics.impact({ style: ImpactStyle.Light });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
        return;
      }
      this.triggerIosWebHaptic();
    } catch {}
  }

  /**
   * Medium crisp thud when marking a workout set as Completed (✓)
   */
  public async vibrateMedium(): Promise<void> {
    if (!this.vibrationEnabled) return;
    try {
      if (this.isNative()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(22);
        return;
      }
      this.triggerIosWebHaptic();
    } catch {}
  }

  /**
   * Celebratory pattern when saving a workout, hitting a new PR, or leveling up!
   */
  public async vibrateSuccess(): Promise<void> {
    if (!this.vibrationEnabled) return;
    try {
      if (this.isNative()) {
        await Haptics.notification({ type: NotificationType.Success });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([25, 45, 45]);
        return;
      }
      this.triggerIosWebHaptic();
    } catch {}
  }

  /**
   * Strong alert vibration when Rest Timer finishes
   */
  public async vibrateTimerFinish(): Promise<void> {
    if (!this.vibrationEnabled) return;
    try {
      if (this.isNative()) {
        await Haptics.notification({ type: NotificationType.Warning });
        setTimeout(() => {
          if (!this.vibrationEnabled) return;
          Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
        }, 180);
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([120, 80, 160]);
        return;
      }
      this.triggerIosWebHaptic();
    } catch {}
  }

  // ============================================================================
  // 2. SCREEN WAKE LOCK (KEEP SCREEN AWAKE DURING ACTIVE WORKOUT)
  // ============================================================================

  public async setKeepScreenAwake(keepAwake: boolean): Promise<void> {
    this.isKeepAwakeRequested = keepAwake;
    if (keepAwake) {
      await this.acquireWakeLock();
    } else {
      await this.releaseWakeLock();
    }
  }

  private async acquireWakeLock(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !this.wakeLockSentinel) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
      }
    } catch {}
  }

  private async releaseWakeLock(): Promise<void> {
    try {
      if (this.wakeLockSentinel) {
        await this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch {}
  }

  // ============================================================================
  // 3. BACKGROUND REST TIMER LOCAL NOTIFICATIONS
  // ============================================================================

  public async scheduleRestTimerNotification(secondsFromNow: number, exerciseName?: string): Promise<void> {
    if (secondsFromNow <= 0) return;

    try {
      if (this.isNative()) {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }

        await this.cancelRestTimerNotification();

        const triggerAt = new Date(Date.now() + secondsFromNow * 1000);
        await LocalNotifications.schedule({
          notifications: [
            {
              id: REST_TIMER_NOTIFICATION_ID,
              title: '💪 Dinlenme Süresi Doldu!',
              body: exerciseName
                ? `${exerciseName} için sıradaki sete hazır mısın?`
                : 'Sıradaki sete başlama zamanı!',
              schedule: { at: triggerAt, allowWhileIdle: true },
              channelId: 'rest-timer'
            }
          ]
        });
      }
    } catch {}
  }

  public async cancelRestTimerNotification(): Promise<void> {
    try {
      if (this.isNative()) {
        await LocalNotifications.cancel({
          notifications: [{ id: REST_TIMER_NOTIFICATION_ID }]
        });
      }
    } catch {}
  }

  // ============================================================================
  // 4. NATIVE FILE EXPORT & SHARE SHEET (WHATSAPP / DRIVE / DOWNLOADS)
  // ============================================================================

  public async exportOrShareFile(
    filename: string,
    content: string,
    mimeType: string,
    dialogTitle: string
  ): Promise<boolean> {
    // 1. Inside Native Android/iOS APK: write to cache & open Native Share Sheet
    if (this.isNative()) {
      try {
        const written = await Filesystem.writeFile({
          path: filename,
          data: content,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        await Share.share({
          title: dialogTitle,
          text: `${dialogTitle} (${filename})`,
          url: written.uri,
          dialogTitle
        });
        return true;
      } catch (err) {
        console.warn('Native share cancelled or failed, falling back:', err);
        return false;
      }
    }

    // 2. Web / PWA (Especially iOS Standalone PWA where <a download> is restricted):
    // Try Web Share API with File support first on iOS/mobile, then fallback to standard download
    try {
      const blob = new Blob([content], { type: mimeType });
      const isIOS =
        typeof navigator !== 'undefined' &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

      if (isIOS && typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], filename, { type: mimeType });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: dialogTitle,
              text: `${dialogTitle} (${filename})`
            });
            return true;
          }
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') return false;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // 5. NATIVE APP LIFECYCLE & INSTANT EXIT
  // ============================================================================

  /**
   * Immediately exits the Native Android application on a single button click!
   */
  public async exitNativeApp(): Promise<boolean> {
    if (this.isNative()) {
      try {
        await CapApp.exitApp();
        return true;
      } catch {
        try {
          await CapApp.minimizeApp();
          return true;
        } catch {}
      }
    }
    return false;
  }

  public addNativeBackButtonListener(callback: () => void): () => void {
    if (!this.isNative()) return () => {};

    let listenerHandle: { remove: () => Promise<void> } | null = null;
    CapApp.addListener('backButton', () => {
      callback();
    }).then((handle) => {
      listenerHandle = handle;
    }).catch(() => {});

    return () => {
      if (listenerHandle) {
        listenerHandle.remove().catch(() => {});
      }
    };
  }
}

export const nativeBridge = new NativeBridge();
