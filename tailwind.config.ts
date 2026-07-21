import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Brand DNA: use this exact saffron for fills and emphasis text.
          // Text/icons on saffron fills stay white by deliberate founder choice.
          orange: "#FF9932",          // locked — never change
          cream: "#FFF4E6",           // page ground
          ink: "#2B1503",             // body text on cream (14.9:1)
          muted: "#85613F",           // secondary text on cream (5.1:1)
          line: "#F3E2CD",            // hairlines on cream
          card: "#FFFFFF",            // elevated surfaces
          night: "#050505",           // preserved dark — hero + dark-over-imagery only
          espresso: "#241102",        // footer ground
          "espresso-muted": "#C9A985", // footer secondary text (8.2:1)
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
