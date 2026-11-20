import {navigate} from '@Utils/navigation';
import {applyFormApiError} from '@Utils/formErrors';
import {signupValidator} from '@Utils/validators';
import {FormikHelpers, FormikProps} from 'formik';
import {useRef} from 'react';
import Toast from 'react-native-toast-message';
import useToggle from '@Hooks/useToggle';
import {useSignupMutation} from '@Api/auth';

const initialValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
};

type IValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
};

const SIGNUP_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'password',
  'password_confirmation',
] as const;

const useSignup = () => {
  const formikRef = useRef<FormikProps<typeof initialValues>>(null);
  const [visible, , toggleVisible] = useToggle();
  const [accept, , toggleAccept] = useToggle();
  const [agreement, , toggleAgreement] = useToggle();

  const [signup, {isLoading}] = useSignupMutation();

  const handleSignup = async (
    values: IValues,
    helpers: FormikHelpers<IValues>,
  ) => {
    if (!agreement) {
      return Toast.show({
        type: 'error',
        text1: 'Please Accept Terms & Conditions and Member Agreement',
      });
    }

    const obj = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone,
      password: values.password,
    };

    try {
      await signup(obj).unwrap();
      navigate('Login');
    } catch (error) {
      applyFormApiError(error, helpers, SIGNUP_FIELDS);
    }
  };

  const handleYes = () => {};

  return {
    validator: signupValidator,
    values: {
      formikRef,
      initialValues,
      visible,
      accept,
      isLoading,
      agreement,
    },
    functions: {
      handleSignup,
      toggleAgreement,
      toggleVisible,
      handleYes,
      toggleAccept,
    },
  };
};

export default useSignup;
