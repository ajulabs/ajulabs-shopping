module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "aju-orange": "#F2760F",
        "aju-navy":   "#000933",
        "aju-royal":  "#17258E",
        "aju-mid":    "#2A3156",
        "aju-muted":  "#9099B3",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};