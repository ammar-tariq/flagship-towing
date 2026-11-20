import { Search, X } from "lucide-react";

const SearchBox = ({ value = "", onChange, placeholder = "Search here..." }) => {
    return (
        <div className="w-full">
            <div className="relative px-4 border border-black rounded-full py-2.5 flex items-center">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-700 text-sm"
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="ml-2 text-red-500 hover:text-gray-700 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                )}
                <Search className="text-secondary ml-2" size={18} />
            </div>
        </div>
    );
};

export default SearchBox;
