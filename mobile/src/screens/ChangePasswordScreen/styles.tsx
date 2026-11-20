import { heightPixel } from "@Utils/helpers";
import { StyleSheet } from "react-native";
import { HEADER_HEIGHT } from "src/app/navigation/NavigationOptions/styles";

export const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: heightPixel(15),
        paddingBottom: heightPixel(15),
        paddingTop: HEADER_HEIGHT + heightPixel(15),
    },
    btnStyle : {
        marginVertical : heightPixel(20)
    }
})