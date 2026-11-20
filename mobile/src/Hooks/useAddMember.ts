import {goBack} from '@Utils/navigation';
import {applyFormApiError} from '@Utils/formErrors';
import {addMemberValidator} from '@Utils/validators';
import {FormikHelpers} from 'formik';
import useToggle from '@Hooks/useToggle';
import {useCreateFamilyMutation} from '@Api/user';

const initialValues = {
  first_name: '',
  last_name: '',
  email: '',
  relation: '',
  phone: '',
};

type IValues = {
  first_name: string;
  last_name: string;
  email: string;
  relation: string;
  phone: string;
};

const MEMBER_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'relation',
  'phone',
] as const;

const useAddMember = () => {
  const [visible, , toggleVisible] = useToggle();

  const [createFamily, {isLoading}] = useCreateFamilyMutation();

  const handleAdd = async (
    values: IValues,
    helpers: FormikHelpers<IValues>,
  ) => {
    try {
      await createFamily(values).unwrap();
      toggleVisible();
    } catch (error) {
      applyFormApiError(error, helpers, MEMBER_FIELDS);
    }
  };

  const handleYes = () => {
    toggleVisible();
    goBack();
  };

  return {
    validator: addMemberValidator,
    values: {
      initialValues,
      visible,
      isLoading,
    },
    functions: {
      handleAdd,
      toggleVisible,
      handleYes,
    },
  };
};

export default useAddMember;
