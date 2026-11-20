import { useEffect } from "react";
import usePagination from "./usePagination";
import useDebouncedSearch from "./useDebouncedSearch";

const useFilters = ({
    default_page = 1,
    default_per_page = 10,
    search_delay = 500,
    initial_search = ""
} = {}) => {

    const {
        page,
        per_page,
        setPage,
        setPerPage,
        getPaginationParams,
        resetPagination
    } = usePagination({ default_page, default_per_page });

    const [search, debouncedSearch, setSearch] = useDebouncedSearch(initial_search, search_delay);

    useEffect(() => {
        setPage(default_page);
    }, [debouncedSearch, setPage]);

    return {
        search,
        debouncedSearch,
        setSearch,
        page,
        per_page,
        setPage,
        setPerPage,
        getPaginationParams,
        resetPagination,
    };
};

export default useFilters