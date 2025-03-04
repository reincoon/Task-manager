import { TouchableOpacity, Text } from "react-native";
import tw from "../twrnc";

const ActionButton = ({ title, onPress, bgColor }) => (
    <TouchableOpacity
        style={[tw`py-3 px-5 rounded-lg shadow my-2`, { backgroundColor: bgColor, alignSelf: 'center', width: '80%' } ]}
        onPress={onPress}
    >
        <Text style={tw`text-white font-bold text-center`}>{title}</Text>
    </TouchableOpacity>
);

export default ActionButton;