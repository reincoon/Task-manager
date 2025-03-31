import {
    updateTaskEventId,
    updateTasksProject,
    updateTasksPriority,
    createProject,
    getProjectColourFromDB,
    updateProjectColour,
    reorderTasks,
    updateProjectName,
    deleteProject,
} from "../helpers/firestoreHelpers";

import {
    doc,
    updateDoc,
    deleteDoc,
    collection,
    writeBatch,
    getDocs,
} from 'firebase/firestore';

import { deleteTask } from "../helpers/taskActions";
import { getRandomColour } from "../helpers/randomColors";
import { db } from "../firebaseConfig";

// Mocks
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    collection: jest.fn(),
    addDoc: jest.fn(() => Promise.resolve({ id: 'project123' })),
    writeBatch: jest.fn(() => {
        return {
            update: jest.fn(),
            commit: jest.fn(() => Promise.resolve()),
        };
    }),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
}));

jest.mock('../firebaseConfig', () => ({
    db: {},
}));

jest.mock('../helpers/taskActions', () => ({
    deleteTask: jest.fn(() => Promise.resolve()),
}));

jest.mock('../helpers/randomColors', () => ({
    getRandomColour: jest.fn(() => 'randomColor'),
}));

// Tests
describe('firestoreHelpers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('updateTaskEventId calls updateDoc with correct parameters', async () => {
        const userId = 'user1';
        const taskId = 'task1';
        const eventId = 'event123';
        const fakeDocRef = { id: 'fakeDocRef' };
    
        doc.mockReturnValue(fakeDocRef);
    
        await updateTaskEventId(userId, taskId, eventId);
    
        // Verify that doc was called with the correct parameters
        expect(doc).toHaveBeenCalledWith(db, `tasks/${userId}/taskList`, taskId);
        // Verify that updateDoc was called with the correct parameters
        expect(updateDoc).toHaveBeenCalledWith(fakeDocRef, { eventId });
    });

    test('updateTasksProject commits a batch update with correct order', async () => {
        const userId = 'user1';
        const tasks = [{ id: 'task1' }, { id: 'task2' }];
        const projectId = 'project1';
    
        // Create a fake batch with spy functions
        const fakeBatch = {
            update: jest.fn(),
            commit: jest.fn(() => Promise.resolve()),
        };
        writeBatch.mockReturnValue(fakeBatch);

        // getDocs should return a snapshot with one doc having an order value
        const fakeSnapshot = { docs: [{ data: () => ({ order: 1 }) }] };
        getDocs.mockResolvedValue(fakeSnapshot);
    
        await updateTasksProject(userId, tasks, projectId);
    
        // Expect update to be called once per task
        expect(fakeBatch.update).toHaveBeenCalledTimes(tasks.length);
        // Verify that the batch was committed
        expect(fakeBatch.commit).toHaveBeenCalled();
    });

    test('updateTasksPriority commits a batch update with correct priority and order', async () => {
        const userId = 'user1';
        const tasks = [{ id: 'task1' }, { id: 'task2' }];
        const newPriority = 'High';
    
        const fakeBatch = {
            update: jest.fn(),
            commit: jest.fn(() => Promise.resolve()),
        };
        writeBatch.mockReturnValue(fakeBatch);
    
        await updateTasksPriority(userId, tasks, newPriority);
    
        // Update call for each task
        expect(fakeBatch.update).toHaveBeenCalledTimes(tasks.length);
        // Check the update call for correct parameters
        expect(fakeBatch.update).toHaveBeenCalledWith(
            expect.anything(),
            { priority: newPriority, order: 0 }
        );
        expect(fakeBatch.commit).toHaveBeenCalled();
    });

    test('createProject returns project id on success', async () => {
        const userId = 'user1';
        const projectName = 'Test Project';
    
        // Collection returns a collection reference
        collection.mockReturnValue('fakeCollection');
    
        const projectId = await createProject(userId, projectName);
        expect(projectId).toBe('project123');
        // Check that getRandomColour was called
        expect(getRandomColour).toHaveBeenCalled();
    });

    test('getProjectColourFromDB returns color from snapshot if exists', async () => {
        const userId = 'user1';
        const projectId = 'proj1';
    
        // getDocs returns a snapshot with a document that has a colour
        const fakeDoc = { data: () => ({ color: 'blue' }) };
        getDocs.mockResolvedValue({ empty: false, docs: [fakeDoc] });
    
        const color = await getProjectColourFromDB(userId, projectId);
        expect(color).toBe('blue');
    });
  
    test('updateProjectColour calls updateDoc with correct parameters', async () => {
        const userId = 'user1';
        const projectId = 'proj1';
        const newColour = 'red';
        const fakeDocRef = { id: 'docRef' };
    
        doc.mockReturnValue(fakeDocRef);
    
        await updateProjectColour(userId, projectId, newColour);
    
        expect(doc).toHaveBeenCalledWith(db, `projects/${userId}/userProjects`, projectId);
        expect(updateDoc).toHaveBeenCalledWith(fakeDocRef, { color: newColour });
    });

    test('reorderTasks commits batch update with sorted tasks', async () => {
        const userId = 'user1';
        // Create tasks with different order values
        const tasks = [
            { id: 'task1', order: 2 },
            { id: 'task2', order: 1 },
        ];
        const projectId = 'proj1';
        const priority = 'High';
    
        const fakeBatch = {
            update: jest.fn(),
            commit: jest.fn(() => Promise.resolve()),
        };
        writeBatch.mockReturnValue(fakeBatch);

        // Doc returns a fake doc reference
        const fakeDocRef = { id: 'docRef' };
        doc.mockReturnValue(fakeDocRef);
    
        await reorderTasks(userId, tasks, projectId, priority);
    
        // Update is called for each task
        expect(fakeBatch.update).toHaveBeenCalledTimes(tasks.length);
        expect(fakeBatch.commit).toHaveBeenCalled();
    });

    test('updateProjectName calls updateDoc with correct parameters', async () => {
        const userId = 'user1';
        const projectId = 'proj1';
        const newName = 'New Project Name';
        const fakeDocRef = { id: 'docRef' };
    
        doc.mockReturnValue(fakeDocRef);
    
        await updateProjectName(userId, projectId, newName);
        expect(doc).toHaveBeenCalledWith(db, `projects/${userId}/userProjects`, projectId);
        expect(updateDoc).toHaveBeenCalledWith(fakeDocRef, { name: newName });
    });

    test('deleteProject calls deleteTask for each associated task and deletes the project', async () => {
        const userId = 'user1';
        const projectId = 'proj1';
        const navigation = { goBack: jest.fn() };
    
        // Fake snapshot that simulates two tasks
        const fakeDoc1 = { id: 'task1', data: () => ({ foo: 'bar' }) };
        const fakeDoc2 = { id: 'task2', data: () => ({ foo: 'baz' }) };
        // getDocs returns an object with a forEach method
        getDocs.mockResolvedValue({
            forEach: (fn) => {
                [fakeDoc1, fakeDoc2].forEach(fn);
            },
            empty: false,
        });
    
        await deleteProject(userId, projectId, navigation);
    
        // deleteTask should be called twice (once per task)
        expect(deleteTask).toHaveBeenCalledTimes(2);
        // deleteDoc should be called to delete the project
        expect(deleteDoc).toHaveBeenCalled();
    });
});