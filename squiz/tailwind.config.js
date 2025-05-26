/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: "#FF7C4D",
        emerald: "#009688", // Xanh lục bảo
        "red-wine": "#C62828", // Đỏ đô
        modal: "rgba(0, 0, 0, 0.6)",
        background: "#fcfbfa",
        darkblue: "#153a43",
        dim: "#829095",
        rgba: "rgb(104 104 104 / 50%)",
        littleblue: "rgb(42, 48, 63)",
      },
      borderWidth: {
        1: "1px",
        3: "3px",
      },
      animation: {
        "spin-reverse": "spin-reverse 1s linear infinite",
        "bounce-dots": "bounce-dots 1.4s infinite",
      },
      keyframes: {
        "spin-reverse": {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "bounce-dots": {
          "0%, 20%": {
            opacity: "0",
          },
          "50%": {
            opacity: "1",
          },
          "100%": {
            opacity: "0",
          },
        },
      },
    },
  },
  plugins: [],
};
