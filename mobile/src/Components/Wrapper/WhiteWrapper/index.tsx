import { colors } from '@Utils/color'
import { heightPixel } from '@Utils/helpers'
import React, { FC, memo } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

interface IWhiteWrapper {
    children: React.ReactNode,
    style?: StyleProp<ViewStyle>
}

const WhiteWrapper: FC<IWhiteWrapper> = ({ children, style }) => {
    return (
        <View style={[styles.main_style, style]}>{children}</View>
    )
}

const styles = StyleSheet.create({
    main_style: {
        backgroundColor: colors.white,
        paddingHorizontal: heightPixel(15),
        paddingVertical: heightPixel(12),
        borderRadius: heightPixel(10),
        marginBottom: heightPixel(10)
    }
})

export default memo(WhiteWrapper)
