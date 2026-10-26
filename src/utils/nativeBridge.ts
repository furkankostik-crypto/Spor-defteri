import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

const REST_TIMER_NOTIFICATION_ID = 7701;

class NativeBridge {
  private wakeLockSentinel: any = null;
  private isKeepAwakeRequested = false;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isKeepAwakeRequested) {
          this.acquireWakeLock();
        }
      });
    }
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

    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0b0f17' });
      await StatusBar.setOverlaysWebView({ overlay: false });
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
  // 1. HAPTICS (TACTILE FEEDBACK)
  // ============================================================================

  /**
   * Ultra-crisp micro-tick when scrolling the Weight/Rep ruler wheel
   */
  public async vibrateSelectionTick(): Promise<void> {
    try {
      if (this.isNative()) {
        await Haptics.selectionChanged();
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(6);
      }
    } catch {}
  }

  /**
   * Light tactile tap for normal button presses and tab switches
   */
  public async vibrateLight(): Promise<void> {
    try {
      if (this.isNative()) {
        await Haptics.impact({ style: ImpactStyle.Light });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {}
  }

  /**
   * Medium crisp thud when marking a workout set as Completed (✓)
   */
  public async vibrateMedium(): Promise<void> {
    try {
      if (this.isNative()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(22);
      }
    } catch {}
  }

  /**
   * Celebratory pattern when saving a workout, hitting a new PR, or leveling up!
   */
  public async vibrateSuccess(): Promise<void> {
    try {
      if (this.isNative()) {
        await Haptics.notification({ type: NotificationType.Success });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([25, 45, 45]);
      }
    } catch {}
  }

  /**
   * Strong alert vibration when Rest Timer finishes
   */
  public async vibrateTimerFinish(): Promise<void> {
    try {
      if (this.isNative()) {
        await Haptics.notification({ type: NotificationType.Warning });
        setTimeout(() => {
          Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
        }, 180);
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([120, 80, 160]);
      }
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

    // 2. Web / PWA: Try Web Share API with files if supported on mobile, otherwise standard download
    try {
      const blob = new Blob([content], { type: mimeType });
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
