import { 
    fetchTaskDetails, 
    createTask, 
    saveTask, 
    deleteTask, 
    cancelTaskChanges, 
    deleteSubtask, 
} from '../helpers/taskActions';
import { doc, getDoc, getDocs, updateDoc, deleteDoc, addDoc, collection, query, where } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

// Mocks
// Mock Firestore functions from 'firebase/firestore'
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    addDoc: jest.fn(() => Promise.resolve({ id: 'task123' })),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
}));

// Mock Firebase configuration
jest.mock('../firebaseConfig', () => ({
    db: {},
}));

// Mock notifications helpers
jest.mock('../helpers/notificationsHelpers', () => ({
    scheduleTaskNotification: jest.fn(() => Promise.resolve('notif123')),
    cancelTaskNotification: jest.fn(() => Promise.resolve()),
}));

// Mock Supabase storage helpers
jest.mock('../helpers/supabaseStorageHelpers', () => ({
    removeFileFromSupabase: jest.fn(() => Promise.resolve(true)),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
    deleteAsync: jest.fn(() => Promise.resolve()),
}));

// Mock Alert from react-native
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock safeDate helper and constants
jest.mock('../helpers/date', () => ({
    safeDate: jest.fn((dateStr) => new Date(dateStr)),
}));
jest.mock('../helpers/constants', () => ({
    COLOURS: [ { value: 'red' } ],
}));

// Tests

describe('taskActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
  
    describe('fetchTaskDetails', () => {
        test('returns task details when task exists', async () => {
            const fakeData = {
                title: 'Test Task',
                notes: 'Some notes',
                dueDate: '2025-01-01T00:00:00.000Z',
                notification: 'None',
                priority: 'Low',
                subtasks: [{
                    title: 'Subtask 1',
                    dueDate: '2025-01-01T01:00:00.000Z',
                    createdAt: '2025-01-01T00:30:00.000Z',
                }],
                notificationId: null,
                attachments: [],
                colour: 'red',
                manuallyFinished: false,
                taskCompletedAt: null,
            };
            const fakeSnapshot = {
            exists: () => true,
            data: () => fakeData,
            };
            getDoc.mockResolvedValue(fakeSnapshot);
            doc.mockReturnValue('fakeDocRef');
    
            const result = await fetchTaskDetails('user1', 'task1');
            expect(result.title).toBe(fakeData.title);
            expect(result.notes).toBe(fakeData.notes);
            expect(result.dueDate).toBeInstanceOf(Date);
            expect(result.subtasks).toHaveLength(1);
            expect(result.colour).toBe('red');
        });
    });

    describe('createTask', () => {
        test('creates a new task and schedules notifications', async () => {
            const fakeSnapshot = { 
                docs: [
                    { data: () => ({ order: 5 }) }
                ]
            };
            getDocs.mockResolvedValue(fakeSnapshot);
            collection.mockReturnValue('tasksCollection');
    
            const currentTask = {
                title: 'New Task',
                notes: 'Task notes',
                dueDate: new Date('2025-01-02T00:00:00.000Z'),
                notification: 'High',
                priority: 'Moderate',
                subtasks: [{
                    title: 'Subtask A',
                    dueDate: new Date('2025-01-02T01:00:00.000Z'),
                    reminder: 'Moderate',
                    createdAt: new Date('2025-01-02T00:30:00.000Z')
                }],
                attachments: [{
                    name: 'file.pdf',
                    supabaseKey: 'key123',
                    mimeType: 'application/pdf',
                    signedUrl: 'http://example.com/file.pdf'
                }],
                colour: 'red',
            };
    
            const setTaskId = jest.fn();
            const setOriginalTask = jest.fn();
            const setOriginalAttachments = jest.fn();
            const setDeletedAttachments = jest.fn();
            const setAddedAttachments = jest.fn();
    
            await createTask({
                userId: 'user1',
                currentTask,
                setTaskId,
                setOriginalTask,
                setOriginalAttachments,
                setDeletedAttachments,
                setAddedAttachments,
            });
    
            expect(addDoc).toHaveBeenCalled();
            expect(setTaskId).toHaveBeenCalledWith('task123');
            expect(updateDoc).toHaveBeenCalled();
            expect(setOriginalTask).toHaveBeenCalled();
            expect(setOriginalAttachments).toHaveBeenCalled();
            expect(setDeletedAttachments).toHaveBeenCalledWith([]);
            expect(setAddedAttachments).toHaveBeenCalledWith([]);
        });
    });

    describe('saveTask', () => {
        test('saves task changes, updating notifications and attachments', async () => {
            const originalTask = {
                title: 'Task',
                notes: 'Notes',
                dueDate: new Date('2025-01-03T00:00:00.000Z'),
                notification: 'Low',
                priority: 'Low',
                subtasks: [{
                    title: 'Subtask',
                    dueDate: new Date('2025-01-03T01:00:00.000Z'),
                    reminder: 'Low',
                    notificationId: 'oldSubNotif'
                }],
                notificationId: 'oldMainNotif',
                attachments: [],
                colour: 'red',
                manuallyFinished: false,
            };
            const currentTask = {
                title: 'Task Updated',
                notes: 'Updated notes',
                dueDate: new Date('2025-01-03T02:00:00.000Z'),
                notification: 'High', // changed
                priority: 'High',
                subtasks: [{
                    title: 'Subtask',
                    dueDate: new Date('2025-01-03T01:00:00.000Z'),
                    reminder: 'High', // changed
                    notificationId: 'oldSubNotif'
                }],
                attachments: [],
                notificationId: 'oldMainNotif',
                colour: 'red',
                manuallyFinished: false,
            };
    
            await saveTask({
                userId: 'user1',
                taskId: 'task123',
                originalTask,
                currentTask,
                deletedAttachments: [],
                setOriginalAttachments: jest.fn(),
                setDeletedAttachments: jest.fn(),
                setAddedAttachments: jest.fn(),
            });
    
            expect(updateDoc).toHaveBeenCalled();
            const { cancelTaskNotification, scheduleTaskNotification } = require('../helpers/notificationsHelpers');
            expect(cancelTaskNotification).toHaveBeenCalledWith('oldMainNotif');
            expect(scheduleTaskNotification).toHaveBeenCalledWith(currentTask.title, currentTask.notification, currentTask.dueDate);
        });
    });

    describe('deleteTask', () => {
        test('deletes a task, cancelling notifications and deleting attachments, then navigates back', async () => {
            const fakeTask = {
                id: 'task123',
                notificationId: 'notifMain',
                subtasks: [
                    { notificationId: 'notifSub1' },
                    {} // subtask with no notificationId
                ],
                attachments: [
                    { uri: 'file:///local/file1', supabaseKey: 'key1', name: 'file1' }
                ]
            };
            const navigation = { goBack: jest.fn() };
            await deleteTask('user1', fakeTask, navigation, true);
            const { cancelTaskNotification } = require('../helpers/notificationsHelpers');
            expect(cancelTaskNotification).toHaveBeenCalledWith('notifMain');
            expect(cancelTaskNotification).toHaveBeenCalledWith('notifSub1');
            expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///local/file1', { idempotent: true });
            const { removeFileFromSupabase } = require('../helpers/supabaseStorageHelpers');
            expect(removeFileFromSupabase).toHaveBeenCalledWith('key1');
            expect(deleteDoc).toHaveBeenCalled();
            expect(navigation.goBack).toHaveBeenCalled();
        });
    });

    describe('cancelTaskChanges', () => {
        test('reverts changes and deletes added attachments', async () => {
            const originalTask = {
                attachments: [{ name: 'orig.pdf' }],
                title: 'Original Task',
                notes: 'Original notes',
                dueDate: new Date('2025-01-04T00:00:00.000Z'),
                notification: 'None',
                priority: 'Low',
                subtasks: []
            };
            const addedAttachments = [
                { supabaseKey: 'keyNew', localUri: 'file:///local/new.pdf' }
            ];
            const setAttachments = jest.fn();
            const setDeletedAttachments = jest.fn();
            const setAddedAttachments = jest.fn();
            const setTaskTitle = jest.fn();
            const setNotes = jest.fn();
            const setDueDate = jest.fn();
            const setNotification = jest.fn();
            const setPriority = jest.fn();
            const setSubtasks = jest.fn();

            await cancelTaskChanges({
                originalTask,
                addedAttachments,
                setAttachments,
                setDeletedAttachments,
                setAddedAttachments,
                setTaskTitle,
                setNotes,
                setDueDate,
                setNotification,
                setPriority,
                setSubtasks,
            });

            const { removeFileFromSupabase } = require('../helpers/supabaseStorageHelpers');
            expect(removeFileFromSupabase).toHaveBeenCalledWith('keyNew');
            expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///local/new.pdf', { idempotent: true });
            expect(setAttachments).toHaveBeenCalledWith(originalTask.attachments);
            expect(setDeletedAttachments).toHaveBeenCalledWith([]);
            expect(setAddedAttachments).toHaveBeenCalledWith([]);
            expect(setTaskTitle).toHaveBeenCalledWith(originalTask.title);
            expect(setNotes).toHaveBeenCalledWith(originalTask.notes);
            expect(setDueDate).toHaveBeenCalledWith(originalTask.dueDate);
            expect(setNotification).toHaveBeenCalledWith(originalTask.notification);
            expect(setPriority).toHaveBeenCalledWith(originalTask.priority);
            expect(setSubtasks).toHaveBeenCalledWith(originalTask.subtasks);
        });
    });

    describe('deleteSubtask', () => {
        test('deletes a subtask and updates Firestore and local state', async () => {
            const subtasks = [
                { title: 'Subtask 1', dueDate: new Date('2025-01-05T00:00:00.000Z'), notificationId: 'notif1' },
                { title: 'Subtask 2', dueDate: new Date('2025-01-05T01:00:00.000Z') }
            ];
            const setSubtasks = jest.fn();
            doc.mockReturnValue('fakeDocRef');
        
            await deleteSubtask({
                userId: 'user1',
                taskId: 'task123',
                subtasks,
                index: 0,
                setSubtasks,
            });
        
            const { cancelTaskNotification } = require('../helpers/notificationsHelpers');
            expect(cancelTaskNotification).toHaveBeenCalledWith('notif1');
            expect(updateDoc).toHaveBeenCalledWith('fakeDocRef', expect.objectContaining({
                subtasks: expect.any(Array),
            }));
            expect(setSubtasks).toHaveBeenCalledWith([subtasks[1]]);
        });
    });
});