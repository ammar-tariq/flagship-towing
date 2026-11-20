import { DownloadCloudIcon } from "lucide-react";
import AdminPageShell from "../../../components/AdminPageShell";
import Button from "../../../components/Button";
import ListToolbar from "../../../components/ListToolbar";
import Table from "../../../components/Table";
import useViewUsersController from "./useViewUsersController";

const ViewUsers = () => {
  const { values, functions } = useViewUsersController();

  return (
    <AdminPageShell
      title="User Management"
      toolbar={
        <ListToolbar
          search={values.search}
          onSearch={functions.onSearch}
          placeholder="Search by name, email, or phone..."
          action={
            <Button text="Add New Users" onClick={functions.handleAddEdit} rounded size="lg" />
          }
          extra={
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button
                text="Export to Excel"
                type="muted"
                Icon={DownloadCloudIcon}
                onClick={functions.exportExcel}
                rounded
                size="lg"
              />
            </div>
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

export default ViewUsers;
