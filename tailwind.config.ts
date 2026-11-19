import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          canvas: "#FAF8F5",
          card: "#FFFFFF",
          border: "#EAE6DF",
          peach: {
            50: "#FFF7F2",
            100: "#FFF0E6",
            200: "#FCDCCB",
            300: "#F8BCA0",
            400: "#F1997A",
            500: "#E2765A",
            600: "#CB6145",
            700: "#B04D34",
            900: "#8A3510",
          },
          sage: {
            50: "#F4F9F4",
            100: "#EDF5EE",
            200: "#CFE2D1",
            300: "#AECDB2",
            500: "#5A9663",
            700: "#3D6F44",
            900: "#23522A",
          },
          blue: {
            50: "#F5F9FD",
            100: "#EEF5FC",
            200: "#D1E3F6",
            300: "#A9CBED",
            500: "#5393CE",
            700: "#2C689D",
            900: "#184F7D",
          },
          lavender: {
            50: "#F9F7FD",
            100: "#F4F0FB",
            200: "#E0D4F5",
            300: "#C6B2EA",
            500: "#8E6DC5",
            700: "#69479E",
            900: "#522F88",
          },
          rose: {
            50: "#FDF6F7",
            100: "#FDF0F2",
            200: "#F8D0D6",
            300: "#F1ABB6",
            500: "#D95D75",
            700: "#B23A51",
            900: "#8A2338",
          },
          honey: {
            50: "#FEFCF5",
            100: "#FDF6E2",
            200: "#F6E6B8",
            300: "#EECD85",
            500: "#D4A02A",
            700: "#9C7214",
            900: "#6E4D05",
          },
          ink: {
            900: "#201E1D",
            800: "#33302D",
            700: "#4D4845",
            500: "#75706B",
            400: "#9E9892",
            300: "#BFB9B2",
            200: "#DDD8D0",
            100: "#EFECE6",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
