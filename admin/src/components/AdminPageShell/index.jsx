const AdminPageShell = ({ title, titleAction, toolbar, children, contentClassName = "" }) => {
  return (
    <div className="grid gap-4 lg:gap-7">
      {(title || titleAction) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <h2 className="text-xl sm:text-2xl font-semibold text-secondary">{title}</h2>
          ) : (
            <span />
          )}
          {titleAction}
        </div>
      )}
      <div
        className={`p-4 sm:p-6 lg:p-12 bg-gray-50 grid gap-4 lg:gap-7 rounded-xl ${contentClassName}`}
      >
        {toolbar}
        {children}
      </div>
    </div>
  );
};

export default AdminPageShell;
