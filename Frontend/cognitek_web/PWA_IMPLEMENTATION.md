# PWA Implementation Guide for CogniTek 📱

## ✅ What Has Been Done

We have successfully configured the React Frontend (`cognitek_web`) to work as a Progressive Web App (PWA). Here is a summary of the changes:

1.  **Dependencies Installed**:
    - `vite-plugin-pwa` is installed to handle service worker generation and manifest injection.

2.  **Vite Configuration (`vite.config.js`)**:
    - Configured `VitePWA` plugin with `registerType: 'autoUpdate'` for seamless updates.
    - Defined the **Web App Manifest**:
        - **Name**: Cognitek
        - **Theme Color**: `#050505` (Matches "Tech Glass" theme)
        - **Display**: `standalone` (Native app feel)
        - **Icons**: Links to `pwa-192x192.png` and `pwa-512x512.png`.
    - **Offline Strategies (Workbox)**:
        - `navigateFallback: '/index.html'`: Ensures the app works offline for Single Page Application routing.
        - `globPatterns`: Precaches HTML, CSS, JS, and images so the app loads instantly.
        - `runtimeCaching`: Configured `NetworkFirst` strategy for API calls to `https://cognitek-backend.onrender.com/api`. This means the app tries to fetch fresh data, but falls back to the cache if offline.

3.  **HTML Meta Tags (`index.html`)**:
    - Added `meta` tags for `theme-color` and `apple-mobile-web-app-capable` to ensure it looks great on iOS and Android.

4.  **Assets**:
    - Validated that `pwa-192x192.png` and `pwa-512x512.png` exist in the `public` folder.

---

## 🛠️ What You Need To Do

### 1. 🧪 Test the PWA

PWAs behave differently in development (`npm run dev`) vs production (`npm run build`). To fully test functionality (Service Worker, Caching, Install capability):

1.  **Build the App**:
    ```bash
    cd Frontend/cognitek_web
    npm run build
    ```
    This generates the `dist` folder with the service worker (`sw.js`).

2.  **Preview the Build**:
    ```bash
    npm run preview
    ```
    This starts a local server (usually `http://localhost:4173`) serving the production build.

3.  **Verify in Browser**:
    - Open `http://localhost:4173` in generic Chrome/Edge.
    - Open **DevTools (F12) -> Application -> Service Workers**. You should see a service worker registered and running.
    - **Go Offline**: In DevTools -> Network, set "Offline". Refresh the page. The app should still load!
    - **Install**: Look for the "Install" icon in the address bar (Chrome/Edge) or "Add to Home Screen" in mobile simulation.

### 2. 🎨 Customize Icons (Optional)

The current icons in `public/` are likely default placeholders.
- Ensure `pwa-192x192.png` and `pwa-512x512.png` match your CogniTek branding.
- If you change them, you may want to regenerate the `favicon.ico` and `apple-touch-icon.png` as well for consistency.

### 3. 🖼️ Add Screenshots (Optional for "App Store" feel)

To make the installation prompt look more professional (especially on mobile), add screenshots to `manifest` in `vite.config.js`:

```javascript
manifest: {
  // ... existing config
  screenshots: [
    {
      src: 'screenshot-mobile.png',
      sizes: '390x844',
      type: 'image/png',
      form_factor: 'narrow',
      label: 'Mobile Home Screen'
    },
    {
      src: 'screenshot-desktop.png',
      sizes: '1920x1080',
      type: 'image/png',
      form_factor: 'wide',
      label: 'Dashboard'
    }
  ]
}
```
*Note: You would need to add these image files to the `public` folder.*

### 4. 🚀 Local vs Remote API

The current caching rule targets `https://cognitek-backend.onrender.com/api`.
- If you are testing offline mode with a **local backend**, the API requests won't be cached unless you update the `urlPattern` in `vite.config.js`.
- For production deployment, the current setup is correct.

---

## 📱 Mobile Verification

To test on your phone:
1.  Deploy the frontend to Vercel (see `DEPLOYMENT.md`).
2.  Open the Vercel URL on your phone.
3.  **iOS**: Tap "Share" -> "Add to Home Screen".
4.  **Android**: Tap specific Install prompt or "Add to Home Screen" from menu.
5.  Launch from Home Screen. It should open without the browser UI (Standalone mode).
