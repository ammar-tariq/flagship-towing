import { useSelector } from 'react-redux';
import { useGetPaymentLogsQuery } from '@Api/user';
import { selectUserProfile } from '@Store/userSlice';

const useMembershipCard = () => {
  const {data, isLoading} = useGetPaymentLogsQuery();

  const user = useSelector(selectUserProfile);
  
  return {
    values: {
      data: data?.data,
      user,
      isLoading,
    },
    functions: {},
  };
};

export default useMembershipCard;
