import {images} from '@Assets/Images';
import React, {Fragment} from 'react';
import {Image, ImageRequireSource, View} from 'react-native';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import InputField from '@Components/InputField';
import {navigate} from '@Utils/navigation';
import {DialogBox} from '@Components/DialogBox';
import useProfile from '@Hooks/useProfile';
import AppScreen from '@Components/AppScreen';
import AppScroll from '@Components/AppScroll';
import {profileLayout as styles} from '@Components/ProfileHero';
import {formatPhoneDisplay} from '@Utils/countries';

type FieldItem = {
  label: string;
  value: string;
  icon: ImageRequireSource;
};

const ProfileField = ({label, value, icon}: FieldItem) => (
  <View style={styles.field}>
    <View style={styles.field_icon_wrap}>
      <Image source={icon} style={styles.field_icon} />
    </View>
    <View style={styles.field_content}>
      <AppText weight="medium" style={styles.field_label}>
        {label}
      </AppText>
      <AppText weight="semibold" style={styles.field_value}>
        {value || '—'}
      </AppText>
    </View>
  </View>
);

const ActionRow = ({
  label,
  icon,
  onPress,
  last,
}: {
  label: string;
  icon: ImageRequireSource;
  onPress: () => void;
  last?: boolean;
}) => (
  <>
    <PressableScale variant="soft" onPress={onPress} style={styles.action_row}>
      <View style={styles.field_icon_wrap}>
        <Image source={icon} style={styles.field_icon} />
      </View>
      <AppText weight="semibold" style={styles.action_label}>
        {label}
      </AppText>
      <Image source={images.icons.forward} style={styles.action_chevron} />
    </PressableScale>
    {!last ? <View style={styles.divider} /> : null}
  </>
);

const ProfileScreen = () => {
  const {values, functions} = useProfile();
  const fullName = [values?.user?.first_name, values?.user?.last_name]
    .filter(Boolean)
    .join(' ');

  const fields: FieldItem[] = [
    {label: 'Full Name', value: fullName, icon: images.icons.person},
    {label: 'Email', value: values?.user?.email || '', icon: images.icons.mail},
    {
      label: 'Phone',
      value: formatPhoneDisplay(values?.user?.phone),
      icon: images.icons.phone,
    },
    {
      label: 'Mailing Address',
      value: values?.user?.mailing_address || '',
      icon: images.icons.home,
    },
  ];

  return (
    <AppScreen edges={[]} style={styles.screen}>
      <AppScroll
        style={styles.scroll}
        contentContainerStyle={styles.scroll_content}>
        <DialogBox
          status="warning"
          onClose={functions.toggleModal}
          visible={values.modal}
          heading={values.warning.heading}
          subheading={values.warning.message}
          button={[
            {text: 'Keep account', onPress: functions.toggleModal},
            {
              text: 'Delete account',
              onPress: functions.acceptWarning,
            },
          ]}
        />
        <DialogBox
          status="warning"
          onClose={functions.closePasswordModal}
          visible={values.passwordModal}
          heading={
            values.requiresPassword ? 'Confirm with your password' : 'Confirm deletion'
          }
          subheading={
            values.requiresPassword
              ? 'Enter your password so this deletion is not accidental.'
              : 'This account signs in with Apple or Google and has no password. Type the email on this account to confirm.'
          }
          button={[
            {text: 'Cancel', onPress: functions.closePasswordModal},
            {
              text: 'Delete account',
              isLoading: values?.isLoading,
              onPress: functions.submitDelete,
            },
          ]}>
          <InputField
            label={values.requiresPassword ? 'Password' : 'Email'}
            placeholder={
              values.requiresPassword ? 'Enter your password' : 'Enter your email'
            }
            value={values.confirmValue}
            onChangeText={functions.setConfirmValue}
            error={values.confirmError}
            secureTextEntry={values.requiresPassword}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={values.requiresPassword ? 'default' : 'email-address'}
            textContentType={values.requiresPassword ? 'password' : 'emailAddress'}
            autoComplete={values.requiresPassword ? 'password' : 'email'}
            leftIcon={
              values.requiresPassword ? images.icons.lock : images.icons.mail
            }
            returnKeyType="done"
            onSubmitEditing={functions.submitDelete}
          />
        </DialogBox>

        <View style={styles.content}>
          <View style={styles.card}>
            {fields.map((field, index) => (
              <Fragment key={field.label}>
                <ProfileField {...field} />
                {index < fields.length - 1 ? (
                  <View style={styles.divider} />
                ) : null}
              </Fragment>
            ))}
          </View>

          <View style={styles.card}>
            <ActionRow
              label="Edit Profile"
              icon={images.icons.edit}
              onPress={() => navigate('EditProfile')}
            />
            <ActionRow
              label="Change Password"
              icon={images.icons.lock}
              onPress={() => navigate('ChangePassword')}
              last
            />
          </View>

          <PressableScale
            variant="soft"
            onPress={functions.openDeleteWarning}
            disabled={values.checking || values.isLoading}
            style={styles.delete_btn}>
            <AppText weight="semibold" style={styles.delete_text}>
              Delete Account and Cancel Membership
            </AppText>
          </PressableScale>
        </View>
      </AppScroll>
    </AppScreen>
  );
};

export default ProfileScreen;
