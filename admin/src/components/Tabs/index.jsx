
const tabLabel = (tab, compact) => {
  if (compact && tab.shortLabel) return tab.shortLabel;
  return tab.label;
};

const tabButtonClass = (active, tab, compact) =>
  [
    "text-center font-medium transition-colors duration-150 min-h-[44px]",
    compact
      ? "px-2 py-2.5 text-xs rounded-xl border-2"
      : "shrink-0 flex-1 px-3 sm:px-4 py-3 text-xs sm:text-sm md:text-base rounded-full whitespace-nowrap",
    active === tab.value
      ? compact
        ? "bg-primary text-white border-primary"
        : "bg-primary text-white"
      : compact
        ? "text-secondary border-gray-200 bg-white hover:bg-primary/5"
        : "text-secondary hover:cursor-pointer hover:bg-primary/5",
  ].join(" ");

const Tabs = ({ tabs = [], active, setActive }) => {
  return (
    <div className="w-full">
      {/* Mobile: 2-column grid for easier tapping */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {tabs.map((tab, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(tab.value)}
            className={tabButtonClass(active, tab, true)}
          >
            {tabLabel(tab, true)}
          </button>
        ))}
      </div>

      {/* Tablet / desktop: pill bar */}
      <div className="hidden md:flex justify-between border-2 border-primary rounded-full overflow-hidden">
        {tabs.map((tab, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(tab.value)}
            className={tabButtonClass(active, tab, false)}
          >
            {tabLabel(tab, false)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
