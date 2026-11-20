import {navigate} from '@Utils/navigation';
import {applyFormApiError} from '@Utils/formErrors';
import {forgotEmailValidation} from '@Utils/validators';
import {FormikHelpers, FormikProps} from 'formik';
import {useEffect, useRef} from 'react';
import Toast from 'react-native-toast-message';
import {useIsFocused} from '@react-navigation/native';
import {useForgotPasswordMutation} from '@Api/auth';

const initialValues = {
  email: '',
};

type IValues = {
  email: string;
};

const FORGOT_FIELDS = ['email'] as const;

const useForgotPassword = () => {
  const formikRef = useRef<FormikProps<typeof initialValues>>(null);
  const isFocused = useIsFocused();

  const [forgot, {isLoading}] = useForgotPasswordMutation();

  useEffect(() => {
    if (isFocused && formikRef.current) {
      formikRef.current.setFieldValue('email', '');
    }
  }, [isFocused]);

  const handleForgot = async (
    values: IValues,
    helpers: FormikHelpers<IValues>,
  ) => {
    try {
      const res = await forgot({email: values.email}).unwrap();
      Toast.show({
        type: 'success',
        text1: res?.message || 'Code has been sent to email.',
      });
      navigate('VerificationCode', {email: values?.email});
    } catch (error) {
      applyFormApiError(error, helpers, FORGOT_FIELDS);
    }
  };

  return {
    validator: forgotEmailValidation,
    values: {
      formikRef,
      initialValues,
      isLoading,
    },
    functions: {
      handleForgot,
    },
  };
};

export default useForgotPassword;
