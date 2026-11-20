import AdminPageShell from "../../components/AdminPageShell"
import ListToolbar from "../../components/ListToolbar"
import Table from "../../components/Table"
import useAuthorizedUserRequestsController from "./useAuthorizedUserRequestsController"

const AuthorizedUserRequests = () => {
    const { values, functions } = useAuthorizedUserRequestsController()

    return (
        <AdminPageShell
            title="Authorized User Requests"
            toolbar={
                <ListToolbar
                    search={values.search}
                    onSearch={functions.onSearch}
                    placeholder="Search by authorized user name..."
                />
            }
        >
            <p className="text-sm text-gray-600 -mt-2">
                Pending requests from member accounts to add authorized users. The member account
                column shows who submitted each request.
            </p>
            <Table
                columns={values.columns}
                data={values?.data}
                loading={values.isLoading}
            />
        </AdminPageShell>
    )
}

export default AuthorizedUserRequests
