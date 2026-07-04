/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Fine serif for the label body & titles — a Louvre catalogue voice.
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        // Small-caps sans for meta, UI chrome and gallery signage.
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        // Museum palette: gallery white, warm paper, charcoal ink, brass.
        gallery: {
          wall: "#f4f1ea", // gallery-white wall
          paper: "#fbfaf6", // the label card itself
          ink: "#26241f", // near-black charcoal text
          soft: "#6b665c", // muted meta text
          line: "#e2ddd1", // hairline dividers
          brass: "#b08d57", // brass plaque accent
          brassDeep: "#8a6d3b", // deeper brass / hover
          shadow: "#d8d2c4", // soft card shadow tone
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(38,36,31,0.04), 0 12px 32px -12px rgba(38,36,31,0.18)",
        plaque: "0 2px 4px rgba(38,36,31,0.10), 0 20px 48px -20px rgba(38,36,31,0.30)",
      },
    },
  },
  plugins: [],
};
