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
      // Handle global 401s
      if (response.status === 401 && resource !== '/api/auth/login') {
        localStorage.removeItem("aya_token");
        window.dispatchEvent(new Event('auth-expired'));
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  return originalFetch(...args);
};

export {};
