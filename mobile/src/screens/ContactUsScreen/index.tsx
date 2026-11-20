import React, {useRef} from 'react';
import {Keyboard, TextInput} from 'react-native';
import {styles} from './styles';
import {Formik} from 'formik';
import InputField from '@Components/InputField';
import {images} from '@Assets/Images';
import useContactUs from '@Hooks/useContactUs';
import {heightPixel} from '@Utils/helpers';
import Button from '@Components/Button';
import {DialogBox} from '@Components/DialogBox';
import HyperLink from '@Components/HyperLink';
import AppScreen from '@Components/AppScreen';
import AppScroll from '@Components/AppScroll';

const ContactUsScreen = () => {
  const {validator, values, functions} = useContactUs();
  const emailRef = useRef<TextInput>(null);
  const subjectRef = useRef<TextInput>(null);
  const messageRef = useRef<TextInput>(null);

  return (
    <AppScreen edges={['bottom']}>
      <AppScroll
        keyboardAware
        contentContainerStyle={[
          styles.container,
          {paddingBottom: heightPixel(24)},
        ]}>
        <DialogBox
          status="correct"
          onClose={functions.toggleVisible}
          visible={values.visible}
          subheading="Your message has been submitted successfully"
          button={[{text: 'Ok', onPress: functions.handleYes}]}
        />
        <Formik
          enableReinitialize
          innerRef={values.formikRef}
          initialValues={values.initialValues}
          validationSchema={validator}
          onSubmit={functions.handleUpdate}>
          {({handleSubmit, values: data}) => (
            <>
              <InputField
                name="name"
                placeholder="Enter Name Here"
                leftIcon={images.icons.person}
                returnKeyType="next"
                label="User Name"
                value={data.name}
                autoCapitalize="words"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              <InputField
                ref={emailRef}
                name="email"
                placeholder="Enter Email Address"
                value={data.email}
                leftIcon={images.icons.mail}
                returnKeyType="next"
                label="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={!values.canEditEmail && !!values.initialValues.email}
                onSubmitEditing={() => subjectRef.current?.focus()}
              />
              <InputField
                ref={subjectRef}
                name="subject"
                placeholder="Enter Subject"
                value={data.subject}
                leftIcon={images.icons.write}
                returnKeyType="next"
                label="Subject"
                onSubmitEditing={() => messageRef.current?.focus()}
              />
              <InputField
                ref={messageRef}
                name="message"
                placeholder="Enter Message"
                value={data.message}
                returnKeyType="default"
                label="Message"
                multiline
                blurOnSubmit={false}
                textInputContainerStyle={styles.message_input}
              />
              <Button
                isLoading={values.isLoading}
                disabled={values.isLoading}
                style={styles.btnStyle}
                text="Submit"
                onPress={() => {
                  Keyboard.dismiss();
                  handleSubmit();
                }}
              />
              <HyperLink
                underline={false}
                style={{alignSelf: 'center'}}
                text="memberships@flagshiptowing.us"
                onPress={functions.handleHyperLink}
              />
            </>
          )}
        </Formik>
      </AppScroll>
    </AppScreen>
  );
};

export default ContactUsScreen;
