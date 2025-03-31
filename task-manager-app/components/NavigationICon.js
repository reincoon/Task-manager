import { Ionicons } from '@expo/vector-icons';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { View } from 'react-native';

const WalkthroughableView = walkthroughable(View);

export default function NavigationIcon({ routeName, color, size }) {
    let iconName = '';
    let copilotOrder = 1;
    let copilotName = '';
    let copilotText = '';

    if (routeName === 'HomeStack') {
        iconName = 'home-outline';
        copilotOrder = 5;
        copilotName = 'homeNavStep';
        copilotText = 'Tap here to go to the Home screen.';
    } else if (routeName === 'Statistics') {
        iconName = 'stats-chart-outline';
        copilotOrder = 6;
        copilotName = 'statisticsNavStep';
        copilotText = 'Tap here to view your statistics.';
    } else if (routeName === 'SettingsStack') {
        iconName = 'settings-outline';
        copilotOrder = 7;
        copilotName = 'settingsNavStep';
        copilotText = 'Tap here to access your settings.';
    }

    return (
        <CopilotStep text={copilotText} order={copilotOrder} name={copilotName}>
            <WalkthroughableView>
                <Ionicons name={iconName} size={size} color={color} />
            </WalkthroughableView>
        </CopilotStep>
    );
};