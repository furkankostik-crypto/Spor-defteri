import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, googleProvider, appleProvider, isFirebaseConfigured } from '../services/firebase';
import { CloudSyncSettings } from '../types/workout';
import { getSavedWritesCount, resetSavedWritesCount } from '../services/workoutSync';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface AuthContextType {
  user: UserProfile | null;
  rawUser: User | null;
  loading: boolean;
  isConfigured: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  lastSyncMessage: string | null;
  syncSettings: CloudSyncSettings;
  savedWritesCount: number;
  updateSyncSettings: (settings: Partial<CloudSyncSettings>) => void;
  resetSavedWrites: () => void;
  refreshSavedWrites: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateSyncState: (status: SyncStatus, timestamp?: number, message?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_LAST_SYNC = 'spor_last_cloud_sync';
const LOCAL_STORAGE_SYNC_SETTINGS = 'spor_cloud_sync_settings';

const DEFAULT_SYNC_SETTINGS: CloudSyncSettings = {
  syncMode: 'smart',
  silentAutoSync: true,
  autoSyncOnStartup: true
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isFirebaseConfigured ? 'idle' : 'offline');
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);
  
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_LAST_SYNC);
    return saved ? parseInt(saved, 10) : null;
  });

  const [syncSettings, setSyncSettingsState] = useState<CloudSyncSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SYNC_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SYNC_SETTINGS;
  });

  const [savedWritesCount, setSavedWritesCount] = useState<number>(() => getSavedWritesCount());

  const refreshSavedWrites = useCallback(() => {
    setSavedWritesCount(getSavedWritesCount());
  }, []);

  const resetSavedWrites = useCallback(() => {
    resetSavedWritesCount();
    setSavedWritesCount(0);
  }, []);

  const updateSyncSettings = useCallback((newSettings: Partial<CloudSyncSettings>) => {
    setSyncSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(LOCAL_STORAGE_SYNC_SETTINGS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSyncState = (status: SyncStatus, timestamp?: number, message?: string) => {
    setSyncStatus(status);
    if (message !== undefined) {
      setLastSyncMessage(message);
    }
    if (timestamp) {
      setLastSyncedAt(timestamp);
      localStorage.setItem(LOCAL_STORAGE_LAST_SYNC, String(timestamp));
    }
    refreshSavedWrites();
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      setSyncStatus('offline');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setRawUser(firebaseUser);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Sporcu'),
          photoURL: firebaseUser.photoURL,
          providerId: firebaseUser.providerData[0]?.providerId || 'password'
        });
        setSyncStatus('idle');
      } else {
        setRawUser(null);
        setUser(null);
        setSyncStatus(isFirebaseConfigured ? 'idle' : 'offline');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      return { 
        success: false, 
        error: 'Firebase yapılandırılmamış. Lütfen .env dosyasındaki VITE_FIREBASE_* anahtarlarını kontrol edin.' 
      };
    }

    try {
      setSyncStatus('syncing');
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (err: any) {
      console.error('Google Giriş Hatası:', err);
      setSyncStatus('error');
      let msg = 'Google ile giriş yapılamadı.';
      if (err.code === 'auth/popup-closed-by-user') msg = 'Giriş penceresi kapatıldı.';
      if (err.code === 'auth/cancelled-popup-request') msg = 'İşlem iptal edildi.';
      return { success: false, error: msg };
    }
  };

  const loginWithApple = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured || !auth || !appleProvider) {
      return { 
        success: false, 
        error: 'Firebase yapılandırılmamış. Lütfen .env dosyasındaki VITE_FIREBASE_* anahtarlarını kontrol edin.' 
      };
    }

    try {
      setSyncStatus('syncing');
      await signInWithPopup(auth, appleProvider);
      return { success: true };
    } catch (err: any) {
      console.error('Apple Giriş Hatası:', err);
      setSyncStatus('error');
      let msg = 'Apple ile giriş yapılamadı.';
      if (err.code === 'auth/popup-closed-by-user') msg = 'Giriş penceresi kapatıldı.';
      return { success: false, error: msg };
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured || !auth) {
      return { 
        success: false, 
        error: 'Firebase yapılandırılmamış. Lütfen .env dosyasındaki VITE_FIREBASE_* anahtarlarını kontrol edin.' 
      };
    }

    try {
      setSyncStatus('syncing');
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      return { success: true };
    } catch (err: any) {
      console.error('E-posta Giriş Hatası:', err);
      setSyncStatus('error');
      let msg = 'Giriş yapılamadı. E-posta veya şifre hatalı.';
      if (err.code === 'auth/user-not-found') msg = 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.';
      if (err.code === 'auth/wrong-password') msg = 'Girdiğiniz şifre hatalı.';
      if (err.code === 'auth/invalid-email') msg = 'Geçersiz e-posta adresi.';
      return { success: false, error: msg };
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured || !auth) {
      return { 
        success: false, 
        error: 'Firebase yapılandırılmamış. Lütfen .env dosyasındaki VITE_FIREBASE_* anahtarlarını kontrol edin.' 
      };
    }

    try {
      setSyncStatus('syncing');
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      return { success: true };
    } catch (err: any) {
      console.error('Kayıt Hatası:', err);
      setSyncStatus('error');
      let msg = 'Kayıt oluşturulamadı.';
      if (err.code === 'auth/email-already-in-use') msg = 'Bu e-posta adresi zaten kullanımda.';
      if (err.code === 'auth/weak-password') msg = 'Şifre en az 6 karakter olmalıdır.';
      if (err.code === 'auth/invalid-email') msg = 'Geçersiz e-posta adresi formatı.';
      return { success: false, error: msg };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured || !auth) {
      return { 
        success: false, 
        error: 'Firebase yapılandırılmamış.' 
      };
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      console.error('Şifre Sıfırlama Hatası:', err);
      let msg = 'Şifre sıfırlama e-postası gönderilemedi.';
      if (err.code === 'auth/user-not-found') msg = 'Bu e-posta adresine ait hesap bulunamadı.';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
      setSyncStatus('idle');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        rawUser,
        loading,
        isConfigured: isFirebaseConfigured,
        syncStatus,
        lastSyncedAt,
        lastSyncMessage,
        syncSettings,
        savedWritesCount,
        updateSyncSettings,
        resetSavedWrites,
        refreshSavedWrites,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithGoogle,
        loginWithApple,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        updateSyncState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
