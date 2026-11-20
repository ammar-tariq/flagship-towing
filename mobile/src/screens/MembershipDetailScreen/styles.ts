import { colors } from "@Utils/color";
import { heightPixel, widthPixel } from "@Utils/helpers";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    image_style: {
        width: '100%',
        height: heightPixel(200),
        resizeMode: 'stretch',
        borderRadius: heightPixel(13)
    },
    header_text: {
        marginVertical: heightPixel(15),
        maxWidth: '80%'
    },
    desc_box: {
        marginBottom: heightPixel(15)
    }
})