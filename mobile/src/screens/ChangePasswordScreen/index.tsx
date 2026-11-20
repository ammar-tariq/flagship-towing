import React, {useRef} from 'react';
import {Keyboard, TextInput} from 'react-native';
import {styles} from './styles';
import {Formik} from 'formik';
import useChangePassword from '@Hooks/useChangePassword';
import InputField from '@Components/InputField';
import Button from '@Components/Button';
import {images} from '@Assets/Images';
import {DialogBox} from '@Components/DialogBox';
import {heightPixel} from '@Utils/helpers';
import AppScreen from '@Components/AppScreen';
import AppScroll from '@Components/AppScroll';

const ChangePasswordScreen = () => {
  const {validator, values, functions} = useChangePassword();
  const newPassRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

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
          subheading="Password updated successfully!"
          button={[{text: 'Ok', onPress: functions.handleYes}]}
        />
        <Formik
          initialValues={values.initialValues}
          validationSchema={validator}
          onSubmit={functions.handleUpdate}>
          {({handleSubmit, values: data}) => (
            <>
              <InputField
                name="existing"
                placeholder="Enter Password"
                label="Old Password"
                required
                secureTextEntry
                leftIcon={images.icons.lock}
                returnKeyType="next"
                value={data.existing}
                textContentType="password"
                autoComplete="password"
                onSubmitEditing={() => newPassRef.current?.focus()}
              />
              <InputField
                ref={newPassRef}
                name="password"
                placeholder="Enter Password"
                label="New Password"
                required
                secureTextEntry
                leftIcon={images.icons.lock}
                returnKeyType="next"
                value={data.password}
                textContentType="newPassword"
                autoComplete="password-new"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <InputField
                ref={confirmRef}
                name="confirmPassword"
                placeholder="Enter Confirm Password"
                label="Confirm Password"
                required
                secureTextEntry
                leftIcon={images.icons.lock}
                returnKeyType="done"
                value={data.confirmPassword}
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
                style={styles.btnStyle}
                text="Update"
                onPress={handleSubmit}
              />
            </>
          )}
        </Formik>
      </AppScroll>
    </AppScreen>
  );
};

export default ChangePasswordScreen;
