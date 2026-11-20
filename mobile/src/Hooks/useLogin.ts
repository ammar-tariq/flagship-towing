import {getFcmToken, requestUserPermission} from '@Utils/Notification';
import {applyFormApiError} from '@Utils/formErrors';
import {loginValidation} from '@Utils/validators';
import {FormikHelpers, FormikProps} from 'formik';
import {useRef} from 'react';
import {useLoginMutation} from '@Api/auth';

const initialValues = {
  email: '',
  password: '',
};

type IValues = {
  email: string;
  password: string;
};

const LOGIN_FIELDS = ['email', 'password'] as const;

const useLogin = () => {
  const formikRef = useRef<FormikProps<typeof initialValues>>(null);

  const [login, {isLoading}] = useLoginMutation();

  const handleLogin = async (
    data: IValues,
    helpers: FormikHelpers<IValues>,
  ) => {
    try {
      // Ensure notification permission before fetching FCM token for device registration.
      let deviceId = await requestUserPermission();
      if (!deviceId) {
        deviceId = await getFcmToken();
      }

      const temp = {
        email: data?.email,
        password: data?.password,
        source: 'user',
        device_id: deviceId || 'unknown',
      };
      await login(temp).unwrap();
    } catch (error) {
      applyFormApiError(error, helpers, LOGIN_FIELDS);
    }
  };

  return {
    validator: loginValidation,
    values: {
      formikRef,
      initialValues,
      isLoading,
    },
    functions: {
      handleLogin,
    },
  };
};

export default useLogin;
