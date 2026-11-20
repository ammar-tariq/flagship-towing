import { useState } from "react"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import { useImportSheetUsersMutation } from "../../../redux/Apis/User"

const useImportSheetController = () => {
    const { close } = useModal()
    const { acknowledge } = useSwal()
    const [file, setFile] = useState(null)
    const [eligibleOnly, setEligibleOnly] = useState(true)
    const [skipExisting, setSkipExisting] = useState(true)
    const [dryRun, setDryRun] = useState(false)

    const [importSheet, { isLoading }] = useImportSheetUsersMutation()

    const onFileChange = (e) => {
        const f = e.target.files?.[0]
        setFile(f || null)
    }

    const handleSubmit = async () => {
        if (!file) {
            acknowledge({
                icon: "error",
                title: "No file",
                text: "Choose an .xlsx or .csv file exported from the membership sheet.",
            })
            return
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("eligibleOnly", String(eligibleOnly))
        formData.append("skipExisting", String(skipExisting))
        formData.append("dryRun", String(dryRun))

        try {
            const res = await importSheet(formData).unwrap()
            const d = res?.data
            const lines = [
                `Rows in file: ${d?.totalSourceRows ?? "—"}`,
                `Rows processed: ${d?.rowsConsidered ?? "—"}`,
                `Created / validated: ${d?.success ?? "—"}`,
                `Skipped (existing email): ${d?.skippedExisting ?? 0}`,
                `Errors: ${d?.errors ?? "—"}`,
            ]
            const errCount = Number(d?.errors) || 0
            acknowledge({
                title: res?.message || "Import complete",
                text: lines.join("\n"),
                icon: errCount > 0 ? "warning" : "success",
            })
            if (!dryRun && errCount === 0) {
                close()
            }
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Import failed",
                text: e?.data?.message || e?.message || "Request failed",
            })
        }
    }

    return {
        values: {
            isLoading,
            eligibleOnly,
            skipExisting,
            dryRun,
            fileName: file?.name || "",
        },
        functions: {
            onFileChange,
            setEligibleOnly,
            setSkipExisting,
            setDryRun,
            handleSubmit,
        },
    }
}

export default useImportSheetController
