import { createContext, useState, useContext } from 'react';

const ThemeContext = createContext({
    isDarkMode: false,
    toggleTheme: () => {},
    fontScale: 1,
    setFontScale: () => {}
});

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [fontScale, setFontScale] = useState(1);

    const toggleTheme = () => setIsDarkMode((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, fontScale, setFontScale }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);