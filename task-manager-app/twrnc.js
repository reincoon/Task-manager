import { create } from 'twrnc';

export const theme = {
    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        xl2: 24,
        xl3: 32,
        xl4: 40,
        xl5: 48,
    },
    colors: {
        white: '#FFFFFF',       // White
        light: '#FAFAFA',       // Light Gray for background 
        columnBg: '#F2F2F2',    // Light Gray for Kanban columns
        gold: '#FFBF00',        // Dark Golden Yellow
        greenCyan: '#48BB78',   // Green Success
        mint: '#A4FCB4',       // Fresh Mint Green
        sky: '#9EE1F0',        // Soft Sky Blue
        forest: '#5D8765',     // Muted Forest Green
        evergreen: '#416147',  // Deep Evergreen
        magenta: '#7A0064',    // Bold Deep Magenta
        cinnabar: '#E74C3C',  // Cinnabar Red
        lavender: '#DFC5FE',  // Lignt Lavender
        orange: '#FFA500',      // Bright Orange
        violet: '#805CFB',     // Violet
        neon: '#1F51FF',       // Neon Blue
        cerise: '#DE3163',     // Cerise Pink
        lime: '#DAF7A6',       //Soft Green
        teal: '#1ABC9C' ,
        pink: '#FF69B4',
        gray: '#95A5A6',
        brown: '#8B4513',
        textPrimary: '#212529',   // Dark text for optimal readability
        textSecondary: '#333333', // Deeper gray for contrast
        // Dark Theme Colours
        darkBg: '#121212',               // Dark background
        darkTextPrimary: '#E5E5E5',        // Light text for readability on dark background
        darkTextSecondary: '#CCCCCC',      // Lighter secondary text
        darkMint: '#8FD3A8',              // Slightly muted mint for dark mode
        darkSky: '#89CFF0',               // A toned-down sky blue
        darkForest: '#4D8765',            // Darker forest green
        darkEvergreen: '#365940',         // Deep, subdued evergreen
        darkMagenta: '#69006B',           // A rich, deep magenta for emphasis
        darkCinnabar: '#C94133',           // Dark Cinnabar Red
        darkViolet: '#533181',             // Dark Violet
        darkCardBg: '#1F2937',             // Dark Gray
    },
};

const tw = create({
    theme: {
        extend: {
            colors: theme.colors,
            boxShadow: {
                // Custom shadow using the evergreen color with reduced opacity
                custom: '0 4px 6px rgba(65, 97, 71, 0.3)',
            },
            fontFamily: {
                'inter-var': ['Inter-Var', 'system-ui', 'sans-serif'],
                'poppins-bold': ['Poppins-Bold', 'sans-serif'],
                'poppins-medium': ['Poppins-Medium', 'sans-serif'],
                'poppins-regular': ['Poppins-Regular', 'sans-serif'],
                'poppins-semibold': ['Poppins-SemiBold', 'sans-serif'],
                'roboto-var': ['Roboto-Var', 'system-ui', 'sans-serif'],
            },
            fontSize: theme.fontSize,
        },
    },
});

export default tw;
