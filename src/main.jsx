import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Demo mode: in-browser mock of the bot API so the dashboard can be explored
// without a running bot. Set VITE_MOCK=1 (npm run dev:mock) to enable; the
// condition below is statically replaced at build time, so production bundles
// never include the mock.
if (import.meta.env.VITE_MOCK === "1") {
  import("./lib/mockBackend").then((m) => m.installMockBackend());
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
