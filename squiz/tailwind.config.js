/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "nude-light": "#FFF3E0", // Be sáng
        "brown-dark": "#4E342E", // Nâu đậm
        "blue-deep": "#1E88E5", // Xanh dương trầm
        "orange-soft": "#FFAB91", // Cam nhạt
        emerald: "#009688", // Xanh lục bảo
        "red-wine": "#C62828", // Đỏ đô
        "orange-semibold": "#F09F87", //Cam đậm
        "nude-semibold": "#ffebcc",
        modal: "rgba(0, 0, 0, 0.6)",
      },
      borderWidth: {
        1: "1px",
        3: "3px",
      },
    },
  },
  plugins: [],
};
