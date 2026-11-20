import {RouteProp, useRoute} from '@react-navigation/native';
import {navigate} from '@Utils/navigation';
import {applyFormApiError} from '@Utils/formErrors';
import {recoverSchema} from '@Utils/validators';
import {FormikHelpers, FormikProps} from 'formik';
import {useRef} from 'react';
import useToggle from '@Hooks/useToggle';
import {useSetPasswordMutation} from '@Api/auth';

const initialValues = {
  password: '',
  password_confirmation: '',
};

type IValues = {
  password: string;
  password_confirmation: string;
};

type RouteParams = {
  email: string;
};

const RECOVER_FIELDS = ['password', 'password_confirmation'] as const;

const useRecoverPassword = () => {
  const formikRef = useRef<FormikProps<typeof initialValues>>(null);
  const [visible, , toggleVisible] = useToggle();
  const route = useRoute<RouteProp<{params: RouteParams}, 'params'>>();

  const [setPassword, {isLoading}] = useSetPasswordMutation();

  const handleVerification = async (
    values: IValues,
    helpers: FormikHelpers<IValues>,
  ) => {
    try {
      await setPassword({
        email: route?.params?.email,
        password: values.password,
      }).unwrap();
      toggleVisible();
    } catch (error) {
      applyFormApiError(error, helpers, RECOVER_FIELDS);
    }
  };

  const handleYes = () => {
    toggleVisible();
    navigate('Login');
  };

  return {
    validator: recoverSchema,
    values: {
      formikRef,
      initialValues,
      visible,
      isLoading,
    },
    functions: {
      handleVerification,
      toggleVisible,
      handleYes,
    },
  };
};

export default useRecoverPassword;
