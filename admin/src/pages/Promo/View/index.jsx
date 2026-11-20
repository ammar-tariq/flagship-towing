import AdminPageShell from "../../../components/AdminPageShell";
import Button from "../../../components/Button";
import ListToolbar from "../../../components/ListToolbar";
import Table from "../../../components/Table";
import useViewPromoController from "./useViewPromoController";

const ViewPromos = () => {
  const { values, functions } = useViewPromoController();

  return (
    <AdminPageShell
      title="Promo Code Management"
      toolbar={
        <ListToolbar
          search={values.search}
          onSearch={functions.onSearch}
          action={
            <Button text="Add Promo" onClick={functions.handleAddEdit} rounded size="lg" />
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

export default ViewPromos;
