import AppWrapper from '@Components/Wrapper/AppWrapper'
import React from 'react'
import { Image, View } from 'react-native'
import { styles } from './styles'
import { images } from '@Assets/Images'
import { tips } from '@Utils/data'
import AppText from '@Components/AppText';
import Row from '@Components/Row'
import WhiteWrapper from '@Components/Wrapper/WhiteWrapper'
import {heightPixel, font} from '@Utils/helpers'
import { useGetContentQuery } from '@Api/user'
import { Loader } from '@Components/Loader'

const SafetyScreen = () => {

    const { data, isLoading } = useGetContentQuery()
    const emergencySitationItemsPoints = data?.data?.emergency_situation?.items ?? []
    const emergencySitationSubtitle = data?.data?.emergency_situation?.subTitle ?? ''
    if (isLoading) {
        return <Loader />
    }

    return (
        <AppWrapper scroll style={{ paddingTop: heightPixel(10), paddingBottom: heightPixel(16) }}>
            <WhiteWrapper>
                <Image source={images.covers.safety} style={styles.image_style} />


                <View style={styles.btn_style}>
                    <AppText weight='bold' style={{fontSize: font(16)}}>Is your vessel not starting? Here are some self help tips while you wait</AppText>
                    {/* <AppText style={[styles.text_style, { marginTop: heightPixel(10) }, {fontSize: font(14)}]}>{emergencySitationSubtitle}</AppText> */}
                </View>

                <View style={{ padding: heightPixel(10) }}>
                    {emergencySitationItemsPoints.map((item: any, index: number) => (
                        <Row align='flex-start' style={styles.tips_box} key={index}>
                            <View style={styles.dot_style} />
                            <AppText weight='medium' style={[styles.text_style, {fontSize: font(12)}]}>{item?.text}</AppText>
                        </Row>
                    ))}
                </View>
            </WhiteWrapper>
        </AppWrapper>
    )
}

export default SafetyScreen