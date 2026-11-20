import AdminPageShell from "../../../components/AdminPageShell";
import Button from "../../../components/Button";
import ListToolbar from "../../../components/ListToolbar";
import Table from "../../../components/Table";
import useViewServicesController from "./useViewServicesController";

const ViewServices = () => {
  const { values, functions } = useViewServicesController();

  return (
    <AdminPageShell
      title="Services"
      toolbar={
        <ListToolbar
          search={values.search}
          onSearch={functions.onSearch}
          action={
            <Button text="Add Service" onClick={functions.handleAddEdit} rounded size="lg" />
          }
        />
      }
    >
      <Table
        columns={values.columns}
        data={values?.data}
        loading={values.isLoading}
        pagination={values.pagination}
      />
    </AdminPageShell>
  );
};

export default ViewServices;
