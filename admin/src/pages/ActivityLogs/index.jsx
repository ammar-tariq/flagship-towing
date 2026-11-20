import { Navigate } from "react-router-dom"
import { createPortal } from "react-dom"
import AdminPageShell from "../../components/AdminPageShell"
import ListToolbar from "../../components/ListToolbar"
import Table from "../../components/Table"
import { isSuperAdminUser } from "../../utils/auth"
import { dateFormatter } from "../../utils/helper"
import useActivityLogsController from "./useActivityLogsController"

const selectClass =
    "h-11 rounded-full border border-black bg-white px-4 text-sm text-gray-800 outline-none"

const ActivityLogsPage = () => {
    const { values, functions } = useActivityLogsController()

    const columns = [
        { label: "When", key: "createdAt", type: "date" },
        {
            label: "Action",
            render: (row) => row.action_label || row.action,
        },
        {
            label: "Result",
            render: (row) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.outcome === "failure"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-800"
                    }`}
                >
                    {row.outcome === "failure" ? "Failed" : "Success"}
                </span>
            ),
        },
        {
            label: "User",
            cardFullWidth: true,
            render: (row) => {
                const actor = row.actor_name || row.actor_email || "Unknown"
                const showEmail = row.actor_email && row.actor_name
                const targetDiffers =
                    row.target_email && row.target_email !== row.actor_email
                return (
                    <div className="min-w-0">
                        <p>{actor}</p>
                        {showEmail && (
                            <p className="text-xs font-normal text-gray-500">{row.actor_email}</p>
                        )}
                        {targetDiffers && (
                            <p className="text-xs font-normal text-gray-500">
                                on {row.target_name || row.target_email}
                            </p>
                        )}
                    </div>
                )
            },
        },
        {
            label: "What happened",
            cardFullWidth: true,
            render: (row) => row.message || "—",
        },
        {
            label: "IP",
            render: (row) => row.ip || "—",
        },
    ]

    return (
        <AdminPageShell
            title="Activity logs"
            toolbar={
                <ListToolbar
                    search={values.search}
                    onSearch={functions.onSearch}
                    placeholder="Search name, email, action, or IP..."
                    extra={
                        <div className="flex flex-col sm:flex-row gap-2">
                            <select
                                className={selectClass}
                                value={values.category}
                                onChange={(e) => functions.setCategory(e.target.value)}
                                aria-label="Activity category"
                            >
                                <option value="">All activity</option>
                                {values.categories.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                className={selectClass}
                                value={values.outcome}
                                onChange={(e) => functions.setOutcome(e.target.value)}
                                aria-label="Result"
                            >
                                <option value="">Any result</option>
                                <option value="success">Success</option>
                                <option value="failure">Failed</option>
                            </select>
                        </div>
                    }
                />
            }
        >
            <p className="text-sm text-gray-600 -mt-2">
                Login, logout, profile changes, purchases, and account deletion.
                Entries stay in the database for {values.retentionDays} days. Deleted
                accounts are also kept permanently on the Deleted accounts page. The server
                also writes{" "}
                <code className="rounded bg-gray-200 px-1 text-xs">
                    logs/activity/activity-YYYY-MM-DD.jsonl
                </code>{" "}
                and keeps those files for {values.fileRetentionDays} days.
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
                    <LogDetail row={values.selected} onClose={functions.closeRow} />,
                    document.body,
                )}
        </AdminPageShell>
    )
}

const LogDetail = ({ row, onClose }) => {
    const metadata = row.metadata && Object.keys(row.metadata).length ? row.metadata : null
    return (
        <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Activity detail"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-lg font-semibold text-secondary">
                            {row.action_label || row.action}
                        </p>
                        <p className="text-sm text-gray-500">{row.action}</p>
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
                    <Detail label="Result" value={row.outcome === "failure" ? "Failed" : "Success"} />
                    <Detail label="When" value={dateFormatter(row.createdAt)} />
                    <Detail label="Message" value={row.message} />
                    <Detail label="User" value={[row.actor_name, row.actor_email].filter(Boolean).join(" · ")} />
                    <Detail label="Role" value={row.actor_role} />
                    <Detail
                        label="Affected account"
                        value={
                            row.target_email || row.target_name
                                ? [row.target_name, row.target_email].filter(Boolean).join(" · ")
                                : null
                        }
                    />
                    <Detail label="IP" value={row.ip} />
                    <Detail label="Device" value={row.user_agent} />
                </dl>
                {metadata && (
                    <pre className="mt-4 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800">
                        {JSON.stringify(metadata, null, 2)}
                    </pre>
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

const ActivityLogs = () => {
    if (!isSuperAdminUser()) {
        return <Navigate to="/users" replace />
    }
    return <ActivityLogsPage />
}

export default ActivityLogs
