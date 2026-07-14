/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
  
        paper: "#FFFFFF",
        ink: "#212121", 
        pink: "#FF8F9C", 
        yellow: "#F6A355", 
        grape: "#454545", 
        line: "#EDEDED",
        cultured: "#EDEDED",
        silver: "#999999", 
        green: "#46C389",
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
