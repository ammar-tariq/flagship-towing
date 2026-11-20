import { images } from '@Assets/Images';
import Button from '@Components/Button';
import { ActionSheet } from '@Components/Sheet';
import InputField from '@Components/InputField';
import { PhoneNumberInput } from '@Components/PhoneNumberInput';
import { AddressSearchModal } from '@Components/AddressSearchModal';
import { VesselLengthPickerModal } from '@Components/VesselLengthPickerModal';
import { AdvSourcePickerModal } from '@Components/AdvSourcePickerModal';
import { BoatingLocationPickerModal } from '@Components/BoatingLocationPickerModal';
import AppText from '@Components/AppText';
import TouchableInput from '@Components/TouchableInput';
import { ADV_SOURCE_CAPTAIN_REFERRAL } from '@Utils/data';
import { heightPixel, widthPixel , font} from '@Utils/helpers';
import { Formik } from 'formik';
import React, { useMemo, useState } from 'react';
import { Image, Keyboard, TouchableOpacity, View } from 'react-native';
import { navigate } from '@Utils/navigation';
import AppScreen from '@Components/AppScreen';
import AppScroll from '@Components/AppScroll';
import useAddVessel from '@Hooks/useAddVessel';
import { useGetBoatingLocationsQuery } from '@Api/user';
import { styles } from './styles';
import CheckBox from '@Components/CheckBox';
import Toast from 'react-native-toast-message';

const AddVesselScreen = () => {
  const { validator, values, functions } = useAddVessel();
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [vesselLengthModalVisible, setVesselLengthModalVisible] = useState(false);
  const [advSourceModalVisible, setAdvSourceModalVisible] = useState(false);
  const [boatingLocationModalVisible, setBoatingLocationModalVisible] = useState(false);
  const [termsAgreement, setTermsAgreement] = useState(false);
  const { data: boatingLocationsRes, isLoading: boatingLocationsLoading } =
    useGetBoatingLocationsQuery(undefined);
  const boatingLocationOptions = Array.isArray(boatingLocationsRes?.data)
    ? boatingLocationsRes.data
    : [];
  const imagePickerActions = useMemo(
    () => [
      {
        label: 'Open Camera',
        icon: images.icons.camera,
        onPress: functions.openCamera,
      },
      {
        label: 'Open Gallery',
        icon: images.icons.gallery,
        onPress: functions.openGallery,
      },
    ],
    [functions.openCamera, functions.openGallery],
  );
  return (
    <AppScreen edges={['bottom']}>
      <ActionSheet
        visible={Boolean(values?.imagePicker)}
        onClose={functions.closeImagePicker}
        title="Vessel photo"
        subtitle="Choose how to add an image"
        icon={images.icons.upload}
        actions={imagePickerActions}
      />
      <Formik
        initialValues={values.initialValues}
        validationSchema={validator}
        onSubmit={(d, helpers) => {
          if (!termsAgreement) {
            return Toast.show({
              type: 'error',
              text1: 'Please agree to the terms and conditions',
            });
          }
          functions.handleUpdate(d, helpers);
        }}>
        {({
          handleSubmit,
          values: data,
          touched,
          setFieldValue,
          setFieldTouched,
          setValues,
          setTouched,
          validateForm,
        }) => (
          <>
            <AddressSearchModal
              visible={addressModalVisible}
              currentValue={data.mailing_address}
              onClose={() => setAddressModalVisible(false)}
              onAddressSelect={async address => {
                const nextValues = {
                  ...data,
                  mailing_address: address,
                };
                await setValues(nextValues, false);
                await setTouched(
                  {
                    ...touched,
                    mailing_address: true,
                  },
                  false,
                );
                await validateForm(nextValues);
                setAddressModalVisible(false);
              }}
            />
            <VesselLengthPickerModal
              visible={vesselLengthModalVisible}
              currentValue={data.vessel_length}
              onClose={() => setVesselLengthModalVisible(false)}
              onSelect={async value => {
                const nextValues = {...data, vessel_length: value};
                await setValues(nextValues, false);
                await setTouched({...touched, vessel_length: true}, false);
                await validateForm(nextValues);
                setVesselLengthModalVisible(false);
              }}
            />
            <BoatingLocationPickerModal
              visible={boatingLocationModalVisible}
              currentValue={data.primary_boating_location}
              options={boatingLocationOptions}
              loading={boatingLocationsLoading}
              onClose={() => setBoatingLocationModalVisible(false)}
              onSelect={async value => {
                const nextValues = {
                  ...data,
                  primary_boating_location: value,
                };
                await setValues(nextValues, false);
                await setTouched(
                  {...touched, primary_boating_location: true},
                  false,
                );
                await validateForm(nextValues);
                setBoatingLocationModalVisible(false);
              }}
            />
            <AdvSourcePickerModal
              visible={advSourceModalVisible}
              currentValue={data.advName}
              onClose={() => setAdvSourceModalVisible(false)}
              onSelect={async value => {
                const nextValues = {...data, advName: value};
                await setValues(nextValues, false);
                await setTouched({...touched, advName: true}, false);
                await validateForm(nextValues);
              }}
            />

            <AppScroll
              keyboardAware
              extraScrollHeight={heightPixel(120)}
              contentContainerStyle={styles.container}>
            <View style={styles.section}>
              <AppText weight="semibold" style={[styles.header_text, {fontSize: font(18)}]}>
                Vessel Owner Information
              </AppText>
              <InputField
                keyboardType='default'
                required={true}
                value={data.first_name}
                name="first_name"
                placeholder="Enter First Name"
                returnKeyType="next"
                label="First Name"
              />
              <InputField
                required={true}
                value={data.last_name}
                name="last_name"
                placeholder="Enter Last Name"
                returnKeyType="next"
                label="Last Name"
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
                required={true}
              />
              <PhoneNumberInput
                required={true}
                label="Primary Phone Number"
                value={data.primary_phone}
                name="primary_phone"
                maxLength={10}
                onChange={value => setFieldValue('primary_phone', value)}
              />
              <PhoneNumberInput
                label="Secondary Phone Number"
                value={data.secondary_phone}
                name="secondary_phone"
                maxLength={10}
                onChange={value => setFieldValue('secondary_phone', value)}
              />
              <InputField
                required={true}
                value={data.email}
                name="email"
                keyboardType='email-address'
                placeholder="Enter Email Address"
                returnKeyType="next"
                label="Email Address"
              />
            </View>

            <View style={styles.section}>
              <AppText weight="semibold" style={[styles.header_text, {fontSize: font(18)}]}>
                Vessel information
              </AppText>
              <InputField
                required={true}
                value={data.make}
                name="make"
                placeholder="Enter manufacturer"
                returnKeyType="next"
                label="Manufacturer"
              />
              <InputField
                required={true}
                value={data.model}
                name="model"
                placeholder="Enter model"
                returnKeyType="next"
                label="Model"
              />
              <InputField
                required={true}
                keyboardType="number-pad"
                name="year"
                value={data.year}
                placeholder="Enter year"
                returnKeyType="next"
                label="Year"
                maxLength={4}
                onChangeText={v =>
                  setFieldValue('year', (v || '').replace(/\D/g, '').slice(0, 4))
                }
              />
              <InputField
                required={true}
                value={data.registration}
                placeholder="Enter registration"
                returnKeyType="next"
                label="Registration"
                maxLength={15}
                onChangeText={value => {
                  const upperValue = (value?.toUpperCase() || '').slice(0, 15);
                  setFieldValue('registration', upperValue);
                }}
                autoCapitalize="characters"
                name="registration"
              />
              <InputField
                value={data.hin_number}
                name="hin_number"
                placeholder="HIN"
                returnKeyType="next"
                label="HIN"
                autoCapitalize="characters"
                onChangeText={v =>
                  setFieldValue(
                    'hin_number',
                    (v || '').toUpperCase().replace(/\s/g, ''),
                  )
                }
              />
              <TouchableInput
                name="vessel_length"
                required={true}
                label="Length"
                placeholder="Select length"
                value={data.vessel_length || ''}
                onPress={() => {
                  Keyboard.dismiss();
                  setVesselLengthModalVisible(true);
                }}
              />
              <InputField
                value={data.hull_color}
                name="hull_color"
                placeholder="Enter hull color"
                returnKeyType="next"
                label="Color"
                required={true}
              />
              <TouchableInput
                onPress={() => {
                  Keyboard.dismiss();
                  setBoatingLocationModalVisible(true);
                }}
                name="primary_boating_location"
                value={data.primary_boating_location}
                placeholder="Select main boating location"
                label="Main boating location"
                required={true}
              />
            </View>

            <View style={styles.section}>
              <AppText weight="semibold" style={[styles.header_text, {fontSize: font(18)}]}>
                Upload Vessel Image
              </AppText>
              <AppText style={styles.imageHint}>
                Add one photo of your vessel
              </AppText>

              <TouchableOpacity
                onPress={functions.openImagePicker}
                activeOpacity={0.85}
                style={[
                  styles.image_box,
                  values?.image ? styles.image_boxFilled : null,
                ]}>
                {values?.image?.uri ? (
                  <>
                    <Image
                      source={{uri: values.image.uri}}
                      style={styles.vessel_image}
                    />
                    <View style={styles.imageOverlay}>
                      <AppText weight="semibold" style={styles.imageOverlayText}>
                        Change photo
                      </AppText>
                    </View>
                  </>
                ) : (
                  <View style={styles.add_box}>
                    <Image source={images.icons.plus} style={styles.add_icon} />
                  </View>
                )}
              </TouchableOpacity>
              {values?.image?.uri ? (
                <TouchableOpacity
                  onPress={functions.clearImage}
                  hitSlop={8}
                  style={styles.removeImageBtn}>
                  <AppText weight="medium" style={styles.removeImageText}>
                    Remove photo
                  </AppText>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.section}>
              <TouchableInput
                onPress={() => {
                  Keyboard.dismiss();
                  setAdvSourceModalVisible(true);
                }}
                name="advName"
                value={data.advName}
                placeholder="Select where you heard about us"
                label="Where did you hear about us?"
                required={true}
              />
              {data.advName === ADV_SOURCE_CAPTAIN_REFERRAL && (
                <InputField
                  required
                  value={data.captainName}
                  name="captainName"
                  placeholder="Enter Captain Name"
                  returnKeyType="next"
                  label="Captain Name"
                />
              )}
            </View>
            <View style={styles.section}>
              <View style={styles.terms_row}>
                <CheckBox active={termsAgreement} onPress={() => setTermsAgreement(!termsAgreement)} />
                <View style={{ marginLeft: widthPixel(10) }}>
                  <AppText weight='medium' style={[styles.terms_text, {fontSize: font(12)}]}>
                    <View>
                      <AppText weight='medium' style={{fontSize: font(12)}}>I Agree to </AppText>
                    </View>
                    <TouchableOpacity onPress={() => navigate('TermsAndConditions')}>
                      <AppText style={{ textDecorationLine: 'underline' }} weight='medium' >
                        Terms & Conditions
                      </AppText>
                    </TouchableOpacity>
                    <View>
                      <AppText style={{fontSize: font(12)}}> and the </AppText>
                    </View>
                    <TouchableOpacity onPress={() => navigate('MemberAgreement')}>
                      <AppText style={{ textDecorationLine: 'underline' }} weight='medium'>Member Agreement</AppText>
                    </TouchableOpacity>
                  </AppText>
                </View>
              </View>
            </View>
            <Button
              isLoading={values?.isLoading || values?.isVerifyingPayment}
              style={styles.btnStyle}
              text={values?.isVerifyingPayment ? 'Confirming payment…' : 'Add Vessel'}
              onPress={async () => {
                Keyboard.dismiss();
                const errors = await validateForm();
                const errorFields = Object.keys(errors);
                if (errorFields.length > 0) {
                  // Show inline errors on every invalid field, then toast so
                  // the user knows why nothing happened.
                  await setTouched(
                    {
                      ...touched,
                      ...Object.fromEntries(
                        errorFields.map(field => [field, true]),
                      ),
                    },
                    false,
                  );
                  const firstError =
                    errors[errorFields[0] as keyof typeof errors];
                  Toast.show({
                    type: 'error',
                    text1: 'Please complete the required fields',
                    text2:
                      typeof firstError === 'string' ? firstError : undefined,
                  });
                  return;
                }
                handleSubmit();
              }}
            />
            </AppScroll>
          </>
        )}
      </Formik>
    </AppScreen>
  );
};

export default AddVesselScreen;
