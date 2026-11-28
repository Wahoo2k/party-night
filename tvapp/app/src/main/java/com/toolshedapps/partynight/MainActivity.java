package com.toolshedapps.partynight;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * The whole app: one full-screen web view showing the Party Night TV page.
 * The remote's arrows and OK button reach the page as arrow keys and Enter, which the page already understands.
 * Back first asks the page whether it has somewhere to go back to; only a second Back at the top level leaves.
 */
public class MainActivity extends Activity {
    private static final String HOME = "wahoo2k.github.io";
    private WebView web;
    private long lastBack;
    private final Handler main = new Handler(Looper.getMainLooper());

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);   // a party is not a reason to dim the TV
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(11, 15, 44));
        setContentView(web);
        immersive();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                    // the room survives the app being closed and reopened
        s.setMediaPlaybackRequiresUserGesture(false);    // narration and music start without a click
        s.setUserAgentString(s.getUserAgentString() + " PartyNightTV/" + BuildConfig.VERSION_NAME);
        s.setSupportZoom(false);
        // The page is laid out at exactly the screen's width and never zoomed by the web view. (With the 'wide
        // viewport' and 'overview' modes on, the view re-zoomed the whole page whenever something reached past an edge.)
        s.setLoadWithOverviewMode(false);
        s.setUseWideViewPort(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false); web.setHorizontalScrollBarEnabled(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOME.equals(u.getHost())) return false;                 // our own pages stay in the app
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) offline();
            }
        });
        if (saved != null) web.restoreState(saved); else web.loadUrl(BuildConfig.START_URL);
        web.requestFocus();
    }

    /** No connection: say so plainly and keep trying, so the game appears by itself when the network is back. */
    private void offline() {
        String page = "<html><body style='margin:0;height:100vh;display:grid;place-items:center;background:#0b0f2c;color:#f3f1ff;font:28px sans-serif;text-align:center'>"
                + "<div><div style='font-size:64px'>📡</div><p><b>Party Night can't reach the internet.</b></p><p style='opacity:.7'>Check the TV's connection. Trying again in a few seconds…</p></div></body></html>";
        web.loadDataWithBaseURL(null, page, "text/html", "utf-8", null);
        main.postDelayed(() -> web.loadUrl(BuildConfig.START_URL), 6000);
    }

    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    public void onWindowFocusChanged(boolean has) { super.onWindowFocusChanged(has); if (has) immersive(); }

    @Override
    public boolean onKeyDown(int code, KeyEvent e) {
        if (code == KeyEvent.KEYCODE_BACK) {
            // The page answers true if it went back a screen (a game's join screen to the menu, settings to the menu).
            web.evaluateJavascript("(function(){try{return !!(window.partyBack&&window.partyBack())}catch(e){return false}})()", handled -> {
                if ("true".equals(handled)) return;
                long now = System.currentTimeMillis();
                if (now - lastBack < 2500) finish();
                else { lastBack = now; Toast.makeText(this, R.string.back_again, Toast.LENGTH_SHORT).show(); }
            });
            return true;
        }
        return super.onKeyDown(code, e);
    }

    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
    // Another app in front (or the TV's home screen): silence the page first, then stop its timers, so no music or
    // narration keeps playing behind whatever the person switched to. Coming back undoes both.
    @Override protected void onPause() { web.evaluateJavascript("window.partyHush&&window.partyHush(true)", null); web.onPause(); web.pauseTimers(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); web.resumeTimers(); web.onResume(); web.evaluateJavascript("window.partyHush&&window.partyHush(false)", null); immersive(); }
    @Override protected void onDestroy() { main.removeCallbacksAndMessages(null); web.destroy(); super.onDestroy(); }
}
