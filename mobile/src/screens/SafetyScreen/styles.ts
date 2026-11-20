import { colors } from "@Utils/color";
import { heightPixel, widthPixel } from "@Utils/helpers";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    image_style: {
        width: '100%',
        height: heightPixel(200),
        borderRadius: heightPixel(10),
        resizeMode: 'cover',
    },
    tip_number: {
        color: colors.placeholder
    },
    btn_style: {
        // backgroundColor : colors.primary,
        // paddingVertical : heightPixel(5),
        // paddingHorizontal : widthPixel(20),
        borderRadius: heightPixel(8),
        alignSelf: 'center',
        marginTop: heightPixel(18),
        width: '100%',
        // alignItems:'center',
        justifyContent: 'center',
        // height: heightPixel(30)
    },
    tips_box: {
        marginVertical: heightPixel(8),
        gap: widthPixel(10)
    },
    dot_style: {
        width: heightPixel(5),
        height: heightPixel(5),
        borderRadius: heightPixel(5),
        backgroundColor: colors.darkBlack,
        marginTop: heightPixel(8)
    },
    text_style: {
        maxWidth: widthPixel(280),
        lineHeight: heightPixel(20)
    }
})