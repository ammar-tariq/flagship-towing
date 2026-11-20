import AdminPageShell from "../../../components/AdminPageShell";
import Button from "../../../components/Button";
import ListToolbar from "../../../components/ListToolbar";
import Table from "../../../components/Table";
import useViewRepresentativesController from "./useViewRepresentativesController";

const ViewRepresentatives = () => {
  const { values, functions } = useViewRepresentativesController();

  return (
    <AdminPageShell
      title="Partner Management"
      toolbar={
        <ListToolbar
          search={values.search}
          onSearch={functions.onSearch}
          action={
            <Button text="Add Partner" onClick={functions.handleAddEdit} rounded size="lg" />
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

export default ViewRepresentatives;
