import { View, StyleSheet } from 'react-native';
import HomeHeader from './HomeHeader';
import KanbanBoard from './KanbanBoard';
import ListView from './ListView';
import FloatingActionButton from './FloatingActionButton';
import ProjectModal from './ProjectModal';
import tw, { theme } from '../twrnc';
import { useTheme } from '../helpers/ThemeContext';

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
    onCloseProjectModal,
    onDeleteTask,
    openEditProjectModal,
    showProjectModal,
    onCreateProject,
    setDraggingTask,
    setHoveredTask,
    onTutorialPress
}) {
    const { isDarkMode } = useTheme();
    const bgColor = isDarkMode ? theme.colors.darkBg : theme.colors.light;

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
        <View style={[tw`flex-1`, { backgroundColor: bgColor }]}>
            <HomeHeader
                menuRef={menuRef}
                showMenu={() => menuRef.current?.show()}
                hideMenu={() => menuRef.current?.hide()}
                onMenuOption={onMenuOption}
                viewMode={viewMode}
                onAddProjectPress={onAddProjectPress}
                onTutorialPress={onTutorialPress}
            />
            {viewMode === 'list' ? renderListView() : renderKanbanView()}
            <FloatingActionButton onPress={() => navigation.navigate('TaskCreationScreen')} />
            <ProjectModal
                visible={showProjectModal}
                onCancel={() => {
                    // onAddProjectPress(false);
                    onCloseProjectModal();
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