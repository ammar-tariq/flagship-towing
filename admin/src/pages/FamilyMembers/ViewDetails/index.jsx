import { Link, useParams } from "react-router-dom";
import Button from "../../../components/Button";
import LabelValue from "../../../components/LabelValue";
import DetailsPage from "../../../components/Wrappers/DetailsPage";
import { formatPhonePlusOne } from "../../../utils/helper";
import { memberDisplayName } from "../../../utils/memberDisplayName";
import useViewFamilyMemberDetailsController from "./useViewFamilyMemberDetailsController";

const detailTitle = (status) => {
  if (status === "approved") return "Authorized User";
  if (status === "rejected") return "Authorized User Request";
  return "New Authorized User Request";
};

const statusCaption = (status) => {
  if (status === "approved") return "This authorized user was approved and is active on the account.";
  if (status === "rejected") return "This request was rejected.";
  return "Review and approve or reject this request.";
};

const ViewFamilyMembersDetails = () => {
  const { values, functions } = useViewFamilyMemberDetailsController();
  const { id: memberUserId } = useParams();
  const data = values?.data;
  const status = data?.status;
  const accountOwnerId = data?.user?._id ?? data?.user ?? memberUserId;
  const accountOwnerName = memberDisplayName(data?.user);

  return (
    <DetailsPage title={detailTitle(status)} loading={values.isLoading}>
      <div className="grid gap-3">
        <p className="text-sm text-gray-600 -mt-2 mb-2">{statusCaption(status)}</p>
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-500 tracking-wide">Member Account</p>
          <p className="mt-0.5 text-base font-semibold text-gray-900">
            {accountOwnerId ? (
              <Link
                to={`/users/${accountOwnerId}`}
                className="text-primary hover:underline"
              >
                {accountOwnerName}
              </Link>
            ) : (
              accountOwnerName
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <p className="font-semibold text-lg sm:text-xl">
            Status:{" "}
            <span
              className={`${data?.status === "approved" ? "text-green-500" : data?.status === "rejected" ? "text-red-500" : "text-primary"} capitalize`}
            >
              {data?.status}
            </span>
          </p>
          {data?.status === "pending" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button text="Approve" rounded size="lg" onClick={() => functions.updateStatus("approved")} />
              <Button text="Reject" type="danger" rounded size="lg" onClick={() => functions.updateStatus("rejected")} />
            </div>
          )}
        </div>
        <LabelValue label="First Name" value={data?.first_name} />
        <LabelValue label="Last Name" value={data?.last_name} />
        <LabelValue label="Phone" value={formatPhonePlusOne(data?.phone) || "—"} />
        <LabelValue label="Email" value={data?.email} />
        <LabelValue label="Relationship" value={data?.relation} />
      </div>
    </DetailsPage>
  );
};

export default ViewFamilyMembersDetails;
