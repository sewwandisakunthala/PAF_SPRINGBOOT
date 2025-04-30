/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        facebook: {
          primary: '#1877F2',      // Facebook Blue
          hover: '#166FE5',        // Darker Blue for hover
          dark: '#FFFFFF',         // Changed from '#18191A' to white
          card: '#F8F9FA',         // Changed from '#242526' to light gray
          hover2: '#E9ECEF',       // Changed from '#3A3B3C' to lighter gray
          text: {
            primary: '#000000',    // Changed from '#E4E6EB' to black
            secondary: '#6C757D',  // Changed from '#B0B3B8' to gray
          },
          button: {
            secondary: '#CED4DA',  // Changed from '#4B4C4F' to light gray
          },
          divider: '#DEE2E6',      // Changed from '#3E4042' to light gray
          input: '#F8F9FA',        // Changed from '#3A3B3C' to light gray
          active: '#2D88FF',       // Active state blue
        }
      }
    }
  },
  plugins: [],
};
