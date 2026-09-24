import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // mapbox-gl is ~1.8 MB on its own and is loaded lazily after first paint.
  build: { chunkSizeWarningLimit: 2000 },
});
