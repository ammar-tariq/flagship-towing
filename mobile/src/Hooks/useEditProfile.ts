import {goBack} from '@Utils/navigation';
import {applyFormApiError} from '@Utils/formErrors';
import {editProfileValidator} from '@Utils/validators';
import {FormikHelpers} from 'formik';
import {useSelector} from 'react-redux';
import useToggle from '@Hooks/useToggle';
import {useUpdateProfileMutation} from '@Api/user';
import {selectUserProfile} from '@Store/userSlice';

type IValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mailing_address: string;
};

const PROFILE_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'mailing_address'] as const;

const useEditProfile = () => {
  const [visible, , toggleVisible] = useToggle();

  const [updateProfile, {isLoading}] = useUpdateProfileMutation();
  const user = useSelector(selectUserProfile);

  const initialValues = {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    mailing_address: user?.mailing_address || '',
  };

  const handleUpdate = async (
    values: IValues,
    helpers: FormikHelpers<IValues>,
  ) => {
    const obj = {
      first_name: values.first_name,
      last_name: values.last_name,
      phone: values.phone,
      mailing_address: values.mailing_address,
    };

    try {
      await updateProfile(obj).unwrap();
      toggleVisible();
    } catch (error) {
      applyFormApiError(error, helpers, PROFILE_FIELDS);
    }
  };

  const handleYes = () => {
    toggleVisible();
    goBack();
  };

  return {
    validator: editProfileValidator,
    values: {
      initialValues,
      visible,
      isLoading,
      user,
    },
    functions: {
      handleUpdate,
      toggleVisible,
      handleYes,
    },
  };
};

export default useEditProfile;
