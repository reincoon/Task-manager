import { Alert } from 'react-native';
import { createProject } from '../helpers/firestoreHelpers';

export default function useProjectActions(userId, {
    setShowProjectModal,
    setDraggingTask,
    setHoveredTask,
    setEditingProjId,
    setNewProjectName,
    setIsEditModalVisible,
}) {
    const createNewProject = async (projectName) => {
        if (!userId) {
            setShowProjectModal(false);
            Alert.alert('Error', 'User not signed in.');
            return;
        }
        try {
            // Create a new project in Firebase
            await createProject(userId, projectName);
            Alert.alert(
                'Project Created',
                `Project "${projectName}" created. Assign tasks to it manually.`
            );
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            // Reset states
            setShowProjectModal(false);
            setDraggingTask(null);
            setHoveredTask(null);
        }
    };

    const openEditProjectModal = (projectId, projectName) => {
        const actualName = projectName.split(' (')[0];
        setEditingProjId(projectId);
        setNewProjectName(actualName.trim());
        setIsEditModalVisible(true);
    };

    return { createNewProject, openEditProjectModal };
}
