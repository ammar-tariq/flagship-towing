import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Expand, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

const ImagePreview = ({ src, alt = "Preview", className = "w-full max-h-60 object-cover" }) => {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!open) return

        const onKeyDown = (event) => {
            if (event.key === "Escape") setOpen(false)
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        document.addEventListener("keydown", onKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [open])

    if (!src) return null

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="relative group block w-full overflow-hidden rounded-2xl border border-gray-200 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`View ${alt} full screen`}
            >
                <img
                    src={src}
                    alt={alt}
                    className={`${className} block transition-transform duration-500 ease-out group-hover:scale-105`}
                />
                <span
                    className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
                    aria-hidden="true"
                >
                    <span className="flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-white/95 text-secondary opacity-0 shadow-lg transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100">
                        <Expand className="h-5 w-5" />
                    </span>
                </span>
                <span
                    className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white [@media(hover:hover)]:hidden"
                    aria-hidden="true"
                >
                    <Expand className="h-4 w-4" />
                </span>
            </button>

            {createPortal(
                <AnimatePresence>
                    {open ? (
                        <motion.div
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setOpen(false)}
                            role="dialog"
                            aria-modal="true"
                            aria-label={alt}
                        >
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="absolute right-4 top-4 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                                aria-label="Close full screen image"
                            >
                                <X className="h-6 w-6" />
                            </button>
                            <motion.img
                                src={src}
                                alt={alt}
                                className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
                                initial={{ scale: 0.94, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.94, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={(event) => event.stopPropagation()}
                            />
                        </motion.div>
                    ) : null}
                </AnimatePresence>,
                document.body
            )}
        </>
    )
}

export default ImagePreview
