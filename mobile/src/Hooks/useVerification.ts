import {RouteProp, useRoute} from '@react-navigation/native';
import {navigate} from '@Utils/navigation';
import {applyFormApiError} from '@Utils/formErrors';
import {verificationSchema} from '@Utils/validators';
import {FormikHelpers, FormikProps} from 'formik';
import {useRef} from 'react';
import Toast from 'react-native-toast-message';
import {
  useForgotPasswordMutation,
  useVerifyMutation,
} from '@Api/auth';

const initialValues = {
  otp: '',
};

type IValues = {
  otp: string;
};

type RouteParams = {
  email: string;
};

const OTP_FIELDS = ['otp'] as const;

const useVerification = () => {
  const formikRef = useRef<FormikProps<typeof initialValues>>(null);

  const route = useRoute<RouteProp<{params: RouteParams}, 'params'>>();

  const [verify, {isLoading}] = useVerifyMutation();
  const [forgot, {isLoading: forgotLoad}] = useForgotPasswordMutation();

  const handleResend = async () => {
    try {
      const res = await forgot({
        email: route?.params?.email,
      }).unwrap();
      Toast.show({
        type: 'success',
        text1: res?.message || 'Code has been sent to email.',
      });
    } catch (error) {
      // Resend is not tied to the OTP field UX beyond toast/fallback.
      if (formikRef.current) {
        applyFormApiError(error, formikRef.current, OTP_FIELDS);
      }
    }
  };

  const handleVerification = async (
    values: IValues,
    helpers: FormikHelpers<IValues>,
  ) => {
    try {
      await verify({
        email: route?.params?.email,
        otp: values?.otp,
      }).unwrap();
      navigate('RecoverPassword', {
        email: route?.params?.email,
      });
    } catch (error) {
      applyFormApiError(error, helpers, OTP_FIELDS);
    }
  };

  return {
    validator: verificationSchema,
    values: {
      formikRef,
      initialValues,
      isLoading: forgotLoad || isLoading,
    },
    functions: {
      handleVerification,
      handleResend,
    },
  };
};

export default useVerification;
