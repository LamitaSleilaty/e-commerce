/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette matched to the "Anon" reference template (project_2):
        // eerie-black / salmon-pink / sandy-brown / cultured / onyx.
        paper: "#FFFFFF",
        ink: "#212121", // eerie-black
        pink: "#FF8F9C", // salmon-pink (primary accent)
        yellow: "#F6A355", // sandy-brown (secondary accent)
        grape: "#454545", // onyx (dark secondary, replaces old purple)
        line: "#EDEDED", // cultured (borders / hairlines)
        cultured: "#EDEDED",
        silver: "#999999", // spanish-gray (muted text)
        green: "#46C389", // ocean-green (success / in stock)
      },
      borderRadius: {
        anon: "10px",
        "anon-sm": "5px",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
