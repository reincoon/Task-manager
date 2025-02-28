import { View, StyleSheet } from 'react-native';
import HomeHeader from './HomeHeader';
import KanbanBoard from './KanbanBoard';
import ListView from './ListView';
import FloatingActionButton from './FloatingActionButton';
import ProjectModal from './ProjectModal';

export default function HomeView({
    userId,
    navigation,
    menuRef,
    onMenuOption,
    viewMode,
    tasks,
    projects,
    grouping,
    sortOption,
    setSortOption,
    onAddProjectPress,
    onDeleteTask,
    openEditProjectModal,
    showProjectModal,
    onCreateProject,
    setDraggingTask,
    setHoveredTask,
}) {
    const renderKanbanView = () => (
        <KanbanBoard
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
            userId={userId}
            tasks={tasks}
            projects={projects}
            sortOption={sortOption}
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
                onCancel={() => {
                    onAddProjectPress(false);
                    setDraggingTask(null); 
                    setHoveredTask(null);
                }}
                onCreate={onCreateProject}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});