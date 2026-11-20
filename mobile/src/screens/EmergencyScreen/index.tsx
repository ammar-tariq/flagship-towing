import { images } from '@Assets/Images';
import AppWrapper from '@Components/Wrapper/AppWrapper';
import WhiteWrapper from '@Components/Wrapper/WhiteWrapper';
import React from 'react'
import { Image, Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';
import {heightPixel, widthPixel, font} from '@Utils/helpers';
import { contacts } from '@Utils/data';
import Row from '@Components/Row';
import AppText from '@Components/AppText';
import { useGetContentQuery } from '@Api/user';
import { Loader } from '@Components/Loader';

const EmergencyScreen = () => {
    const { data, isLoading } = useGetContentQuery()

    if (isLoading) {
        return <Loader />
    }

    return (
        <AppWrapper style={{ paddingTop: heightPixel(15) }}>
            <ScrollView>
                <WhiteWrapper>
                    <Image source={images.covers.safety} style={styles.image_style} />
                    <View style={styles.contact_box}>
                        {contacts?.map((item, index) => {
                            if(index === 2) {
                                return null
                            }
                            return (
                                <Row style={styles.item_row}>
                                    <View style={styles.call_box}>
                                        <Image source={images.icons.call} style={styles.call_icon} />
                                    </View>
                                    <View style={styles.item_box}>
                                        <AppText style={styles.item_header}>{item?.text}</AppText>
                                        {item?.number ?
                                            <TouchableOpacity onPress={() => Linking.openURL(`tel://${item?.number}`)}>
                                                <AppText weight='semibold' style={[styles.item_text, {fontSize: font(16)}]}>{item?.number}</AppText>
                                            </TouchableOpacity>
                                            : null}
                                    </View>
                                </Row>
                            )
                        })}
                        <Row style={styles.item_row}>
                            <View style={styles.call_box}>
                                <Image source={images.icons.call} style={styles.call_icon} />
                            </View>
                            <View style={[styles.item_box]}>
                            <TouchableOpacity onPress={() => Linking.openURL(`tel:+1-888-262-8869`)}>
                                        <AppText weight='bold' style={[styles.item_text, {fontSize: font(16)}]}>Call Flagship Towing</AppText>
                                    </TouchableOpacity>
                                {/* <AppText style={styles.item_header}>asd</AppText> */}
                                {/* {item?.number ?
                                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${item?.number}`)}>
                                        <AppText weight='semibold' style={[styles.item_text, {fontSize: font(16)}]}>{item?.number}</AppText>
                                    </TouchableOpacity>
                                    : null} */}
                            </View>
                        </Row>
                    </View>
                </WhiteWrapper>
                <WhiteWrapper>
                    <View style={styles.btn_style}>
                        <AppText weight='bold' style={{fontSize: font(18)}}>Safety Tips</AppText>
                    </View>
                    <View style={{ padding: heightPixel(10) }}>
                        {data?.data?.safety_tips?.map((item: any, index: number) => (
                            <Row style={styles.item_row}>
                                {/* <View style={styles.call_box}>
                                    <Image source={images.icons.call} style={styles.call_icon} />
                                </View> */}
                                {/* <View style={styles.item_box}> */}
                                <AppText style={styles.item_header}>{index + 1}. {item?.text}</AppText>
                                {/* </View> */}
                            </Row>
                        ))}
                    </View>
                </WhiteWrapper>
            </ScrollView>

        </AppWrapper>
    )
}

export default EmergencyScreen;
