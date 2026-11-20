import React, {FC, useRef} from 'react';
import {Keyboard, TextInput, TouchableOpacity} from 'react-native';
import {styles} from './styles';
import {Formik} from 'formik';
import InputField from '@Components/InputField';
import Button from '@Components/Button';
import {PhoneNumberInput} from '@Components/PhoneNumberInput';
import HyperLink from '@Components/HyperLink';
import {navigate} from '@Utils/navigation';
import useSignup from '@Hooks/useSignup';
import {images} from '@Assets/Images';
import Row from '@Components/Row';
import {DialogBox} from '@Components/DialogBox';
import CheckBox from '@Components/CheckBox';
import {font} from '@Utils/helpers';
import {colors} from '@Utils/color';
import AppText from '@Components/AppText';
import AuthWrapper from '@Components/Wrapper/AuthWrapper';

export const SignupScreen: FC = () => {
  const {values, functions, validator} = useSignup();
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  return (
    <AuthWrapper header="Sign Up" subheader="Enter your credentials">
      <DialogBox
        status="warning"
        onClose={functions.toggleVisible}
        visible={values.visible}
        heading="Account Registered Successfully"
        button={[{text: 'Ok', onPress: functions.handleYes}]}
      />
      <Formik
        innerRef={values.formikRef}
        initialValues={values.initialValues}
        validationSchema={validator}
        onSubmit={functions.handleSignup}>
        {({handleSubmit, values: data, setFieldValue}) => (
          <>
            <InputField
              name="first_name"
              placeholder="Enter First Name Here"
              label="First Name"
              leftIcon={images.icons.person}
              required
              returnKeyType="next"
              value={data.first_name}
              autoCapitalize="words"
              onSubmitEditing={() => lastNameRef.current?.focus()}
            />
            <InputField
              ref={lastNameRef}
              name="last_name"
              placeholder="Enter Last Name Here"
              label="Last Name"
              leftIcon={images.icons.person}
              required
              returnKeyType="next"
              value={data.last_name}
              autoCapitalize="words"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <PhoneNumberInput
              name="phone"
              required
              value={data.phone}
              returnKeyType="next"
              onChange={value => setFieldValue('phone', value)}
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            <InputField
              ref={emailRef}
              name="email"
              placeholder="Enter Email"
              returnKeyType="next"
              required
              leftIcon={images.icons.mail}
              label="Email Address"
              value={data.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <InputField
              ref={passwordRef}
              name="password"
              placeholder="Enter Password"
              secureTextEntry
              required
              label="Password"
              value={data.password}
              leftIcon={images.icons.lock}
              returnKeyType="next"
              textContentType="newPassword"
              autoComplete="password-new"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <InputField
              ref={confirmRef}
              name="password_confirmation"
              placeholder="Confirm Password"
              secureTextEntry
              leftIcon={images.icons.lock}
              required
              label="Confirm Password"
              value={data.password_confirmation}
              returnKeyType="done"
              textContentType="newPassword"
              autoComplete="password-new"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleSubmit();
              }}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={functions.toggleAgreement}
              style={styles.terms_row}>
              <CheckBox
                active={values.agreement}
                onPress={functions.toggleAgreement}
              />
              <AppText weight="medium" style={[styles.terms_text, {fontSize: font(12)}]}>
                I Agree to{' '}
                <AppText
                  weight="medium"
                  style={{textDecorationLine: 'underline', color: colors.primary, fontSize: font(12)}}
                  onPress={() => navigate('TermsAndConditions')}>
                  Terms & Conditions
                </AppText>
                {' and the '}
                <AppText
                  weight="medium"
                  style={{textDecorationLine: 'underline', color: colors.primary, fontSize: font(12)}}
                  onPress={() => navigate('MemberAgreement')}>
                  Member Agreement
                </AppText>
              </AppText>
            </TouchableOpacity>

            <Button
              text="Sign Up"
              isLoading={values?.isLoading}
              disabled={values?.isLoading}
              style={styles.btn_style}
              onPress={handleSubmit}
            />

            <Row style={styles.row_style}>
              <AppText style={styles.granite_text}>Have an account already? </AppText>
              <HyperLink
                text="Login Now"
                weight="semibold"
                underline={false}
                textStyle={styles.link_text}
                onPress={() => navigate('Login')}
              />
            </Row>
          </>
        )}
      </Formik>
    </AuthWrapper>
  );
};
