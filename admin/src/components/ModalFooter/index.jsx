import { memo } from "react"
import Button from "../Button"
import { useModal } from "../../contexts/ModalContext"

const ModalFooter = ({ onSubmit, isSubmitting = false }) => {

    const { close } = useModal()

    return (
        <div className="flex justify-end gap-3 mt-6">
            <Button text="Cancel" rounded onClick={close} type="danger" />
            <Button text="Submit" rounded onClick={onSubmit} loading={isSubmitting} />
        </div>
    )
}

export default memo(ModalFooter)