import {RouteProp, useRoute} from '@react-navigation/native';
import {GeneralParamList} from '@Types/navigation';
import {useGetServiceByIdQuery} from '@Api/user';

const useServiceDetail = () => {
  const {params} = useRoute<RouteProp<GeneralParamList, 'ServiceDetail'>>();
  const serviceId = params?.id;

  const {data, isLoading} = useGetServiceByIdQuery(
    {id: serviceId ?? ''},
    {
      skip: !serviceId,
    },
  );

  return {
    values: {
      data: data?.data,
      isLoading,
    },
    functions: {},
  };
};

export default useServiceDetail;
