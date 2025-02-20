import { useState } from 'react';
import { Alert } from 'react-native';
import { updateProjectName } from '../helpers/firestoreHelpers';

// Custom hook to manage project name editing
export default function useProjectNameEdit(userId) {
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingProjId, setEditingProjId] = useState(null);
    const [newProjectName, setNewProjectName] = useState('');

    const openEditProjectModal = (projectId, projectName) => {
        const actualName = projectName.split(' (')[0];
        setEditingProjId(projectId);
        setNewProjectName(actualName.trim());
        setIsEditModalVisible(true);
    };

    const handleEditProject = async (projId, newName) => {
        if (!newName.trim()) {
            Alert.alert('Error', 'Project name cannot be empty.');
            return;
        }
        try {
            await updateProjectName(userId, projId, newName);
            Alert.alert('Success', 'Project renamed.');
        } catch (err) {
            Alert.alert('Error', 'Failed to rename project.');
        } finally {
            setIsEditModalVisible(false);
            setEditingProjId(null);
            setNewProjectName('');
        }
    };

    return {
        isEditModalVisible,
        editingProjId,
        newProjectName,
        setNewProjectName,
        openEditProjectModal,
        handleEditProject,
        setIsEditModalVisible,
        setEditingProjId,
    };
};