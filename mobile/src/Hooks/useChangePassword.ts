import {goBack} from '@Utils/navigation';
import {applyFormApiError} from '@Utils/formErrors';
import {passwordValidator} from '@Utils/validators';
import {FormikHelpers} from 'formik';
import useToggle from '@Hooks/useToggle';
import {useChangePasswordMutation} from '@Api/user';

const initialValues = {
  existing: '',
  password: '',
  confirmPassword: '',
};

type IValues = {
  existing: string;
  password: string;
  confirmPassword: string;
};

const PASSWORD_FIELDS = ['existing', 'password', 'confirmPassword'] as const;

const useChangePassword = () => {
  const [visible, , toggleVisible] = useToggle();

  const [changePassword, {isLoading}] = useChangePasswordMutation();

  const handleUpdate = async (
    values: IValues,
    helpers: FormikHelpers<IValues>,
  ) => {
    try {
      await changePassword({
        current_password: values.existing,
        new_password: values.password,
      }).unwrap();
      toggleVisible();
    } catch (error) {
      applyFormApiError(error, helpers, PASSWORD_FIELDS, {
        messageHints: [
          {match: /password must/i, field: 'password'},
          {match: /current password/i, field: 'existing'},
        ],
      });
    }
  };

  const handleYes = () => {
    toggleVisible();
    goBack();
  };

  return {
    validator: passwordValidator,
    values: {
      initialValues,
      visible,
      isLoading,
    },
    functions: {
      handleUpdate,
      handleYes,
      toggleVisible,
    },
  };
};

export default useChangePassword;
