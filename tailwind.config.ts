import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        boulevard: {
          red: '#D61F26', // Rojo Ferrari/Boulevard
          dark: '#050505', // Negro Profundo
          glass: 'rgba(255, 255, 255, 0.03)',
        }
      },
      backgroundImage: {
        'premium-gradient': 'linear-gradient(to bottom, rgba(214,31,38,0.05), rgba(0,0,0,1))',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(214, 31, 38, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};
export default config;