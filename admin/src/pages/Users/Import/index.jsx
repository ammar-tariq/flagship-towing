import { Fragment } from "react"
import ModalFooter from "../../../components/ModalFooter"
import useImportSheetController from "./useImportSheetController"

const ImportUsersSheet = () => {
    const { values, functions } = useImportSheetController()

    return (
        <Fragment>
            <div className="grid gap-4 text-secondary">
                <p className="text-sm text-gray-600">
                    Upload the same column layout as the Flagship membership export (.xlsx or .csv). Each row creates one
                    user (<code>auth_provider: sheet</code>, random password) and one vessel.
                </p>
                <div>
                    <label className="block text-sm font-medium mb-1">Spreadsheet file</label>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={functions.onFileChange}
                        className="block w-full text-sm"
                    />
                    {values.fileName ? (
                        <p className="text-xs text-gray-500 mt-1">Selected: {values.fileName}</p>
                    ) : null}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={values.eligibleOnly}
                        onChange={(e) => functions.setEligibleOnly(e.target.checked)}
                    />
                    <span className="text-sm">Eligible rows only (email + area + membership type + expiration, not expired)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={values.skipExisting}
                        onChange={(e) => functions.setSkipExisting(e.target.checked)}
                    />
                    <span className="text-sm">Skip rows if email already exists</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={values.dryRun}
                        onChange={(e) => functions.setDryRun(e.target.checked)}
                    />
                    <span className="text-sm">Dry run (validate only — no database writes)</span>
                </label>
            </div>
            <ModalFooter onSubmit={functions.handleSubmit} isSubmitting={values.isLoading} />
        </Fragment>
    )
}

export default ImportUsersSheet
