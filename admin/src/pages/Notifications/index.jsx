import { dateFormatter } from "../../utils/helper";
import AdminPageShell from "../../components/AdminPageShell";
import Loader from "../../components/Loader";
import useNotificationsController from "./useNotificationsController";

function NotificationCard({ data, onClick, className = "" }) {
  const unread = !data?.isRead;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(data)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(data);
        }
      }}
      className={`${className} w-full text-left rounded-xl border transition-colors cursor-pointer pointer-events-auto relative z-[1] touch-manipulation select-none
            ${unread ? "bg-primary/5 border-primary/30 hover:bg-primary/10" : "bg-gray-50 border-transparent hover:bg-gray-100"}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {unread && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                )}
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {data?.notification?.title}
                </h4>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                {dateFormatter(data?.createdAt)}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-700 leading-6 break-words">
              {data?.notification?.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const Notifications = () => {
  const { values, functions } = useNotificationsController();
  const hasUnread = values?.data?.some((n) => !n?.isRead);

  return (
    <AdminPageShell
      title="Notifications"
      titleAction={
        hasUnread ? (
          <button
            type="button"
            onClick={functions.onMarkAllRead}
            disabled={values.isMarkingAll}
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50 min-h-[44px] px-2"
          >
            {values.isMarkingAll ? "Marking…" : "Mark all as read"}
          </button>
        ) : null
      }
      contentClassName="!p-0 !bg-transparent"
    >
      <div className="grid gap-2">
        {values?.isLoading ? (
          <Loader center size={48} />
        ) : values?.data?.length <= 0 ? (
          <p className="text-center text-secondary font-medium mt-4 py-8">No Notifications Found</p>
        ) : (
          values?.data?.map((item, index) => (
            <NotificationCard
              key={item?._id ?? item?.id ?? `n-${index}`}
              data={item}
              onClick={functions.onNotificationClick}
            />
          ))
        )}
      </div>
    </AdminPageShell>
  );
};

export default Notifications;
