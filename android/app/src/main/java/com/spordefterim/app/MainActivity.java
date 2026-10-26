package com.spordefterim.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    private int safeTopDp = 28;
    private int safeBottomDp = 16;
    private int safeLeftDp = 0;
    private int safeRightDp = 0;
    private int imeBottomDp = 0;

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}

    private void injectSafeAreaInsetsToWebView() {
        try {
            if (getBridge() == null) return;
            final WebView webView = getBridge().getWebView();
            if (webView == null) return;

            final String js = String.format(
                Locale.US,
                "(function(){var r=document.documentElement;if(r){r.classList.add('is-native');r.style.setProperty('--native-safe-top','%dpx');r.style.setProperty('--native-safe-bottom','%dpx');r.style.setProperty('--native-safe-left','%dpx');r.style.setProperty('--native-safe-right','%dpx');r.style.setProperty('--ime-bottom','%dpx');}})();",
                safeTopDp, safeBottomDp, safeLeftDp, safeRightDp, imeBottomDp
            );
            webView.post(() -> {
                try {
                    webView.evaluateJavascript(js, null);
                } catch (Exception ignored) {}
            });
        } catch (Exception ignored) {}
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            Window window = getWindow();
            // Edge-to-edge layout: content flows behind status bar and navigation bar
            WindowCompat.setDecorFitsSystemWindows(window, false);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                window.setStatusBarColor(Color.TRANSPARENT);
                window.setNavigationBarColor(Color.TRANSPARENT);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                window.setNavigationBarContrastEnforced(false);
                window.setStatusBarContrastEnforced(false);
            }

            View decorView = window.getDecorView();
            WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, decorView);
            if (insetsController != null) {
                // GymPad uses dark theme (#0b0f17). Light icons/text (false) are required for contrast.
                insetsController.setAppearanceLightStatusBars(false);
                insetsController.setAppearanceLightNavigationBars(false);
            }

            // Dynamically measure systemBars + displayCutout + IME (keyboard) and inject into CSS variables
            ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
                try {
                    float density = getResources().getDisplayMetrics().density;
                    if (density <= 0f) density = 1f;

                    Insets sysInsets = windowInsets.getInsets(
                        WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                    );
                    Insets imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime());

                    safeTopDp = Math.max(24, Math.round(sysInsets.top / density));
                    safeBottomDp = Math.max(12, Math.round(sysInsets.bottom / density));
                    safeLeftDp = Math.max(0, Math.round(sysInsets.left / density));
                    safeRightDp = Math.max(0, Math.round(sysInsets.right / density));
                    imeBottomDp = Math.max(0, Math.round(Math.max(0, imeInsets.bottom - sysInsets.bottom) / density));

                    injectSafeAreaInsetsToWebView();
                } catch (Exception ignored) {}
                return WindowInsetsCompat.CONSUMED;
            });
        } catch (Exception ignored) {}

        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setJavaScriptCanOpenWindowsAutomatically(true);
                settings.setSupportMultipleWindows(false);
                String ua = settings.getUserAgentString();
                if (ua != null && ua.contains("; wv")) {
                    settings.setUserAgentString(ua.replace("; wv", ""));
                }
                webView.postDelayed(this::injectSafeAreaInsetsToWebView, 350);
                webView.postDelayed(this::injectSafeAreaInsetsToWebView, 1200);
                webView.postDelayed(this::injectSafeAreaInsetsToWebView, 2500);
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onResume() {
        super.onResume();
        injectSafeAreaInsetsToWebView();
    }
}

