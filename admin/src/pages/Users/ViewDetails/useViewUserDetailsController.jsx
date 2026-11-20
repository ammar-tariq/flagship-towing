import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Badge from "../../../components/Badge"
import TableActions from "../../../components/TableActions"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import { useGetFamilyCountQuery, useGetFamilyMembersQuery } from "../../../redux/Apis/FamilyMembers"
import { useCreateIncidentMutation, useDeleteIncidentMutation, useGetIncidentsQuery, useUpdateIncidentMutation } from "../../../redux/Apis/Incidents"
import { useGetPaymentLogsQuery } from "../../../redux/Apis/Package"
import { useGetUserByIdQuery, useHandleStatusMutation } from "../../../redux/Apis/User"
import { useDeleteVesselMutation, useGetVesselsQuery } from "../../../redux/Apis/Vessel"
import { dateFormatter, formatCurrency, formatMembershipSourceLabel, formatPhonePlusOne } from "../../../utils/helper"
import usePartnerActions from "../usePartnerActions"
import AddService from "../AddService"
import EditIncidentLog from "../EditIncidentLog"

const TABS = [
    {
        label: "Incident Logs",
        shortLabel: "Incidents",
        value: "incident_logs"
    },
    {
        label: "Membership Logs",
        shortLabel: "Membership",
        value: "membership_logs"
    },
    {
        label: "Authorized Users",
        shortLabel: "Auth Users",
        value: "authorized_users"
    },
    {
        label: "Vessels",
        shortLabel: "Vessels",
        value: "vessels"
    }
]

const useViewUserDetailsController = () => {

    const { id } = useParams()
    const { confirm, acknowledge } = useSwal()
    const { open } = useModal()
    const navigate = useNavigate()
    const addServiceModalKey = useRef(0)
    const editIncidentModalKey = useRef(0)

    const [selected, setSelected] = useState(TABS[0].value)

    const { data, isLoading, refetch } = useGetUserByIdQuery(id)
    const { data: family_count } = useGetFamilyCountQuery({ id, params: { status: "pending" } })
    const { data: authorised_users, isLoading: authorized_users_loading } = useGetFamilyMembersQuery({ user: id, status: "approved" })
    const { data: incident_logs, isLoading: incident_logs_loading, refetch: incidentLogsRefetch } = useGetIncidentsQuery({ user: id })
    const { data: vessels, isLoading: vessels_loading } = useGetVesselsQuery({ user: id })
    const { data: payment_logs_res, isLoading: membership_logs_loading } = useGetPaymentLogsQuery(
        { user: id },
        { skip: !id }
    )
    const [update, { data: updateData, isSuccess: isUpdateSuccess }] = useHandleStatusMutation()
    const { assignToUser, unassignFromUser, busyId } = usePartnerActions()
    const [submit, { isSuccess: isCreateIncidentSuccess }] = useCreateIncidentMutation()
    const [deleteIncident] = useDeleteIncidentMutation()
    const [updateIncidentMutation] = useUpdateIncidentMutation()
    const [deleteVessel] = useDeleteVesselMutation()

    useEffect(() => {
        if (isCreateIncidentSuccess) {
            incidentLogsRefetch()
            acknowledge({
                title: "Success",
                text: `Service added successfully`
            })
        }
    }, [isCreateIncidentSuccess])

    useEffect(() => {
        if (isUpdateSuccess) {
            if (data?.data?.status === updateData?.data?.status) {
                acknowledge({
                    title: `Marked as ${updateData?.data?.active ? "Active" : "Inactive"}`,
                    text: `User ${updateData?.data?.active ? "activated" : "inactivated"} successfully!`
                })
            } else {
                acknowledge({ title: "Success", text: `User has been ${updateData?.data?.status} successfully!` })
            }
            refetch()
        }
    }, [isUpdateSuccess, updateData])

    const toggleStatus = async () => {

        let confirmed = await confirm({
            title: `${data?.data?.active ? "Inactivate" : "Activate"} User`,
            text: `Are you sure you want to ${data?.data?.active ? "inactivate" : "activate"} "${data?.data?.first_name} ${data?.data?.last_name}" user?`
        })

        if (confirmed) {
            update({ id, payload: { active: !data?.data?.active } })
        }

    }

    const onViewFamilyMemberRequests = () => {
        navigate(`/users/${id}/family-member-requests`)
    }

    const onAuthorizedUserRowClick = (row) => {
        const requestId = row?._id ?? row?.id
        if (requestId) {
            navigate(`/users/${id}/family-member-requests/${requestId}`)
        }
    }

    const onAddService = () => {
        addServiceModalKey.current += 1
        open(
            "Add Service",
            <AddService
                key={`add-service-${id}-${addServiceModalKey.current}`}
                user={id}
                onSubmitAddService={submit}
            />
        )
    }

    const handleEditIncident = (row) => {
        const incidentId = row?._id ?? row?.id
        if (!incidentId) return
        editIncidentModalKey.current += 1
        open(
            "Edit service log",
            <EditIncidentLog
                key={`edit-incident-${incidentId}-${editIncidentModalKey.current}`}
                incident={row}
                onSubmitUpdate={async (body) => {
                    await updateIncidentMutation({ id: incidentId, body }).unwrap()
                    incidentLogsRefetch()
                }}
            />
        )
    }

    const handleDeleteIncident = async (incidentId) => {
        const confirmed = await confirm({
            title: "Delete service log",
            text: "Are you sure you want to delete this service log?"
        })
        if (!confirmed) return
        try {
            await deleteIncident(incidentId).unwrap()
            incidentLogsRefetch()
            acknowledge({
                title: "Success",
                text: "Service log deleted successfully"
            })
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || "Unable to delete service log"
            })
        }
    }

    const AUTHORIZED_USER_COLUMNS = [
        {
            label: 'Registration Date',
            type: "dateonly",
            key: 'createdAt'
        },
        {
            label: 'First Name',
            key: "first_name"
        },
        {
            label: 'Last Name',
            key: "last_name"
        },
        {
            label: 'Email',
            key: "email"
        },
        {
            label: 'Phone',
            key: "phone",
            render: (row) => formatPhonePlusOne(row?.phone)
        },
        {
            label: 'Relationship',
            key: "relation"
        },
    ]

    const INCIDENT_LOGS_COLUMNS = [
        {
            label: 'Service ID',
            key: "service_id"
        },
        {
            label: 'Service',
            key: "service.title",
            cardFullWidth: true,
        },
        {
            label: 'Date',
            type: "dateonly",
            key: 'date',
            render: (row) => {
                const raw = row?.date || row?.createdAt || row?.created_at
                return <span>{dateFormatter(raw, { time: false }) || "—"}</span>
            }
        },
        {
            label: 'Action',
            key: "actions",
            render: (row) => (
                <TableActions
                    editIcon
                    onEdit={() => handleEditIncident(row)}
                    onDelete={() => handleDeleteIncident(row?._id ?? row?.id)}
                />
            )
        }
    ]

    const MEMBERSHIP_COLUMNS = [
        {
            label: 'Plan',
            cardFullWidth: true,
            render: (row) => <span>{row?.name || "—"}</span>
        },
        {
            label: 'Source',
            render: (row) => <span>{formatMembershipSourceLabel(row?.source)}</span>
        },
        {
            label: 'Vessel',
            cardFullWidth: true,
            render: (row) => {
                const v = row?.vessel
                if (!v) return <span>—</span>
                const parts = [v.registration, v.make].filter(Boolean)
                return <span>{parts.length ? parts.join(" · ") : "—"}</span>
            }
        },
        {
            label: 'Amount',
            render: (row) => {
                const n = Number(row?.amount)
                if (!Number.isFinite(n) || n <= 0) return <span>—</span>
                return <span>{formatCurrency(n)}</span>
            }
        },
        {
            label: 'Status',
            render: (row) => {
                const s = String(row?.status || "").toLowerCase()
                const ok = s === "active"
                return <Badge type={ok ? "success" : "danger"} text={ok ? "Active" : (row?.status || "Inactive")} />
            }
        },
        {
            label: 'Period start',
            render: (row) => {
                const d = row?.current_period_start || row?.created_at
                return <span>{dateFormatter(d, { time: false }) || "—"}</span>
            }
        },
        {
            label: 'Period end',
            render: (row) => {
                const d = row?.current_period_end
                return <span>{dateFormatter(d, { time: false }) || "—"}</span>
            }
        }
    ]

    const membershipTableRows = (() => {
        const d = payment_logs_res?.data
        if (!d) return []
        if (Array.isArray(d)) return d
        const active = d.active_subscriptions || []
        const inactive = d.inactive_subscriptions || []
        const merged = [...active, ...inactive]
        merged.sort((a, b) => {
            const ta = new Date(a.created_at || a.current_period_end || 0).getTime()
            const tb = new Date(b.created_at || b.current_period_end || 0).getTime()
            return tb - ta
        })
        return merged
    })()

    const vesselMembershipById = (() => {
        const map = {}
        for (const row of membershipTableRows) {
            const vesselId = row?.vessel?._id || row?.vessel?.id
            if (!vesselId) continue
            const key = String(vesselId)
            const end = row?.current_period_end
            const start = row?.current_period_start || row?.created_at
            const endTs = end ? new Date(end).getTime() : NaN
            const status = String(row?.status || "").toLowerCase()
            const isActive = status === "active" || status === "trialing"
            const existing = map[key]
            const candidate = {
                start: start || null,
                end: end || null,
                endTs: Number.isNaN(endTs) ? 0 : endTs,
                isActive,
            }
            if (!existing) {
                map[key] = candidate
                continue
            }
            // Prefer an active membership; otherwise keep the latest period end.
            if (isActive && !existing.isActive) {
                map[key] = candidate
            } else if (isActive === existing.isActive && candidate.endTs > existing.endTs) {
                map[key] = candidate
            }
        }
        return map
    })()

    const formatVesselDate = (d) => {
        if (!d) return "—"
        return dateFormatter(d, { time: false }) || "—"
    }

    const resolveVesselMembershipStart = (row) => {
        if (row?.offline_membership_starts_at) return row.offline_membership_starts_at
        return vesselMembershipById[String(row?._id)]?.start || null
    }

    const resolveVesselMembershipEnd = (row) => {
        if (row?.offline_membership_expires_at) return row.offline_membership_expires_at
        return vesselMembershipById[String(row?._id)]?.end || null
    }

    const handleDeleteVessel = async (row) => {
        const label = row?.registration || row?.make || "this vessel"
        const confirmed = await confirm({
            title: "Delete vessel",
            text: `Remove ${label} from this account? This cannot be undone.`
        })
        if (!confirmed) return
        try {
            await deleteVessel(row?._id).unwrap()
            acknowledge({
                title: "Success",
                text: "Vessel deleted"
            })
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || "Unable to delete vessel"
            })
        }
    }

    const purchasedVessels = (vessels?.data || []).filter((row) => {
        if (row?.active === true) return true
        if (row?.offline_membership_expires_at || row?.offline_membership_starts_at) return true
        return Boolean(vesselMembershipById[String(row?._id)]?.isActive)
    })

    const VESSELS_COLUMNS = [
        {
            label: "Registration / ID#",
            key: "registration"
        },
        {
            label: "Manufacturer",
            render: (row) => <span>{row?.make || "—"}</span>
        },
        {
            label: "Primary boating location",
            key: "primary_boating_location",
            cardFullWidth: true,
            render: (row) => <span>{row?.primary_boating_location || "—"}</span>
        },
        {
            label: "Membership start",
            render: (row) => <span>{formatVesselDate(resolveVesselMembershipStart(row))}</span>
        },
        {
            label: "Membership end",
            render: (row) => <span>{formatVesselDate(resolveVesselMembershipEnd(row))}</span>
        },
        {
            label: "Action",
            key: "actions",
            render: (row) => (
                <TableActions
                    onView={() => navigate(`/users/${id}/vessel/${row?._id}`)}
                    onEdit={() => navigate(`/users/${id}/vessel/${row?._id}/edit`)}
                    onDelete={() => handleDeleteVessel(row)}
                />
            )
        }
    ]

    const columns = {
        incident_logs: INCIDENT_LOGS_COLUMNS,
        membership_logs: MEMBERSHIP_COLUMNS,
        authorized_users: AUTHORIZED_USER_COLUMNS,
        vessels: VESSELS_COLUMNS
    }[selected]

    const table_data = {
        incident_logs: incident_logs?.data || [],
        membership_logs: membershipTableRows,
        authorized_users: authorised_users?.data || [],
        vessels: purchasedVessels
    }[selected]

    return {
        values: {
            data: data?.data || [],
            isLoading,
            tabs: TABS,
            selected,
            table_data,
            columns,
            family_count: family_count?.data || 0,
            partnerBusy: busyId === id,
            table_loading: {
                incident_logs: incident_logs_loading,
                membership_logs: membership_logs_loading,
                authorized_users: authorized_users_loading,
                vessels: vessels_loading,
            }[selected]
        },
        functions: {
            toggleStatus,
            onViewFamilyMemberRequests,
            onAuthorizedUserRowClick,
            setSelected,
            onAddService,
            onEditProfile: () => navigate(`/users/${id}/edit`),
            onAssignPartner: () => assignToUser(data?.data, () => refetch()),
            onUnassignPartner: () => unassignFromUser(data?.data, () => refetch()),
        }
    }

}

export default useViewUserDetailsController