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
    },
  },
  plugins: [],
};
