import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLOURS } from '../helpers/constants';

const ColourPicker = ({ selectedColour, onSelectColour }) => {
    return (
        <View style={styles.container}>
            {COLOURS.map((colour) => (
                <TouchableOpacity
                    key={colour.name}
                    style={[
                        styles.colourCircle,
                        { backgroundColor: colour.value },
                        selectedColour === colour.value && styles.selected,
                    ]}
                    onPress={() => onSelectColour(colour.value)}
                />
            ))}
        </View>
    );
};

export default ColourPicker;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    colourCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        margin: 5,
        borderWidth: 2,
        borderColor: '#fff',
    },
    selected: {
        borderColor: '#000',
        borderWidth: 3,
    },
})