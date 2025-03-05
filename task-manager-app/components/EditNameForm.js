import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import tw from '../twrnc';

const EditNameForm = ({ name, setName, handleSaveName, handleCancelEdit }) => (
    <View style={tw`flex-row items-center mb-4`}>
        <TextInput 
            style={tw`flex-1 border border-gray-300 p-3 rounded-md font-roboto text-base`}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
        />
        <View style={tw`ml-4 flex-row`}>
            <TouchableOpacity
                onPress={handleSaveName}
                style={tw`py-2 px-4 bg-mint rounded-md mr-2 shadow-custom`}
            >
                <Text style={tw`text-white font-poppins`}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={handleCancelEdit}
                style={tw`py-2 px-4 bg-cinnabar rounded-md shadow-custom`}
            >
                <Text style={tw`text-white font-poppins`}>Cancel</Text>
            </TouchableOpacity>
        </View>
    </View>
);

export default EditNameForm;