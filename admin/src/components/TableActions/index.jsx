import {
    PencilLineIcon,
    Trash2Icon
} from "lucide-react";
import { memo } from "react";
import Icon from "../Icon";

const stopRow = (fn) => (e) => {
    e.stopPropagation()
    fn?.()
}

const TableActions = ({
    onView,
    onEdit,
    onDelete,
    onToggleStatus,
    active,
    children = null,
    editIcon = false, // pencil icon for Edit; default is underline text
}) => {
    return (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {onView && (
                <button type="button" className="underline min-h-[44px] px-1" onClick={stopRow(onView)}>View</button>
            )}
            {onEdit && (
                editIcon ? (
                    <Icon Icon={PencilLineIcon} onClick={stopRow(onEdit)} name={"Edit"} color="yellow" />
                ) : (
                    <button type="button" className="underline min-h-[44px] px-1" onClick={stopRow(onEdit)}>Edit</button>
                )
            )}
            {onToggleStatus && (
                <button type="button" className="underline min-h-[44px] px-1 whitespace-nowrap" onClick={stopRow(onToggleStatus)}>
                    {active ? "Inactivate" : "Activate"}
                </button>
            )}
            {onDelete && (
                <Icon Icon={Trash2Icon} onClick={stopRow(onDelete)} name={"Delete"} color="red" />
            )}
            {children}
        </div>
    );
};

export default memo(TableActions);
