import { Navigate } from "react-router-dom"
import { createPortal } from "react-dom"
import AdminPageShell from "../../components/AdminPageShell"
import ListToolbar from "../../components/ListToolbar"
import Table from "../../components/Table"
import { isSuperAdminUser } from "../../utils/auth"
import { dateFormatter } from "../../utils/helper"
import useDeletedAccountsController from "./useDeletedAccountsController"

const selectClass =
    "h-11 rounded-full border border-black bg-white px-4 text-sm text-gray-800 outline-none"

const membershipLabel = (row) => {
    if (!row?.had_active_membership) {
        return "No running membership"
    }
    const count = row.active_membership_count || 1
    const days = row.days_remaining
    const who = count > 1 ? "Latest membership" : "Running membership"
    if (days == null) {
        return count > 1 ? `${count} running memberships` : "Running membership"
    }
    if (days <= 0) return `${who} · expires today`
    if (days === 1) return `${who} · 1 day left`
    return `${who} · ${days} days left`
}

const DeletedAccountsPage = () => {
    const { values, functions } = useDeletedAccountsController()

    const columns = [
        { label: "When", key: "createdAt", type: "date" },
        {
            label: "Member",
            cardFullWidth: true,
            render: (row) => {
                const name = [row.first_name, row.last_name].filter(Boolean).join(" ")
                return (
                    <div className="min-w-0">
                        <p>{name || "Unknown"}</p>
                        <p className="text-xs font-normal text-gray-500">{row.email}</p>
                    </div>
                )
            },
        },
        {
            label: "Membership",
            cardFullWidth: true,
            render: (row) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.had_active_membership
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                >
                    {membershipLabel(row)}
                </span>
            ),
        },
        {
            label: "Deleted by",
            render: (row) => (row.deleted_by === "admin" ? "Admin" : "Member"),
        },
        {
            label: "Email sent",
            render: (row) => (row.confirmation_email_sent ? "Yes" : "No"),
        },
    ]

    return (
        <AdminPageShell
            title="Deleted accounts"
            toolbar={
                <ListToolbar
                    search={values.search}
                    onSearch={functions.onSearch}
                    placeholder="Search name, email, or phone..."
                    extra={
                        <select
                            className={selectClass}
                            value={values.membership}
                            onChange={(e) => functions.setMembership(e.target.value)}
                            aria-label="Membership at deletion"
                        >
                            <option value="">All deleted accounts</option>
                            <option value="running">Running membership</option>
                            <option value="none">No running membership</option>
                        </select>
                    }
                />
            }
        >
            <p className="text-sm text-gray-600 -mt-2">
                Permanent record of members who deleted their account. A red badge
                means they still had a running membership, including how many days
                were left on the latest one. Follow up on those rows.
            </p>
            <Table
                serial_no
                columns={columns}
                data={values.data}
                loading={values.isLoading}
                pagination={values.pagination}
                onRowClick={functions.openRow}
            />
            {values.selected &&
                createPortal(
                    <DeletedDetail row={values.selected} onClose={functions.closeRow} />,
                    document.body,
                )}
        </AdminPageShell>
    )
}

const DeletedDetail = ({ row, onClose }) => {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ")
    const memberships = [
        ...(row.active_memberships || []).map((item) => ({ ...item, running: true })),
        ...(row.inactive_memberships || []).map((item) => ({ ...item, running: false })),
    ]
    return (
        <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Deleted account detail"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-lg font-semibold text-secondary">
                            {name || row.email}
                        </p>
                        <p className="text-sm text-gray-500">{membershipLabel(row)}</p>
                    </div>
                    <button
                        type="button"
                        className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                    <Detail label="Email" value={row.email} />
                    <Detail label="Phone" value={row.phone} />
                    <Detail label="Mailing address" value={row.mailing_address} />
                    <Detail label="Deleted" value={dateFormatter(row.createdAt)} />
                    <Detail
                        label="Deleted by"
                        value={row.deleted_by === "admin" ? "Admin" : "The member"}
                    />
                    <Detail
                        label="Confirmation email"
                        value={row.confirmation_email_sent ? "Sent" : "Not sent"}
                    />
                    <Detail
                        label="Membership cancelled"
                        value={
                            row.had_active_membership
                                ? row.membership_cancelled
                                    ? "Yes"
                                    : "Cancellation was requested"
                                : "No running membership"
                        }
                    />
                    {row.latest_membership_expires_at && (
                        <Detail
                            label="Latest membership end"
                            value={dateFormatter(row.latest_membership_expires_at)}
                        />
                    )}
                </dl>
                {memberships.length > 0 && (
                    <section className="mt-5">
                        <h3 className="text-sm font-semibold text-secondary">Memberships</h3>
                        <ul className="mt-2 grid gap-2">
                            {memberships.map((item, index) => (
                                <li
                                    key={item.id || index}
                                    className="rounded-lg bg-gray-50 px-3 py-2 text-sm"
                                >
                                    <p className="font-medium text-gray-900">
                                        {item.name || "Membership"}
                                        {item.running ? " · running" : " · ended"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {[
                                            item.vessel_registration,
                                            item.status,
                                            item.current_period_end
                                                ? `ends ${dateFormatter(item.current_period_end)}`
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                {(row.vessels || []).length > 0 && (
                    <section className="mt-5">
                        <h3 className="text-sm font-semibold text-secondary">Vessels</h3>
                        <ul className="mt-2 grid gap-2">
                            {row.vessels.map((vessel, index) => (
                                <li
                                    key={vessel._id || index}
                                    className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800"
                                >
                                    {[vessel.year, vessel.make, vessel.boat_model]
                                        .filter(Boolean)
                                        .join(" ") || "Vessel"}
                                    {vessel.registration ? ` · ${vessel.registration}` : ""}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                {(row.stripe_cancel_errors || []).length > 0 && (
                    <section className="mt-5">
                        <h3 className="text-sm font-semibold text-red-700">
                            Stripe cancellation notes
                        </h3>
                        <ul className="mt-2 grid gap-1 text-sm text-red-700">
                            {row.stripe_cancel_errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </div>
    )
}

const Detail = ({ label, value }) => {
    if (value == null || value === "") return null
    return (
        <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</dt>
            <dd className="mt-0.5 break-words text-gray-900">{String(value)}</dd>
        </div>
    )
}

const DeletedAccounts = () => {
    if (!isSuperAdminUser()) {
        return <Navigate to="/users" replace />
    }
    return <DeletedAccountsPage />
}

export default DeletedAccounts
