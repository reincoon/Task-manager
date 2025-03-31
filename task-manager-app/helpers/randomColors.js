import { theme } from '../twrnc';

// Function to generate a random colour from a predefined set
export const getRandomColour = () => {
    const colors = [
        theme.colors.sky, theme.colors.gold, theme.colors.cinnabar,
        theme.colors.forest, theme.colors.violet, theme.colors.teal,
        theme.colors.mint, theme.colors.lavender, theme.colors.neon,
        theme.colors.cerise, theme.colors.lime, theme.colors.magenta,
        theme.colors.gray, theme.colors.brown, theme.colors.pink, 
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

