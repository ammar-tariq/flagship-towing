import Table from "../../../components/Table";
import DetailsPage from "../../../components/Wrappers/DetailsPage";
import useViewFamilyMembersController from "./useViewFamilyMembersController";

const ViewFamilyMembers = () => {
  const { values } = useViewFamilyMembersController();

  return (
    <DetailsPage title="New Authorized User Requests">
      <div className="p-4 sm:p-6 lg:p-12 bg-gray-50 grid gap-4 lg:gap-7 rounded-xl">
        <Table
          columns={values.columns}
          data={values?.data}
          loading={values.isLoading}
        />
      </div>
    </DetailsPage>
  );
};

export default ViewFamilyMembers;
