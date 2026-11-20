import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const slide_from_top = {
    hidden: {
        y: "-100vh",
        opacity: 0
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", damping: 25, stiffness: 300 },
    },
    exit: {
        y: "-100vh",
        opacity: 0,
        transition: { duration: 0.2 },
    },
};

const Modal = ({ open, title, children, footer, onClose }) => {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center px-4 overflow-y-auto"
                    variants={backdrop}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                <motion.div
                    variants={slide_from_top}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-white w-full max-w-4xl rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden my-auto sm:my-0"
                    style={{ minHeight: "200px", maxHeight: "min(92dvh, 900px)" }}
                >
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10 gap-3">
                        <h2 className="text-lg sm:text-xl font-semibold text-primary truncate">{title}</h2>
                        <button type="button" onClick={onClose} className="p-2 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Close">
                                <X className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
                            {children}
                        </div>
                        {
                            footer && (
                                <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-2 border-gray-200 sticky bottom-0">
                                    {footer}
                                </div>
                            )
                        }
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
