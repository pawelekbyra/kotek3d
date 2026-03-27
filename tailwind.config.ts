import type { Config } from "tailwindcss"

const config = {
  content: [
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
} satisfies Config

export default config
