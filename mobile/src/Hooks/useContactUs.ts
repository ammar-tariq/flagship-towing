import {goBack} from '@Utils/navigation';
import {applyFormApiError} from '@Utils/formErrors';
import {contactUsValidator} from '@Utils/validators';
import {FormikHelpers, FormikProps} from 'formik';
import {useRef} from 'react';
import {Linking} from 'react-native';
import {useSelector} from 'react-redux';
import useToggle from '@Hooks/useToggle';
import {useContactUsMutation} from '@Api/user';
import {
  selectUnauthenticated,
  selectUserProfile,
} from '@Store/userSlice';

type IValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const CONTACT_FIELDS = ['name', 'email', 'subject', 'message'] as const;

const useContactUs = () => {
  const [visible, , toggleVisible] = useToggle();

  const user = useSelector(selectUserProfile);
  const unauthenticated = useSelector(selectUnauthenticated);
  const [contactUs, {isLoading}] = useContactUsMutation();

  const initialValues: IValues = {
    name: user?.name || '',
    email: unauthenticated ? '' : user?.email || '',
    subject: '',
    message: '',
  };

  const formikRef = useRef<FormikProps<IValues>>(null);

  const handleHyperLink = () => {
    Linking.openURL('mailto:memberships@flagshiptowing.us');
  };

  const handleUpdate = async (
    values: IValues,
    helpers: FormikHelpers<IValues>,
  ) => {
    try {
      await contactUs(values).unwrap();
      if (formikRef.current) {
        formikRef.current.resetForm({
          values: {
            name: user?.name || '',
            email: user?.email || '',
            subject: '',
            message: '',
          },
          touched: {},
          errors: {},
        });
      }
      toggleVisible();
    } catch (error) {
      applyFormApiError(error, helpers, CONTACT_FIELDS);
    }
  };

  const handleYes = () => {
    toggleVisible();
    goBack();
  };

  return {
    validator: contactUsValidator,
    values: {
      formikRef,
      initialValues,
      visible,
      isLoading,
      canEditEmail: unauthenticated,
    },
    functions: {
      handleUpdate,
      toggleVisible,
      handleYes,
      handleHyperLink,
    },
  };
};

export default useContactUs;
