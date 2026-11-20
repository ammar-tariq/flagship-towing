import Table from "../../../components/Table";
import useViewPaymentLogsController from "./useViewPaymentLogsController";

const ViewPaymentLogs = () => {

  const { values, functions } = useViewPaymentLogsController()

  return (
    <Table
      columns={values.columns}
      data={values?.data}
      loading={values.isLoading}
      header={{
        title: "Payment Logs",
        onCreate: functions.handleAddEdit,
        onSearch: functions.onSearch
      }}
    />
  )

}

export default ViewPaymentLogs;
