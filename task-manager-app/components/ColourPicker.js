import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLOURS } from '../helpers/constants';

export default function ColourPicker({ selectedColour, onSelectColour }) {
    const currentColour = selectedColour && selectedColour.value !== undefined
        ? selectedColour.value
        : selectedColour;

    return (
        <View style={styles.container}>
            {COLOURS.map((colour) => (
                <TouchableOpacity
                    key={colour.name}
                    style={[
                        styles.colourCircle,
                        { backgroundColor: colour.value },
                        currentColour === colour.value && styles.selected,
                    ]}
                    onPress={() => onSelectColour(colour.value)}
                />
            ))}
        </View>
    );
};

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