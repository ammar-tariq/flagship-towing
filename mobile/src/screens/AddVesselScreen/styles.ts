import { colors } from "@Utils/color";
import { heightPixel, widthPixel, font, vh } from "@Utils/helpers";
import { StyleSheet, Platform } from "react-native";
import { fonts } from "@Assets/Fonts";

export const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: heightPixel(15),
        backgroundColor: colors.white,
    },
    section: {
        marginBottom: heightPixel(16),
    },
    row_style: {
        width: '100%',
        flexWrap: 'wrap',
    },
    vessel_image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    imageHint: {
        color: colors.placeholder,
        marginBottom: heightPixel(4),
        fontSize: font(13),
    },
    image_box: {
        width: '100%',
        height: heightPixel(180),
        borderRadius: heightPixel(15),
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderColor: colors.border,
        borderWidth: 1,
        marginVertical: heightPixel(10),
        backgroundColor: colors.lightGray,
    },
    image_boxFilled: {
        borderStyle: 'solid',
        backgroundColor: colors.white,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: heightPixel(12),
        backgroundColor: 'rgba(0,0,0,0.28)',
    },
    imageOverlayText: {
        color: colors.white,
        fontSize: font(13),
    },
    removeImageBtn: {
        alignSelf: 'flex-start',
        marginBottom: heightPixel(4),
    },
    removeImageText: {
        color: colors.primary,
        fontSize: font(13),
    },
    btnStyle: {
        marginVertical: heightPixel(20)
    },
    header_text: {
        marginBottom: heightPixel(10)
    },
    bullet_point: {
        width: heightPixel(5),
        height: heightPixel(5),
        borderRadius: heightPixel(5),
        backgroundColor: colors.placeholder,
        marginHorizontal: widthPixel(10)
    },
    bullet_text: {
        color: colors.placeholder,
        lineHeight: heightPixel(25)
    },
    add_box: {
        backgroundColor: colors.primary,
        height: heightPixel(25),
        width: heightPixel(25),
        borderRadius: heightPixel(25),
        alignItems: 'center',
        justifyContent: 'center',
    },
    add_icon: {
        width: heightPixel(15),
        height: heightPixel(15),
        resizeMode: 'contain'
    },
    counterContainer: {
        marginTop: heightPixel(5),
        marginBottom: heightPixel(10),
        width: '100%',
        zIndex: 99,
    },
    counterRow: {
        alignItems: 'flex-start',
        flexDirection: 'row',
    },
    counterLabel: {
        color: colors.darkBlack,
        marginTop: heightPixel(1),
        marginBottom: heightPixel(8),
    },
    required: {
        fontSize: font(14),
        color: colors.black,
    },
    counterInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: widthPixel(8),
        borderRadius: heightPixel(30),
        backgroundColor: colors.lightGray,
        width: '100%',
        height: heightPixel(56),
    },
    counterValueContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: widthPixel(12),
    },
    counterValue: {
        fontSize: font(14),
        fontFamily: fonts.Hellix.regular,
        color: colors.black,
    },
    counterButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: widthPixel(8),
    },
    counterButton: {
        width: heightPixel(40),
        height: heightPixel(40),
        borderRadius: heightPixel(20),
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterButtonDisabled: {
        backgroundColor: colors.placeholder,
        opacity: 0.5,
    },
    counterButtonText: {
        fontSize: font(20),
        fontFamily: fonts.Hellix.bold,
        color: colors.white,
        lineHeight: font(24),
    },
    counterError: {
        color: 'red',
        marginTop: heightPixel(8),
        marginLeft: widthPixel(20),
    },
    terms_row: {
        flexDirection: 'row',
        // alignItems: 'center',/
        marginVertical: heightPixel(10)
    },
    terms_text: {
        fontSize: font(12),
        color: colors.black,
        lineHeight: heightPixel(18)
    },
    locations_text: {
        fontSize: font(14),
        color: colors.darkBlack,
        lineHeight: heightPixel(22),
        marginTop: heightPixel(4),
    }
})