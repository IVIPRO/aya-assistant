/**
 * Mobile debugging console initialization.
 * Loads Eruda when debug mode is enabled.
 * 
 * Debug mode is enabled when:
 * - URL contains ?debug=true
 * - localStorage key "AYA_DEBUG" is set to "true"
 */

export function initializeDebugConsole(): void {
  // Check if debug mode should be enabled
  const urlParams = new URLSearchParams(window.location.search);
  const debugFromUrl = urlParams.get("debug") === "true";
  const debugFromLocalStorage = localStorage.getItem("AYA_DEBUG") === "true";
  const isDebugMode = debugFromUrl || debugFromLocalStorage;

  if (!isDebugMode) {
    return;
  }

  // Load Eruda from CDN
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/eruda@3.0.1/dist/eruda.min.js";
  script.async = true;

  script.onload = () => {
    // Initialize Eruda after script loads
    if (window.eruda) {
      (window.eruda as any).init();
      console.log("[ERUDA] Debug console initialized");
      console.log("[DEBUG_MODE] enabled via URL or localStorage");
    }
  };

  script.onerror = () => {
    console.error("[ERUDA] Failed to load debug console");
  };

  document.head.appendChild(script);

  // Also load Eruda CSS for proper styling
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdn.jsdelivr.net/npm/eruda@3.0.1/dist/eruda.min.css";
  document.head.appendChild(link);
}

// Type declaration for Eruda on window object
declare global {
  interface Window {
    eruda?: {
      init: () => void;
    };
  }
}
