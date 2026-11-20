import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useSwal } from "../../../contexts/SwalContext"
import { useUploadImageMutation } from "../../../redux/Apis/General"
import { useGetVesselByIdQuery, useGetVesselsQuery, useUpdateVesselMutation } from "../../../redux/Apis/Vessel"

const useViewVesselDetailsController = () => {

    const { id, vessel_id } = useParams()
    const navigate = useNavigate()
    const { acknowledge } = useSwal()
    const [imageFiles, setImageFiles] = useState([])

    const { data: vesselByIdData, isLoading: vesselByIdLoading, refetch } = useGetVesselByIdQuery(vessel_id, {
        skip: !vessel_id,
        refetchOnMountOrArgChange: true,
    })

    const { data: userVesselsData, isLoading: userVesselsLoading } = useGetVesselsQuery(
        { user: id, active: true },
        { skip: !!vessel_id }
    )

    const vesselData = vessel_id ? vesselByIdData?.data : userVesselsData?.data?.[0]
    const isLoading = vessel_id ? vesselByIdLoading : userVesselsLoading

    const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation()
    const [updateVessel, { isLoading: isSaving }] = useUpdateVesselMutation()

    useEffect(() => {
        if (vessel_id || userVesselsLoading) return
        const firstId = userVesselsData?.data?.[0]?._id
        if (firstId) {
            navigate(`/users/${id}/vessel/${firstId}`, { replace: true })
        }
    }, [vessel_id, userVesselsLoading, userVesselsData, id, navigate])

    const onEdit = () => {
        const vesselId = vessel_id || vesselData?._id
        if (vesselId) {
            navigate(`/users/${id}/vessel/${vesselId}/edit`)
        }
    }

    const onSavePhoto = async () => {
        const vesselId = vessel_id || vesselData?._id
        const file = imageFiles?.[0]
        if (!vesselId || !(file instanceof File)) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: "Please choose a photo to upload",
            })
            return
        }
        try {
            const formData = new FormData()
            formData.append("image", file)
            const uploadRes = await uploadImage(formData).unwrap()
            const path = uploadRes?.data?.path
            if (!path) {
                throw new Error("Upload succeeded but no image path was returned")
            }
            await updateVessel({ id: vesselId, payload: { images: [path] } }).unwrap()
            setImageFiles([])
            refetch()
            acknowledge({
                title: "Success",
                text: vesselData?.images?.[0] ? "Vessel photo updated" : "Vessel photo added",
            })
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || e?.message || "Unable to save vessel photo",
            })
        }
    }

    return {
        values: {
            data: vesselData || [],
            isLoading,
            canEdit: Boolean(vessel_id || vesselData?._id),
            hasExistingImage: Boolean(vesselData?.images?.[0]),
            imageFiles,
            isSavingPhoto: isUploading || isSaving,
        },
        functions: {
            onEdit,
            setImageFiles,
            onSavePhoto,
        },
    }

}

export default useViewVesselDetailsController
