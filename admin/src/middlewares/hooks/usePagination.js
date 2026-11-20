import { useState } from 'react';

const usePagination = ({ default_page = 1, default_per_page = 10 }) => {

    const [page, setPage] = useState(default_page);
    const [perPage, setPerPage] = useState(default_per_page);

    const getPaginationParams = () => {
        return {
            page: page,
            rowsPerPage: perPage,
        };
    };

    const resetPagination = () => {
        setPage(default_page);
        setPerPage(default_per_page);
    };

    return {
        page,
        per_page: perPage,
        setPage,
        setPerPage,
        getPaginationParams,
        resetPagination,
    }
}

export default usePagination
