import { View, StyleSheet } from 'react-native';
import HomeHeader from './HomeHeader';
import KanbanBoard from './KanbanBoard';
import ListView from './ListView';
import FloatingActionButton from './FloatingActionButton';
import ProjectModal from './ProjectModal';
import ProjectNameEditModal from './ProjectNameEditModal';

export default function HomeView({
    navigation,
    menuRef,
    onMenuOption,
    viewMode,
    tasks,
    projects,
    grouping,
    setSortOption,
    onAddProjectPress,
    onDeleteTask,
    openEditProjectModal,
    showProjectModal,
    onCreateProject,
    isEditModalVisible,
    editingProjId,
    newProjectName,
    setNewProjectName,
    onEditProject,
    onCloseEditModal,
    userId,
    setDraggingTask,
    setHoveredTask,
}) {
    const renderKanbanView = () => (
        <KanbanBoard
            // rawTasks={tasks}
            // projects={projects}
            // navigation={navigation}
            // grouping={grouping}
            // openEditProjectModal={openEditProjectModal}
            userId={userId} 
            rawTasks={tasks} 
            projects={projects} 
            navigation={navigation} 
            grouping={grouping}
            setDraggingTask={setDraggingTask}
            setHoveredTask={setHoveredTask}
            openEditProjectModal={openEditProjectModal}
        />
    );


    const renderListView = () => (
        <ListView
            // tasks={tasks}
            // projects={projects}
            // sortOption={setSortOption}
            // navigation={navigation}
            // deleteTask={onDeleteTask}
            // grouping={grouping}
            // openEditProjectModal={openEditProjectModal}

            userId={userId}
            tasks={tasks}
            projects={projects}
            sortOption={setSortOption}
            setSortOption={setSortOption}
            navigation={navigation}
            deleteTask={onDeleteTask}
            setDraggingTask={setDraggingTask}
            setHoveredTask={setHoveredTask}
            grouping={grouping}
            openEditProjectModal={openEditProjectModal}
        />
    );

    return (
        <View style={styles.container}>
            <HomeHeader 
                title="Home"
                menuRef={menuRef}
                showMenu={() => menuRef.current?.show()}
                hideMenu={() => menuRef.current?.hide()}
                onMenuOption={onMenuOption}
                viewMode={viewMode}
                onAddProjectPress={onAddProjectPress}
            />
            {viewMode === 'list' ? renderListView() : renderKanbanView()}
            <FloatingActionButton onPress={() => navigation.navigate('TaskCreationScreen')} />
            <ProjectModal 
                visible={showProjectModal}
                onCancel={() => setShowProjectModal(false)}
                onCreate={onCreateProject}
            />
            <ProjectNameEditModal 
                visible={isEditModalVisible}
                onClose={onCloseEditModal}
                onSave={onEditProject}
                projectName={newProjectName}
                projectId={editingProjId}
                onChangeProjectName={setNewProjectName}
            />
        </View>
    );    
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});