import PropTypes from 'prop-types';
import { View, Text, Button, StyleSheet } from 'react-native';

const GuestView = ({ onLogIn, onSignUp }) => (
    <View style={styles.container}>
        <Text style={styles.message}>
            You are logged in as a guest. To save your data, please log in or sign up.
        </Text>
        <Button title="Log In" onPress={onLogIn} color="blue" />
        <Button title="Sign Up" onPress={onSignUp} color="green" />
    </View>
);

GuestView.propTypes = {
    onLogIn: PropTypes.func.isRequired,
    onSignUp: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 20,
    },
    message: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 20,
        textAlign: 'center',
    },
});

export default GuestView;