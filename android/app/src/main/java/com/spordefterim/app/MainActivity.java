package com.spordefterim.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
            }
        } catch (Exception ignored) {}
    }
}

