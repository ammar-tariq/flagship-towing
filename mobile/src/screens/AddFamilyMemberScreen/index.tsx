import Button from '@Components/Button';
import InputField from '@Components/InputField';
import {Formik} from 'formik';
import React, {useRef} from 'react';
import {Keyboard, TextInput} from 'react-native';
import useAddMember from '@Hooks/useAddMember';
import {styles} from './styles';
import {DialogBox} from '@Components/DialogBox';
import {PhoneNumberInput} from '@Components/PhoneNumberInput';
import {heightPixel} from '@Utils/helpers';
import AppScreen from '@Components/AppScreen';
import AppScroll from '@Components/AppScroll';

const AddFamilyMemberScreen = () => {
  const {values, functions, validator} = useAddMember();
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const relationRef = useRef<TextInput>(null);

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
          subheading="The new user will be added after administrative review in compliance with the Member Agreement, Terms, and Conditions."
          button={[{text: 'Ok', onPress: functions.handleYes}]}
        />
        <Formik
          initialValues={values.initialValues}
          validationSchema={validator}
          onSubmit={functions.handleAdd}>
          {({handleSubmit, values: data, setFieldValue}) => (
            <>
              <InputField
                name="first_name"
                placeholder="Enter First Name"
                label="First Name"
                required
                returnKeyType="next"
                value={data.first_name}
                autoCapitalize="words"
                onSubmitEditing={() => lastNameRef.current?.focus()}
              />
              <InputField
                ref={lastNameRef}
                name="last_name"
                placeholder="Enter Last Name"
                label="Last Name"
                required
                returnKeyType="next"
                value={data.last_name}
                autoCapitalize="words"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              <InputField
                ref={emailRef}
                name="email"
                placeholder="Enter Email"
                returnKeyType="next"
                required
                label="Email Address"
                value={data.email}
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={() => relationRef.current?.focus()}
              />
              <PhoneNumberInput
                label="Phone Number"
                name="phone"
                required
                value={data.phone}
                returnKeyType="next"
                onChange={value => setFieldValue('phone', value)}
                onSubmitEditing={() => relationRef.current?.focus()}
              />
              <InputField
                ref={relationRef}
                name="relation"
                placeholder="Enter Relationship"
                returnKeyType="done"
                required
                label="Relationship"
                value={data.relation}
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  handleSubmit();
                }}
              />
              <Button
                isLoading={values?.isLoading}
                disabled={values?.isLoading}
                text="Add Authorized User"
                style={styles.btnStyle}
                onPress={handleSubmit}
              />
            </>
          )}
        </Formik>
      </AppScroll>
    </AppScreen>
  );
};

export default AddFamilyMemberScreen;
