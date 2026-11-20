import Button from '@Components/Button';
import HyperLink from '@Components/HyperLink';
import InputField from '@Components/InputField';
import AuthWrapper from '@Components/Wrapper/AuthWrapper';
import {Formik} from 'formik';
import React from 'react';
import {Keyboard, View} from 'react-native';
import {styles} from './styles';
import {navigate} from '@Utils/navigation';
import useVerification from '@Hooks/useVerification';

const VerificationCodeScreen = () => {
  const {values, functions, validator} = useVerification();

  return (
    <AuthWrapper
      header="Password Recovery"
      subheader="Please check your email for verification code. Your code is 6 digit in length">
      <Formik
        innerRef={values.formikRef}
        initialValues={values.initialValues}
        validationSchema={validator}
        onSubmit={functions.handleVerification}>
        {({handleSubmit, values: data}) => (
          <>
            <InputField
              name="otp"
              placeholder="Enter Verification Code"
              returnKeyType="done"
              value={data?.otp}
              label="Verification Code"
              required
              autoFocus
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleSubmit();
              }}
            />
            <HyperLink
              weight="regular"
              text="Resend Code"
              style={styles.resendCode}
              underline={false}
              onPress={functions.handleResend}
            />
            <Button
              isLoading={values?.isLoading}
              disabled={values?.isLoading}
              style={styles.btn_continue}
              text="Continue"
              onPress={handleSubmit}
            />
          </>
        )}
      </Formik>
      <View style={styles.signUpContainer}>
        <HyperLink
          text="Back To Login"
          weight="medium"
          textStyle={styles.signUpStyle}
          onPress={() => navigate('Login')}
        />
      </View>
    </AuthWrapper>
  );
};

export default VerificationCodeScreen;
