import Button from '@Components/Button';
import HyperLink from '@Components/HyperLink';
import InputField from '@Components/InputField';
import AuthWrapper from '@Components/Wrapper/AuthWrapper';
import {Formik} from 'formik';
import React, {useRef} from 'react';
import {Keyboard, TextInput} from 'react-native';
import {styles} from './styles';
import {navigate} from '@Utils/navigation';
import useRecoverPassword from '@Hooks/useRecoverPassword';
import {DialogBox} from '@Components/DialogBox';
import {images} from '@Assets/Images';

const RecoverPasswordScreen = () => {
  const {values, functions, validator} = useRecoverPassword();
  const confirmRef = useRef<TextInput>(null);

  return (
    <AuthWrapper
      header="Password Recovery"
      subheader="Set a new password for your account.">
      <DialogBox
        status="correct"
        onClose={functions.toggleVisible}
        visible={values.visible}
        subheading="Password updated successfully"
        button={[{text: 'Login', onPress: functions.handleYes}]}
      />
      <Formik
        innerRef={values.formikRef}
        initialValues={values.initialValues}
        validationSchema={validator}
        onSubmit={functions.handleVerification}>
        {({handleSubmit, values: data}) => (
          <>
            <InputField
              name="password"
              placeholder="Enter Password"
              secureTextEntry
              label="New Password"
              leftIcon={images.icons.lock}
              required
              returnKeyType="next"
              value={data.password}
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
              returnKeyType="done"
              value={data.password_confirmation}
              textContentType="newPassword"
              autoComplete="password-new"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleSubmit();
              }}
            />

            <Button
              isLoading={values?.isLoading}
              disabled={values?.isLoading}
              text="Update"
              onPress={handleSubmit}
            />
          </>
        )}
      </Formik>
      <HyperLink
        text="Back To Login"
        style={styles.signUpStyle}
        onPress={() => navigate('Login')}
      />
    </AuthWrapper>
  );
};

export default RecoverPasswordScreen;
