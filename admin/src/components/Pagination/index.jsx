import { memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const Pagination = ({
    total = 0,
    per_page = 10,
    current_page = 1,
    onPageChange
}) => {

    const total_pages = Math.max(1, Math.ceil(total / per_page))

    const getPageNumbers = () => {
        if (total_pages <= 7) return Array.from({ length: total_pages }, (_, i) => i + 1)
        if (current_page <= 4) return [1, 2, 3, 4, 5, "...", total_pages]
        if (current_page >= total_pages - 3)
            return [1, "...", total_pages - 4, total_pages - 3, total_pages - 2, total_pages - 1, total_pages]
        return [1, "...", current_page - 1, current_page, current_page + 1, "...", total_pages]
    }

    useEffect(() => {
        const handleKeyDown = e => {
            if (e.key === "ArrowLeft" && current_page > 1) onPageChange(current_page - 1)
            if (e.key === "ArrowRight" && current_page < total_pages) onPageChange(current_page + 1)
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [current_page, total_pages, onPageChange])

    return (
        <div className="flex justify-center md:justify-end mt-10">
            <div className="flex items-center flex-wrap gap-2">
                <button
                    aria-label="Previous Page"
                    onClick={() => onPageChange(current_page - 1)}
                    disabled={current_page === 1}
                    className={`w-9 h-9 rounded-xl shadow-md transition-all duration-200 ${current_page === 1
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-white/80 dark:bg-white/10 backdrop-blur hover:scale-105 text-primary border border-gray-200 dark:border-gray-600 cursor-pointer"
                        }`}
                >
                    ←
                </button>

                <AnimatePresence mode="wait">
                    {getPageNumbers().map((page, index) =>
                        page === "..." ? (
                            <motion.span
                                key={`ellipsis-${index}`}
                                className="w-9 h-9 flex items-center justify-center text-gray-400"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                ...
                            </motion.span>
                        ) : (
                            <motion.button
                                key={`page-${page}`}
                                aria-label={`Go to page ${page}`}
                                onClick={() => onPageChange(page)}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: current_page === page ? 1.1 : 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${current_page === page
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-white/80 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary border border-gray-300 dark:border-gray-700"
                                    }`}
                            >
                                {page}
                            </motion.button>
                        )
                    )}
                </AnimatePresence>

                <button
                    aria-label="Next Page"
                    onClick={() => onPageChange(current_page + 1)}
                    disabled={current_page === total_pages}
                    className={`w-9 h-9 rounded-xl shadow-md transition-all duration-200 ${current_page === total_pages
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-white/80 dark:bg-white/10 backdrop-blur hover:scale-105 text-primary border border-gray-200 dark:border-gray-600 cursor-pointer"
                        }`}
                >
                    →
                </button>
            </div>
        </div>
    )
}

export default memo(Pagination)