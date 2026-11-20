import DetailsPage from "../../../components/Wrappers/DetailsPage";
import { dateFormatter } from "../../../utils/helper";
import useViewFeedbacksDetailsController from "./useViewFeedbacksDetailsController";
import LabelValue from "../../../components/LabelValue";

const ViewFeedbacksDetails = () => {

  const { values, functions } = useViewFeedbacksDetailsController()

  return (
    <DetailsPage
      title={
        values.inquiryDisplayId != null
          ? `User Inquiry — ID# ${values.inquiryDisplayId}`
          : "User Inquiry"
      }
      loading={values.isLoading}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm">
          <span className="text-gray-500">Status: </span>
          <span className={values?.data?.status === "resolved" ? "font-medium text-green-700" : "font-medium text-amber-700"}>
            {values?.data?.status === "resolved" ? "Resolved" : "Pending"}
          </span>
        </p>
        {values.canResolve && (
          <button
            type="button"
            onClick={functions.markResolved}
            disabled={values.isResolving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {values.isResolving ? "Saving…" : "Mark as resolved"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-b pb-4 mb-4 border-b-gray-200">
        <LabelValue
          label={"Inquiry ID#"}
          value={values.inquiryDisplayId != null ? String(values.inquiryDisplayId) : "—"}
        />
        <LabelValue label={"Name"} value={values?.data?.name} />
        <LabelValue label={"Email"} value={values?.data?.email} />
        <LabelValue label={"Submitted On"} value={dateFormatter(values?.data?.createdAt)} />
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Subject</h2>
        <p className="text-gray-800">{values?.data?.subject}</p>
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Message</h2>
        <p className="text-gray-800">{values?.data?.message}</p>
      </div>
    </DetailsPage>
  )

}

export default ViewFeedbacksDetails;
