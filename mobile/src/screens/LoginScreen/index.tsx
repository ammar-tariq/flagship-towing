import {images} from '@Assets/Images';
import InputField from '@Components/InputField';
import AuthWrapper from '@Components/Wrapper/AuthWrapper';
import {Formik} from 'formik';
import React, {useRef} from 'react';
import {Keyboard, TextInput} from 'react-native';
import useLogin from '@Hooks/useLogin';
import {styles} from './styles';
import Button from '@Components/Button';
import {navigate} from '@Utils/navigation';
import HyperLink from '@Components/HyperLink';

export const LoginScreen = () => {
  const {values, functions, validator} = useLogin();
  const passwordRef = useRef<TextInput>(null);

  return (
    <AuthWrapper login header="Sign In" subheader="Enter your credentials">
      <Formik
        enableReinitialize
        innerRef={values.formikRef}
        initialValues={values.initialValues}
        validationSchema={validator}
        onSubmit={functions.handleLogin}>
        {({handleSubmit, values: data}) => (
          <>
            <InputField
              name="email"
              placeholder="Enter Email Address"
              returnKeyType="next"
              value={data.email}
              label="Email Address"
              leftIcon={images.icons.mail}
              required
              autoFocus
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
              leftIcon={images.icons.lock}
              returnKeyType="done"
              label="Password"
              required
              value={data.password}
              autoComplete="password"
              textContentType="password"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleSubmit();
              }}
            />
            <HyperLink
              text="Forgot Password?"
              underline={false}
              style={styles.forgot_text}
              onPress={() => navigate('ForgotPassword')}
            />
            <Button
              isLoading={values.isLoading}
              disabled={values.isLoading}
              style={styles.btn_login}
              text="Sign in"
              onPress={handleSubmit}
            />
            <HyperLink
              text="Sign Up"
              style={styles.hyperlink}
              onPress={() => navigate('Signup')}
              weight="semibold"
            />
          </>
        )}
      </Formik>
    </AuthWrapper>
  );
};
