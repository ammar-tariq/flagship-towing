import { colors } from "@Utils/color";
import { heightPixel, widthPixel } from "@Utils/helpers";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    log_card: {
        borderLeftWidth: 1.5,
        borderColor: colors.black,
        paddingHorizontal: widthPixel(10),
        marginVertical: heightPixel(15)
    },
    log_row: {
        marginVertical: 0,
        marginBottom: heightPixel(10),
        // justifyContent: 'flex-start'
    },
    cancel_btn: {
        width: widthPixel(204),
        // alignSelf: 'flex-start'
    }
})