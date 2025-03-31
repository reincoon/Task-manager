import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import { CopilotStep, walkthroughable } from 'react-native-copilot';

const WalkthroughableView = walkthroughable(View);

export default function FloatingActionButton({ onPress }) {
    const { isDarkMode, fontScale } = useTheme();
    const bgColor = isDarkMode ? theme.colors.lavender : theme.colors.magenta;

    return (
        <TouchableOpacity 
            style={[
                tw`absolute bottom-6 right-6 w-16 h-16 rounded-full shadow justify-center items-center`, 
                { 
                    backgroundColor: bgColor,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 6,
                }]} 
            onPress={onPress}
        >
            <CopilotStep text="Tap here to create a new todo list." order={1} name="todoListStep">
                <WalkthroughableView>
                    <Ionicons name="add" size={theme.fontSize.xl3 * fontScale} color={isDarkMode ? theme.colors.darkMagenta : theme.colors.lavender} />
                </WalkthroughableView>
            </CopilotStep>
        </TouchableOpacity>
    );
};