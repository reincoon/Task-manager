jest.mock('firebase/auth', () => ({
    initializeAuth: jest.fn(() => ({})),
    signOut: jest.fn(() => Promise.resolve()),
    signInAnonymously: jest.fn(() => Promise.resolve({ uid: 'anonUser' })),
    updateProfile: jest.fn(() => Promise.resolve()),
    linkWithCredential: jest.fn(() => Promise.resolve({ user: { uid: 'upgradedUser' } })),
    reauthenticateWithCredential: jest.fn(() => Promise.resolve()),
    deleteUser: jest.fn(() => Promise.resolve()),
    EmailAuthProvider: {
        credential: jest.fn((email, password) => ({ email, password })),
    },
    getReactNativePersistence: jest.fn(() => {
        return () => 'dummyPersistence';
    }),
}));
import { 
    handleLogOut,
    handleDeleteAccount,
    handleSaveName,
    handleCancelEdit,
    handleChangePassword
} from '../helpers/authFunctions';
import { Alert } from 'react-native';
import { updateProfile } from 'firebase/auth';

// Mocks
// Mock CommonActions.reset from @react-navigation/native
jest.mock('@react-navigation/native', () => ({
    CommonActions: {
        reset: jest.fn((arg) => arg)
    }
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.spyOn(Alert, 'prompt').mockImplementation((title, message, callback) => {
    callback('testPassword');
});

describe('authFunctions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('handleLogOut', () => {
        test('logs out successfully', async () => {
            const fakeAuth = {};
            const setLoading = jest.fn();
            const setUser = jest.fn();
            const setName = jest.fn();
            const setIsAnonymous = jest.fn();
            const setTasks = jest.fn();
            const navigation = { navigate: jest.fn() };
        
            await handleLogOut(fakeAuth, setLoading, setUser, setName, setIsAnonymous, navigation, setTasks);

            expect(setLoading).toHaveBeenCalledTimes(2);
            expect(require('firebase/auth').signOut).toHaveBeenCalledWith(fakeAuth);
            expect(require('firebase/auth').signInAnonymously).toHaveBeenCalledWith(fakeAuth);
            expect(setTasks).toHaveBeenCalledWith([]);
            expect(setUser).toHaveBeenCalledWith({ uid: 'anonUser' });
            expect(setName).toHaveBeenCalledWith('');
            expect(setIsAnonymous).toHaveBeenCalledWith(true);
            expect(Alert.alert).toHaveBeenCalledWith('Success', 'Logged out successfully!');
            expect(navigation.navigate).toHaveBeenCalledWith('HomeStack');
        });

        test('handles error during logout', async () => {
            // Simulate signOut failure
            const { signOut } = require('firebase/auth');
            signOut.mockRejectedValueOnce(new Error('Logout error'));
            const fakeAuth = {};
            const setLoading = jest.fn();
            const setUser = jest.fn();
            const setName = jest.fn();
            const setIsAnonymous = jest.fn();
            const navigation = { navigate: jest.fn() };
    
            await handleLogOut(fakeAuth, setLoading, setUser, setName, setIsAnonymous, navigation);
    
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Logout error');
            expect(setLoading).toHaveBeenLastCalledWith(false);
        });
    });

    describe('handleDeleteAccount', () => {
        test('prompts for password and proceeds with deletion', async () => {
            const fakeAuth = {
                currentUser: { uid: 'user1', email: 'user1@example.com' }
            };
            const setLoading = jest.fn();
            const setUser = jest.fn();
            const setName = jest.fn();
            const setIsAnonymous = jest.fn();
            const setTasks = jest.fn();
            const navigation = { navigate: jest.fn() };
        
            // When handleDeleteAccount is called, Alert.prompt is invoked
            await handleDeleteAccount(fakeAuth, setLoading, setUser, setName, setIsAnonymous, setTasks, navigation);
        
            // Alert.prompt is called with the expected title and message
            expect(Alert.prompt).toHaveBeenCalledWith(
                "Delete Account",
                "Please enter your password to delete the account",
                expect.any(Function),
                'secure-text'
            );
        });
    });
    
    describe('handleSaveName', () => {
        test('updates name successfully if non-empty', async () => {
            const fakeAuth = { currentUser: { uid: 'user1', displayName: 'Old Name' } };
            const name = 'New Name';
            const setIsEditingName = jest.fn();
        
            await handleSaveName(fakeAuth, name, setIsEditingName);
        
            expect(require('firebase/auth').updateProfile).toHaveBeenCalledWith(fakeAuth.currentUser, { displayName: name });
            expect(Alert.alert).toHaveBeenCalledWith('Success', 'Name updated successfully!');
            expect(setIsEditingName).toHaveBeenCalledWith(false);
        });
    
        test('shows error if name is empty', async () => {
            const fakeAuth = { currentUser: { uid: 'user1', displayName: 'Old Name' } };
            const name = '   '; // empty after trimming
            const setIsEditingName = jest.fn();
        
            await handleSaveName(fakeAuth, name, setIsEditingName);
        
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Name cannot be empty');
            expect(updateProfile).not.toHaveBeenCalled();
        });
    });
    
    describe('handleCancelEdit', () => {
        test('resets name and editing state', () => {
            const setName = jest.fn();
            const currentName = 'Current Name';
            const setIsEditingName = jest.fn();
        
            handleCancelEdit(setName, currentName, setIsEditingName);
        
            expect(setName).toHaveBeenCalledWith(currentName);
            expect(setIsEditingName).toHaveBeenCalledWith(false);
        });
    });
    
    describe('handleChangePassword', () => {
        test('navigates to ChangePassword screen', () => {
            const navigation = { navigate: jest.fn() };
            handleChangePassword(navigation);
            expect(navigation.navigate).toHaveBeenCalledWith('ChangePassword');
        });
    });
});