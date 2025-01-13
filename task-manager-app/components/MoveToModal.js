import {Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import Modal from 'react-native-modal';

const MoveToModal = ({ visible, onClose, onMove, columns, currentColumnKey }) => {
    if (!visible) {
        return null;
    }

    return (
        <Modal
            transparent={true}
            animationType="slide"
            visible={visible}
            onRequestClose={onClose}
        >
        {/*  <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropTransitionOutTiming={0}
        > */}
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Move Task To</Text>
                    {columns.map((column, index) => {
                        if (column.key !== currentColumnKey) {
                            return (
                                <TouchableOpacity
                                    key={column.key || column.id || index}
                                    style={styles.button}
                                    onPress={() => onMove(column.key || column.id)}
                                >
                                    <Text style={styles.buttonText}>{column.title}</Text>
                                </TouchableOpacity>
                            );
                        }
                        return null;
                    })}
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    button: {
        width: '100%',
        padding: 12,
        backgroundColor: '#007bff',
        borderRadius: 5,
        marginVertical: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    cancelButton: {
        marginTop: 15,
        padding: 10,
    },
    cancelButtonText: {
        color: '#007bff',
        fontSize: 16,
    },
});

export default MoveToModal;