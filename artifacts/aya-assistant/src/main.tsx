import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeDebugConsole } from "./lib/debug";

// Initialize debug console if enabled
initializeDebugConsole();

createRoot(document.getElementById("root")!).render(<App />);
