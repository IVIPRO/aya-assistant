// We override window.fetch to automatically inject the Authorization header
// Since the generated orval client uses customFetch which relies on fetch,
// this ensures all API calls are authenticated without modifying the generated code.

const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const [resource, config] = args;
  const token = localStorage.getItem("aya_token");
  
  // Only intercept requests to our API
  const isApiRequest = typeof resource === 'string' && resource.startsWith('/api');

  if (token && isApiRequest) {
    // Use Headers API to properly copy existing headers (including Content-Type)
    // Spreading a Headers instance with {...} loses all headers, so we use new Headers()
    const mergedHeaders = new Headers(config?.headers);
    mergedHeaders.set('Authorization', `Bearer ${token}`);

    const newConfig = { ...(config || {}), headers: mergedHeaders };
    
    try {
      const response = await originalFetch(resource, newConfig);

      if (response.status === 401 && resource !== '/api/auth/login') {
        // Real server-side auth rejection — clear session and notify
        console.warn("[AUTH_INTERCEPTOR] 401 received", { url: resource, status: response.status, reason: "server rejected token — dispatching auth-expired" });
        localStorage.removeItem("aya_token");
        window.dispatchEvent(new Event('auth-expired'));
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

  return originalFetch(...args);
};

export {};
