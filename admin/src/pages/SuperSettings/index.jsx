import { Navigate } from "react-router-dom"
import DetailsPage from "../../components/Wrappers/DetailsPage"
import {
    useGetAppSettingsQuery,
    usePatchAppSettingsMutation,
} from "../../redux/Apis/General"
import { isSuperAdminUser } from "../../utils/auth"

const SuperSettings = () => {
    if (!isSuperAdminUser()) {
        return <Navigate to="/users" replace />
    }

    const { data: res, isLoading } = useGetAppSettingsQuery()
    const [patchAppSettings, { isLoading: saving }] = usePatchAppSettingsMutation()

    const stripeDev = Boolean(res?.data?.stripe_dev)

    const onStripeDevChange = async (e) => {
        try {
            await patchAppSettings({ stripe_dev: e.target.checked }).unwrap()
        } catch {
            /* middleware may surface error */
        }
    }

    return (
        <DetailsPage title="Super settings" loading={isLoading}>
            <div className="max-w-xl space-y-6">
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold text-secondary">Stripe dev</p>
                            <p className="mt-1 text-sm text-gray-600">
                                When enabled, the API uses{" "}
                                <code className="rounded bg-gray-200 px-1 text-xs">
                                    STRIPE_SECRET_KEY_DEV
                                </code>{" "}
                                (falls back to the main key if unset). Webhooks use{" "}
                                <code className="rounded bg-gray-200 px-1 text-xs">
                                    STRIPE_WEBHOOK_SECRET_DEV
                                </code>{" "}
                                when set.
                            </p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-3 shrink-0">
                            <span className="text-sm text-gray-700">
                                {stripeDev ? "On" : "Off"}
                            </span>
                            <input
                                type="checkbox"
                                className="h-5 w-10 cursor-pointer rounded-full border-gray-300 accent-primary"
                                checked={stripeDev}
                                disabled={saving}
                                onChange={onStripeDevChange}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </DetailsPage>
    )
}

export default SuperSettings
