import { create } from 'twrnc';

const tw = create({
    theme: {
        extend: {
            colors: {
                light: '#F8F9FA',       // Light Gray for background 
                mint: '#A4FCB4',       // Fresh Mint Green
                sky: '#9EE1F0',        // Soft Sky Blue
                forest: '#5D8765',     // Muted Forest Green
                evergreen: '#416147',  // Deep Evergreen
                magenta: '#7A0064',    // Bold Deep Magenta
                cinnabar: '#E74C3C ',  // Cinnabar Red
                textPrimary: '#212529',   // Dark text for optimal readability
                textSecondary: '#333333', // Deeper gray for contrast
                // Dark Theme Colours
                darkBg: '#121212',               // Dark background
                darkTextPrimary: '#E5E5E5',        // Light text for readability on dark background
                darkTextSecondary: '#CCCCCC',      // Lighter secondary text
                darkMint: '#8FD3A8',              // Slightly muted mint for dark mode
                darkSky: '#89CFF0',               // A toned-down sky blue
                darkForest: '#4C6B4F',            // Darker forest green
                darkEvergreen: '#365940',         // Deep, subdued evergreen
                darkMagenta: '#69006B',           // A rich, deep magenta for emphasis
                darkCinnabar: '#C94133',           // Dark Cinnabar Red
            },
            boxShadow: {
                // Custom shadow using the evergreen color with reduced opacity
                custom: '0 4px 6px rgba(65, 97, 71, 0.3)',
            },
            fontFamily: {
                sans: ['Roboto', 'sans-serif'],
                inter: ['Inter', 'system-ui', 'sans-serif'],
                poppins: ['Poppins', 'sans-serif'],
            },
        },
    },
});

// Export the configured tw function
export default tw;
