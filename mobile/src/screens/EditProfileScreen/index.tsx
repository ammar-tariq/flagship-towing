import {images} from '@Assets/Images';
import React, {useRef, useState} from 'react';
import {Keyboard, TextInput, View} from 'react-native';
import Button from '@Components/Button';
import {Formik} from 'formik';
import useEditProfile from '@Hooks/useEditProfile';
import InputField from '@Components/InputField';
import {PhoneNumberInput} from '@Components/PhoneNumberInput';
import {AddressSearchModal} from '@Components/AddressSearchModal';
import TouchableInput from '@Components/TouchableInput';
import {DialogBox} from '@Components/DialogBox';
import AppScreen from '@Components/AppScreen';
import AppScroll from '@Components/AppScroll';
import {profileLayout as styles} from '@Components/ProfileHero';

const EditProfileScreen = () => {
  const {values, validator, functions} = useEditProfile();
  const lastNameRef = useRef<TextInput>(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  return (
    <AppScreen edges={['bottom']} style={styles.screen}>
      <AppScroll
        keyboardAware
        style={styles.scroll}
        contentContainerStyle={styles.scroll_content}>
        <DialogBox
          status="correct"
          onClose={functions.toggleVisible}
          visible={values.visible}
          subheading="Profile updated successfully!"
          button={[{text: 'Ok', onPress: functions.handleYes}]}
        />

        <View style={styles.content}>
          <Formik
            enableReinitialize
            initialValues={values.initialValues}
            validationSchema={validator}
            onSubmit={functions.handleUpdate}>
            {({
              handleSubmit,
              values: data,
              setFieldValue,
              setFieldTouched,
              validateForm,
            }) => (
              <>
                <AddressSearchModal
                  visible={addressModalVisible}
                  currentValue={data.mailing_address}
                  onClose={() => setAddressModalVisible(false)}
                  onAddressSelect={async address => {
                    await setFieldValue('mailing_address', address, false);
                    await setFieldTouched('mailing_address', true, false);
                    await validateForm({...data, mailing_address: address});
                    setAddressModalVisible(false);
                  }}
                />
                <View style={styles.form_card}>
                  <InputField
                    name="first_name"
                    placeholder="Enter first name"
                    label="First Name"
                    leftIcon={images.icons.person}
                    required
                    returnKeyType="next"
                    value={data.first_name}
                    autoCapitalize="words"
                    textInputContainerStyle={styles.input_surface}
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                  />
                  <InputField
                    ref={lastNameRef}
                    name="last_name"
                    placeholder="Enter last name"
                    label="Last Name"
                    leftIcon={images.icons.person}
                    required
                    returnKeyType="done"
                    value={data.last_name}
                    autoCapitalize="words"
                    textInputContainerStyle={styles.input_surface}
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  <InputField
                    label="Email"
                    disabled
                    leftIcon={images.icons.mail}
                    required
                    returnKeyType="next"
                    value={values?.user?.email}
                    textInputContainerStyle={styles.input_surface}
                  />
                  <PhoneNumberInput
                    name="phone"
                    required
                    value={data.phone}
                    returnKeyType="done"
                    style={styles.input_surface}
                    onChange={value => setFieldValue('phone', value)}
                    onSubmitEditing={() => {
                      Keyboard.dismiss();
                    }}
                  />
                  <TouchableInput
                    onPress={() => {
                      Keyboard.dismiss();
                      setAddressModalVisible(true);
                    }}
                    name="mailing_address"
                    value={data.mailing_address}
                    placeholder="Enter Mailing Address"
                    label="Mailing Address"
                    leftIcon={images.icons.home}
                    textInputContainerStyle={styles.input_surface}
                  />
                </View>

                <Button
                  isLoading={values?.isLoading}
                  disabled={values?.isLoading}
                  style={styles.update_btn}
                  text="Update"
                  onPress={handleSubmit}
                />
              </>
            )}
          </Formik>
        </View>
      </AppScroll>
    </AppScreen>
  );
};

export default EditProfileScreen;
