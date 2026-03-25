// We override window.fetch to automatically inject the Authorization header
// Since the generated orval client uses customFetch which relies on fetch,
// this ensures all API calls are authenticated without modifying the generated code.

const originalFetch = window.fetch;

// Voice and TTS routes are transient media endpoints. A 401 from these routes
// must NOT redirect the user to /login — voice failures (TTS quota, network
// drop on mobile during mic permission dialog, proxy header issues) are handled
// by the voice hooks via an error toast. If the token is truly expired, the
// next core API call (chat message, missions, /auth/me) will return 401 and
// the redirect will happen cleanly at that point, without interrupting a live
// voice session.
const VOICE_TTS_PREFIXES = ['/api/voice/', '/api/tts/'];

function isVoiceTtsRoute(url: string): boolean {
  return VOICE_TTS_PREFIXES.some(prefix => url.startsWith(prefix));
}

window.fetch = async (...args) => {
  const [resource, config] = args;
  const token = localStorage.getItem("aya_token");
  
  // Only intercept requests to our API
  const isApiRequest = typeof resource === 'string' && resource.startsWith('/api');
  const isVoiceRequest = isApiRequest && resource.includes('/voice/');

  if (token && isApiRequest) {
    // For voice requests that already have Authorization, pass through
    // For other requests, ensure Authorization is added
    const existingHeaders = config?.headers;
    const hasExistingAuth = 
      (existingHeaders instanceof Headers && existingHeaders.has('Authorization')) ||
      (typeof existingHeaders === 'object' && existingHeaders && 'Authorization' in existingHeaders) ||
      (typeof existingHeaders === 'object' && existingHeaders && 'authorization' in existingHeaders);
    
    // Build headers as plain object to avoid Headers API conversion issues on Android
    const plainHeaders: Record<string, string> = {};
    
    // Copy existing headers if they're a plain object
    if (typeof existingHeaders === 'object' && !(existingHeaders instanceof Headers)) {
      Object.assign(plainHeaders, existingHeaders);
    }
    
    // Add Authorization if not already present
    if (!hasExistingAuth) {
      plainHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const newConfig = { ...(config || {}), headers: plainHeaders };
    
    if (isVoiceRequest) {
      console.log("[FETCH_INTERCEPTOR_VOICE]", {
        resource,
        method: config?.method || "GET",
        hasAuthHeader: !!plainHeaders['Authorization'],
        credentialsMode: newConfig.credentials || "default",
      });
    }
    
    try {
      const response = await originalFetch(resource, newConfig);

      if (response.status === 401 && resource !== '/api/auth/login') {
        if (isVoiceTtsRoute(resource)) {
          // Voice/TTS 401 — log the failure but do NOT dispatch auth-expired.
          // The voice hook (use-voice-speaker / use-voice-recorder) will surface
          // this as a toast error. The user's session and navigation are preserved.
          // If the token is truly expired, the next non-voice API call will redirect.
          console.warn("[AUTH_INTERCEPTOR] 401 on voice/TTS route — suppressing auth-expired to preserve session", {
            url: resource,
            note: "session token may still be valid for core routes"
          });
        } else {
          // Real server-side auth rejection on a core route — clear session and notify
          console.warn("[AUTH_INTERCEPTOR] 401 on core route — dispatching auth-expired", {
            url: resource,
            reason: "server rejected token"
          });
          localStorage.removeItem("aya_token");
          window.dispatchEvent(new Event('auth-expired'));
        }
      } else if (response.status >= 400) {
        // Non-auth errors (400, 403, 500…) — log only, never force logout
        console.warn("[AUTH_INTERCEPTOR] non-auth error", { url: resource, status: response.status, note: "NOT triggering logout" });
      }

      return response;
    } catch (error) {
      // Network error (no response) — log only, never force logout
      console.warn("[AUTH_INTERCEPTOR] network error (no response)", { url: resource, error: String(error), note: "NOT triggering logout" });
      throw error;
    }
  }

  // No token or not an API request — pass through unchanged
  if (!token && isApiRequest) {
    console.warn("[AUTH_INTERCEPTOR] API request with no token in localStorage", { url: resource });
  }
  return originalFetch(...args);
};

export {};
