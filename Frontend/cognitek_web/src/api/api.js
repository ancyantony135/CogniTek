import axios from 'axios';

// When testing from a phone or any device OTHER than the machine running
// the backend, VITE_API_URL in .env must be set to your current ngrok URL.
// e.g.: VITE_API_URL=https://xxxx-xx-xx-xxx-xx.ngrok-free.app
//
// For local machine testing only, omit the env var or set it to nothing.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: {
    // Required to bypass the ngrok browser-warning interstitial page.
    // Without this, ngrok returns an HTML warning page instead of the API response.
    'ngrok-skip-browser-warning': 'true',
  },
});

export default api;