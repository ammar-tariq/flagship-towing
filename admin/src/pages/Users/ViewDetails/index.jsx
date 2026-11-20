import Avatar from "../../../components/Avatar";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Tabs from "../../../components/Tabs";
import DetailsPage from "../../../components/Wrappers/DetailsPage";
import PartnerAssignment from "../../../components/PartnerAssignment";
import { formatPhonePlusOne } from "../../../utils/helper";
import useViewUserDetailsController from "./useViewUserDetailsController";

const ViewUserDetails = () => {
  const { values, functions } = useViewUserDetailsController();

  const activeTab = values.tabs.find((item) => item.value === values.selected);
  const user = values?.data;
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  return (
    <DetailsPage title="User Profile" loading={values.isLoading}>
      <div className="bg-gray-50 py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 grid gap-4 sm:gap-6 lg:gap-10 rounded-md min-w-0">
        {/* Profile header */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 lg:border-0 lg:bg-transparent lg:p-0 shadow-sm lg:shadow-none min-w-0">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 lg:gap-4">
            <div className="flex gap-3 sm:gap-4 lg:gap-8 items-start min-w-0">
              <Avatar
                className="h-14 w-14 sm:h-20 sm:w-20 lg:h-[120px] lg:w-[120px] text-sm sm:text-base"
                name={fullName}
              />
              <div className="flex-1 min-w-0 pt-0.5">
                <h2 className="text-base sm:text-lg font-semibold text-secondary truncate">
                  {fullName || "—"}
                </h2>
                {user?.email ? (
                  <p className="text-xs sm:text-sm text-gray-600 truncate mt-0.5">
                    {user.email}
                  </p>
                ) : null}
                {user?.phone ? (
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                    {formatPhonePlusOne(user.phone)}
                  </p>
                ) : null}
                {(user?.mailing_address || "").trim() ? (
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                    {user.mailing_address}
                  </p>
                ) : null}
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">Partner</p>
                  <PartnerAssignment
                    user={user}
                    busy={values.partnerBusy}
                    onAssign={functions.onAssignPartner}
                    onUnassign={functions.onUnassignPartner}
                  />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 mt-1.5">
                  Status:{" "}
                  <span
                    className={`${user?.active ? "text-green-500" : "text-red-500"} font-semibold`}
                  >
                    {user?.active ? "Active" : "Inactive"}
                  </span>
                </p>

                {/* Desktop actions beside avatar */}
                <div className="hidden lg:flex flex-row flex-wrap gap-2 mt-4">
                  <Button rounded outlined text="Edit Profile" onClick={functions.onEditProfile} />
                  <div className="relative">
                    <Button
                      rounded
                      outlined
                      text="New Authorized User Request"
                      onClick={functions.onViewFamilyMemberRequests}
                    />
                    {values?.family_count > 0 ? (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
                        {values.family_count}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile / tablet actions */}
          <div className="grid grid-cols-2 gap-2 mt-3 lg:hidden">
            <Button
              rounded
              outlined
              text="Edit Profile"
              mobileText="Edit"
              onClick={functions.onEditProfile}
              size="lg"
            />
            <div className="relative min-w-0">
              <Button
                rounded
                outlined
                text="New Authorized User Request"
                mobileText="Auth Requests"
                onClick={functions.onViewFamilyMemberRequests}
                size="lg"
              />
              {values?.family_count > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                  {values.family_count}
                </span>
              ) : null}
            </div>
            <div className="col-span-2">
              <Button
                rounded
                text="Add Service"
                onClick={functions.onAddService}
                size="lg"
              />
            </div>
          </div>

          {/* Desktop add service */}
          <div className="hidden lg:flex justify-end mt-4">
            <Button rounded text="Add Service" onClick={functions.onAddService} />
          </div>
        </div>

        <Tabs tabs={values.tabs} active={values.selected} setActive={functions.setSelected} />

        <p className="font-semibold text-base sm:text-xl lg:text-2xl text-secondary px-0.5">
          {activeTab?.label}
        </p>

        <div className="min-w-0 -mx-1 sm:mx-0">
          <Table
            data={values.table_data}
            columns={values.columns}
            loading={values.table_loading}
            onRowClick={
              values.selected === "authorized_users"
                ? functions.onAuthorizedUserRowClick
                : undefined
            }
          />
        </div>
      </div>
    </DetailsPage>
  );
};

export default ViewUserDetails;
