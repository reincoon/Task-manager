import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Menu, MenuItem } from 'react-native-material-menu';
import AddProjectButton from './AddProjectButton';

const HomeHeader = ({ title, menuRef, showMenu, hideMenu, onMenuOption, viewMode, onAddProjectPress }) => {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {viewMode === 'list' && (
                <AddProjectButton onPress={onAddProjectPress} label="Add Project"/>
            )}
            <Menu
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
            </Menu>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});  

export default HomeHeader;