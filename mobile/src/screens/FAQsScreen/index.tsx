import { Loader } from '@Components/Loader'
import AppText from '@Components/AppText';
import AppWrapper from '@Components/Wrapper/AppWrapper'
import { colors } from '@Utils/color'
import {heightPixel, font} from '@Utils/helpers'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useGetContentQuery } from '@Api/user'

type FaqItem = {
  title?: string;
  question?: string;
  answer?: string;
};

const FAQsScreen = () => {
  const {data, isLoading} = useGetContentQuery();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <AppWrapper scroll style={{paddingTop: 0}}>
      {data?.data?.faqs?.map((item: FaqItem, index: number) => {
                return (
                    <View key={index} style={styles.question_box}>
                        <AppText weight='semibold' style={{fontSize: font(16)}}>{item?.title}</AppText>
                        <AppText weight='medium' style={[styles.question_text, {fontSize: font(16)}]}>{item?.question}</AppText>
                        <AppText weight='bold' style={[styles.text_style,{marginVertical :0}, {fontSize: font(16)}]}>Answer : </AppText>
                        <AppText style={styles.text_style}>{item?.answer}</AppText>
                    </View>
                )
            })}
        </AppWrapper>
    )
}

const styles = StyleSheet.create({
    question_box: {
        marginVertical: heightPixel(10)
    },
    question_text: {
        marginTop: heightPixel(5),
        marginBottom : heightPixel(15)
    },
    text_style: {
        color: colors.placeholder,
        lineHeight: heightPixel(18),
        marginVertical: heightPixel(5)
    }
})

export default FAQsScreen
