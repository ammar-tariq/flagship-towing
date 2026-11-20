import Button from '@Components/Button';
import HyperLink from '@Components/HyperLink';
import InputField from '@Components/InputField';
import AuthWrapper from '@Components/Wrapper/AuthWrapper';
import {Formik} from 'formik';
import React from 'react';
import {Keyboard, View} from 'react-native';
import useForgotPassword from '@Hooks/useForgotPassword';
import {styles} from './styles';
import {navigate} from '@Utils/navigation';
import {images} from '@Assets/Images';

const ForgotPasswordScreen = () => {
  const {values, functions, validator} = useForgotPassword();

  return (
    <AuthWrapper
      header="Password Recovery"
      subheader="Enter email address to get a verification code">
      <Formik
        innerRef={values.formikRef}
        initialValues={values.initialValues}
        validationSchema={validator}
        onSubmit={functions.handleForgot}>
        {({handleSubmit, values: data}) => (
          <>
            <InputField
              name="email"
              placeholder="Enter Email Address"
              returnKeyType="done"
              value={data?.email}
              leftIcon={images.icons.mail}
              label="Email Address"
              required
              autoFocus
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleSubmit();
              }}
            />
            <Button
              isLoading={values?.isLoading}
              disabled={values?.isLoading}
              style={styles.btn_style}
              text="Continue"
              onPress={handleSubmit}
            />
          </>
        )}
      </Formik>
      <View style={styles.signUpContainer}>
        <HyperLink text="Back To Login" onPress={() => navigate('Login')} />
      </View>
    </AuthWrapper>
  );
};

export default ForgotPasswordScreen;
