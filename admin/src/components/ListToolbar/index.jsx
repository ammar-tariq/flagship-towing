import SearchBox from "../SearchBox";

const ListToolbar = ({ search, onSearch, placeholder, action, extra }) => {
  return (
    <div className="grid gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {onSearch != null && (
          <div className="w-full flex-1 min-w-0 lg:max-w-4xl">
            <SearchBox value={search} onChange={onSearch} placeholder={placeholder} />
          </div>
        )}
        {action && <div className="w-full sm:w-auto shrink-0">{action}</div>}
      </div>
      {extra}
    </div>
  );
};

export default ListToolbar;
