import PropTypes from 'prop-types';
import { View } from 'react-native';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from './ThemedText';
import tw, { theme } from '../twrnc';
import ActionButton from './ActionButton';

const GuestView = ({ onLogIn, onSignUp }) => {
    const { isDarkMode, fontScale } = useTheme();

    return (
        <View style={tw`p-6 rounded-xl shadow self-center w-4/5 ${isDarkMode ? 'bg-darkCardBg' : 'bg-white'}`}>
            <ThemedText variant="base" style={tw`text-center mb-4`}>
                You are logged in as a guest. To save your data, please log in or sign up.
            </ThemedText>
    
            <View style={tw`flex-row justify-between mt-2`}>
                <ActionButton 
                    title="Log In" 
                    onPress={onLogIn} 
                    bgColor={isDarkMode ? theme.colors.darkSky : theme.colors.sky} 
                    shadowColor={isDarkMode ? theme.colors.darkMint : theme.colors.evergreen} 
                    iconName="log-in-outline" 
                    textColor={theme.colors.textPrimary} 
                    width="48%" 
                />
                <ActionButton 
                    title="Sign Up" 
                    onPress={onSignUp} 
                    bgColor={isDarkMode ? theme.colors.darkMint : theme.colors.mint} 
                    shadowColor={isDarkMode ? theme.colors.darkEvergreen : theme.colors.forest} 
                    iconName="person-add-outline" 
                    textColor={theme.colors.textPrimary} 
                    width="48%" 
                />
            </View>
        </View>
    );
};

GuestView.propTypes = {
    onLogIn: PropTypes.func.isRequired,
    onSignUp: PropTypes.func.isRequired,
};

export default GuestView;