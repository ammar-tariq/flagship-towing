import AdminPageShell from "../../../components/AdminPageShell";
import ListToolbar from "../../../components/ListToolbar";
import Table from "../../../components/Table";
import useViewPackagesController from "./useViewPackagesController";

const ViewPackages = () => {
  const { values, functions } = useViewPackagesController();

  return (
    <AdminPageShell
      title="Membership Plan Management"
      toolbar={
        <ListToolbar search={values.search} onSearch={functions.onSearch} />
      }
    >
      <Table
        columns={values.columns}
        data={values?.data}
        loading={values.isLoading}
      />
    </AdminPageShell>
  );
};

export default ViewPackages;
