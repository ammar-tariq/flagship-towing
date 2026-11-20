import Table from "../../../components/Table";
import useViewFeedbacksController from "./useViewFeedbacksController";

const ViewFeedbacks = () => {

  const { values, functions } = useViewFeedbacksController()

  return (
      <Table
        columns={values.columns}
      data={values?.data}
      loading={values.isLoading}
      pagination={values.pagination}
      header={{
        title: "User Inquiries",
        onSearch: functions.onSearch
      }}
    />
  )

}

export default ViewFeedbacks;
