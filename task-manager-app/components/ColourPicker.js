import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLOURS } from '../helpers/constants';
import tw, { theme } from '../twrnc';

export default function ColourPicker({ selectedColour, onSelectColour }) {
    // // Convert to an array of objects
    // const priorityColoursArray = Object.entries(PRIORITY_COLOURS).map(
    //     ([name, value]) => ({ name, value })
    // );
    // // Merge COLOURS with priorityColoursArray
    // const mergedColoursMap = new Map();
    // COLOURS.forEach(colour => {
    //     mergedColoursMap.set(colour.value, colour);
    // });

    // priorityColoursArray.forEach(colour => {
    //     if (!mergedColoursMap.has(colour.value)) {
    //         mergedColoursMap.set(colour.value, colour);
    //     }
    // });

    // const mergedColours = Array.from(mergedColoursMap.values());

    // // Determine the current selected colour as a colour string
    // const currentColour = selectedColour && selectedColour.value !== undefined
    //     ? selectedColour.value
    //     : selectedColour;
    const currentColour = selectedColour;

    return (
        <View style={tw`flex-row flex-wrap justify-start my-2`}>
            {COLOURS.map(colour => (
                <TouchableOpacity
                    key={colour.name + colour.value}
                    // style={[
                    //     styles.colourCircle,
                    //     { backgroundColor: colour.value },
                    //     currentColour === colour.value && styles.selected,
                    // ]}
                    style={[
                        tw`w-10 h-10 rounded-full m-1 border-2`,
                        { 
                            backgroundColor: colour.value, 
                            borderColor: currentColour === colour.value ? theme.colors.textPrimary : theme.colors.white },
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