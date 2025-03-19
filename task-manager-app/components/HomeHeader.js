import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Menu, MenuItem } from 'react-native-material-menu';
import AddProjectButton from './AddProjectButton';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';
import ThemedText from './ThemedText';

export default function HomeHeader({ menuRef, showMenu, hideMenu, onMenuOption, viewMode, onAddProjectPress, onTutorialPress }) {
    const { isDarkMode } = useTheme();

    const headerBg = isDarkMode ? theme.colors.darkBg : theme.colors.white;
    const borderColor = isDarkMode ? theme.colors.darkEvergreen : theme.colors.sky;

    // Toggles between list/kanban
    const handleTogglePress = () => {
        const newMode = viewMode === 'list' ? 'kanban' : 'list';
        onMenuOption(newMode === 'list' ? 'List View' : 'Kanban View');
    };

    return (
        <View 
            style={[
                tw`px-4 pt-4 pb-2 border-b flex-row`,
                { backgroundColor: headerBg, borderBottomColor: borderColor, borderBottomWidth: 1 },
            ]}
        >
            <View style={tw`flex-1`}>
                <ThemedText variant="xl2" style={tw`mb-1`}>
                    ToDoFlow
                </ThemedText>
                <View style={tw`flex-row items-center justify-between`}>
                    <ThemedText variant="xl3" style={tw`font-bold`}>
                        Home
                    </ThemedText>
                    <TouchableOpacity onPress={handleTogglePress} style={tw`ml-3`}>
                        {viewMode === 'list' ? (
                            <Ionicons name="copy-outline" size={theme.fontSize.xl2} color={isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary} />
                        ) : (
                            <Ionicons name="list-outline" size={theme.fontSize.xl2} color={isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
            {/* <Text style={styles.title}>{title}</Text> */}
            {/* {viewMode === 'list' && (
                <AddProjectButton onPress={onAddProjectPress} label="Add Project"/>
            )} */}
            {/* <Menu
                ref={menuRef}
                anchor={
                    <TouchableOpacity onPress={showMenu}>
                        <Ionicons name="ellipsis-horizontal" size={24} color="black" />
                    </TouchableOpacity>
                }
                onRequestClose={hideMenu}
            >
                <MenuItem onPress={() => onMenuOption('List View')}>List View</MenuItem>
                <MenuItem onPress={() => onMenuOption('Kanban View')}>Kanban View</MenuItem>
                <MenuItem onPress={() => onMenuOption('Sort by Project')}>Group by Project</MenuItem>
                <MenuItem onPress={() => onMenuOption('Sort by Priority')}>Group by Priority</MenuItem>
                <MenuItem onPress={() => onMenuOption('Sort by Date')}>Sort by Date</MenuItem>
                <MenuItem onPress={() => onMenuOption('Sort Alphabetically')}>Sort Alphabetically</MenuItem>
                <MenuItem onPress={() => onMenuOption('Sort by Colour')}>Sort by Colour</MenuItem>
            </Menu> */}
            <View style={tw`flex-row items-center ml-3`}>
                {/* Tutorial icon */}
                <TouchableOpacity onPress={onTutorialPress} style={tw`mx-2`}>
                    <Ionicons name="help-circle-outline" size={theme.fontSize.xl2} color={isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary} />
                </TouchableOpacity>

                {/* Toggle view icon (List or Kanban)
                <TouchableOpacity style={tw`mx-2`} onPress={handleTogglePress}>
                    {viewMode === 'list' ? (
                        <Ionicons name="copy-outline" size={theme.fontSize.xl2} color={isDarkMode ? theme.colors.darkTextPrimary : textPrimary} />
                    ) : (
                        <Ionicons name="list-outline" size={theme.fontSize.xl2} color={isDarkMode ? theme.colors.darkTextPrimary : textPrimary} />
                    )}
                </TouchableOpacity> */}

                {/* Menu icon for sorting/grouping */}
                <Menu
                    ref={menuRef}
                    anchor={
                        <TouchableOpacity onPress={showMenu} style={tw`mx-2`}>
                            <Ionicons name="ellipsis-horizontal" size={theme.fontSize.xl2} color={isDarkMode ? theme.colors.darkTextPrimary : theme.colors.textPrimary} />
                        </TouchableOpacity>
                    }
                    onRequestClose={hideMenu}
                >
                    {/* <MenuItem onPress={() => onMenuOption('List View')}>List View</MenuItem>
                    <MenuItem onPress={() => onMenuOption('Kanban View')}>Kanban View</MenuItem> */}
                    <MenuItem onPress={() => onMenuOption('Sort by Project')}>Group by Project</MenuItem>
                    <MenuItem onPress={() => onMenuOption('Sort by Priority')}>Group by Priority</MenuItem>
                    <MenuItem onPress={() => onMenuOption('Sort by Date')}>Sort by Date</MenuItem>
                    <MenuItem onPress={() => onMenuOption('Sort Alphabetically')}>Sort Alphabetically</MenuItem>
                    <MenuItem onPress={() => onMenuOption('Sort by Colour')}>Sort by Colour</MenuItem>
                </Menu>
                
                {/* Add project button */}
                <View style={tw`ml-3`}>
                    <AddProjectButton onPress={onAddProjectPress} label="Add Project" />
                </View>
            </View>
        </View>
    );
};

// const styles = StyleSheet.create({
//     header: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingHorizontal: 16,
//         paddingTop: 16,
//         paddingBottom: 8,
//         backgroundColor: '#ffffff',
//         borderBottomWidth: 1,
//         borderBottomColor: '#e0e0e0',
//         justifyContent: 'space-between',
//     },
//     titleContainer: {
//         flexDirection: 'column',
//     },
//     appName: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#007bff',
//     },
//     screenTitle: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         color: '#333',
//     },
//     iconsContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
// });  

// export default HomeHeader;