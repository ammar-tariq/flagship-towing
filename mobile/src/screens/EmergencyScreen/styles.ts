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
    call_box: {
        height: heightPixel(50),
        width: heightPixel(50),
        borderRadius: heightPixel(50),
        backgroundColor: colors.scarlet,
        alignItems: 'center',
        justifyContent: 'center'
    },
    contact_box: {
        marginTop: heightPixel(10)
    },
    call_icon: {
        width: "60%",
        height: '60%',
        resizeMode: 'contain',
    },
    item_row: {
        marginVertical: heightPixel(8)
    },
    item_box: {
        maxWidth: widthPixel(250),
        marginLeft: widthPixel(10)
    },
    item_header: {
        color: colors.placeholder
    },
    item_text: {
        color: colors.primary,
        textDecorationLine: 'underline'
    },

    tips_box: {
        marginVertical: heightPixel(10),
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
    },
    btn_style :{
        // backgroundColor : colors.primary,
        // paddingVertical : heightPixel(5),
        // paddingHorizontal : widthPixel(20),
        borderRadius : heightPixel(8),
        alignSelf : 'center',
        marginTop : heightPixel(10),
        width : '100%',
        // alignItems:'center',
        justifyContent : 'center',
        height : heightPixel(30)
    },

})