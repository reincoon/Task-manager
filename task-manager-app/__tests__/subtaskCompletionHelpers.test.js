import { Alert } from 'react-native';
import { 
    calculateTaskStatus, 
    toggleSubtaskCompletionLocal, 
    toggleTaskCompletion, 
    updateTaskStatusInFirestore 
} from '../helpers/subtaskCompletionHelpers';

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    updateDoc: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({
    db: {},
}));

// Mock Expo haptics and audio
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-av', () => ({
    Audio: {
        Sound: {
            createAsync: jest.fn(() => Promise.resolve({
                sound: {
                    playAsync: jest.fn(() => Promise.resolve()),
                    setOnPlaybackStatusUpdate: jest.fn(),
                    unloadAsync: jest.fn(() => Promise.resolve()),
                },
            })),
        },
    },
}));

// Spy on Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('../helpers/date', () => ({
    safeDate: (date) => new Date(date),
}));

describe('subtaskCompletionHelpers', () => {
    describe('calculateTaskStatus', () => {
        test('returns "Finished" when all subtasks are completed', () => {
            const task = {
                dueDate: new Date(Date.now() + 10000), // due in future
                subtasks: [{ isCompleted: true }, { isCompleted: true }],
                manuallyFinished: false,
            };
            const status = calculateTaskStatus(task);
            expect(status).toBe("Finished");
        });
    });

    describe('toggleSubtaskCompletionLocal', () => {
        test('toggles a subtask from incomplete to complete and sets completedAt', async () => {
            const subtasks = [{ isCompleted: false, completedAt: null }];
            const updated = await toggleSubtaskCompletionLocal({ subtasks, subtaskIndex: 0 });
            expect(updated[0].isCompleted).toBe(true);
            expect(updated[0].completedAt).toBeTruthy();
            expect(new Date(updated[0].completedAt).toString()).not.toBe("Invalid Date");
        });
    });

    describe('toggleTaskCompletion', () => {
        test('marks all subtasks as complete and sets taskCompletedAt when markAsComplete is true', async () => {
            // Sample subtasks with a fixed dueDate.
            const subtasks = [
            { isCompleted: false, dueDate: new Date("2025-01-01T00:00:00Z") },
            { isCompleted: false, dueDate: new Date("2025-01-02T00:00:00Z") },
            ];
            // Set up mocks for Firestore functions.
            const { doc, updateDoc } = require('firebase/firestore');
            doc.mockReturnValue("dummyDocRef");
            updateDoc.mockResolvedValue();

            const updatedSubtasks = await toggleTaskCompletion({
                userId: "user1",
                taskId: "task1",
                subtasks,
                markAsComplete: true,
            });
            updatedSubtasks.forEach(sub => {
                expect(sub.isCompleted).toBe(true);
                expect(sub.completedAt).toBeTruthy();
            });
            // updateDoc should be called with an update object
            expect(updateDoc).toHaveBeenCalledWith("dummyDocRef", expect.objectContaining({
                taskCompletedAt: expect.any(String),
            }));
        });
    });

    describe('updateTaskStatusInFirestore', () => {
        test('calls updateDoc with manuallyFinished status', async () => {
            const { doc, updateDoc } = require('firebase/firestore');
            doc.mockReturnValue("dummyDocRef");
            updateDoc.mockResolvedValue();
            await updateTaskStatusInFirestore(true, "user1", "task1");
            expect(updateDoc).toHaveBeenCalledWith("dummyDocRef", { manuallyFinished: true });
        });
    });
});