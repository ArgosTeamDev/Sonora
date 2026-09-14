/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-base": "var(--bg-base)",
        "bg-deep": "var(--bg-deep)",
        "bg-surface": "var(--bg-surface)",
        "bg-raised": "var(--bg-raised)",
        "bg-hover": "var(--bg-hover)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        accent: "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        "accent-cta": "var(--accent-cta)",
        "on-accent": "var(--on-accent)",
        "on-cta": "var(--on-cta)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Mobile-first: the bare name is the small-screen size; "-lg" is desktop,
        // applied through sm:/md: variants where a screen needs it.
        "page-title": ["1.875rem", { lineHeight: "2.125rem", fontWeight: "800" }],
        "page-title-lg": ["3rem", { lineHeight: "3.25rem", fontWeight: "800" }],
        "section-title": ["1.0625rem", { lineHeight: "1.375rem", fontWeight: "600" }],
        "section-title-lg": ["1.125rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        body: ["0.9375rem", { lineHeight: "1.5rem" }],
        "body-lg": ["1rem", { lineHeight: "1.625rem" }],
        secondary: ["0.8125rem", { lineHeight: "1.125rem" }],
        label: [
          "0.6875rem",
          { lineHeight: "0.875rem", fontWeight: "700", letterSpacing: "0.55px" },
        ],
      },
    },
  },
  plugins: [],
};
