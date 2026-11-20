import { colors } from "@Utils/color";
import { heightPixel, widthPixel } from "@Utils/helpers";
import { StyleSheet } from "react-native";

/** Same value for both sides so the arrow stays a circle, not an oval. */
const ARROW_SIZE = heightPixel(28);

export const styles = StyleSheet.create({
   screen: {
      backgroundColor: colors.lightGray,
   },
   image_style: {
      height: heightPixel(116),
      width: widthPixel(125),
      borderRadius: heightPixel(10),
      resizeMode: 'stretch'
   },
   white_box: {
      paddingVertical: heightPixel(6),
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: '#D9D9D9',
   },
   forward_icon :{
      height : ARROW_SIZE * 0.45,
      width : ARROW_SIZE * 0.45,
      resizeMode : 'contain'
   },
   desc_box: {
      margin: heightPixel(15)
   },
   desc_title: {
      maxWidth: widthPixel(142),
   },
   desc_text: {
      maxWidth: widthPixel(180),
      marginTop: heightPixel(10),
      color :colors.placeholder
   },
   btn_style :{
      position : 'absolute',
      top : heightPixel(10),
      right : widthPixel(15),
      backgroundColor : colors.primary,
      height : ARROW_SIZE,
      width : ARROW_SIZE,
      borderRadius : ARROW_SIZE / 2,
      overflow : 'hidden',
      alignItems:'center',
      justifyContent:'center'
   }
})