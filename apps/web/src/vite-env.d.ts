/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL the frontend calls for the API, e.g. "https://api.example.com/api".
  // Left unset in development: the relative "/api" default goes through
  // Vite's dev proxy (see vite.config.ts) to the local NestJS server.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
