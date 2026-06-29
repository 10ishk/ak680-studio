/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        moss: "#455f4b",
        copper: "#b66b3b",
        cloud: "#f5f7f2",
        line: "#dfe5da",
      },
    },
  },
  plugins: [],
};

