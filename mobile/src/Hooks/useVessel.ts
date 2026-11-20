import {useCallback, useEffect, useRef, useState} from 'react';
import Toast from 'react-native-toast-message';
import useToggle from '@Hooks/useToggle';
import useCamera from '@Hooks/useCamera';
import {
  useDeleteVesselMutation,
  useGetVesselQuery,
  useUpdateVesselMutation,
} from '@Api/user';
import {getApiErrorMessage, showGeneralError} from '@Utils/formErrors';
import {formatPhoneDisplay} from '@Utils/countries';
import {uploadImageFile} from '@Utils/uploadImage';

const useVessel = () => {
  const [visible, , toggleVisible] = useToggle();
  const [modal, , toggleModal] = useToggle();
  const [photoSheet, , togglePhotoSheet] = useToggle();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [photoVesselId, setPhotoVesselId] = useState<string | null>(null);
  const [photoHasExisting, setPhotoHasExisting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const uploadingRef = useRef(false);

  const {img, setImg, openCamera, openGallery, isPicking} = useCamera();
  const {data, isLoading, refetch} = useGetVesselQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const [deleteVessel, {isLoading: deleteLoading}] = useDeleteVesselMutation();
  const [updateVessel] = useUpdateVesselMutation();

  const formatVesselData = useCallback((vesselData: any) => {
    const vesselOwner = [
      {
        title: 'Owner Name',
        value: vesselData.first_name + ' ' + vesselData.last_name || '-',
      },
      {title: 'Mailing Address', value: vesselData.mailing_address || '-'},
      {
        title: 'Phone Number',
        value: formatPhoneDisplay(vesselData.primary_phone) || '-',
      },
      {title: 'Email Address', value: vesselData.email || '-'},
    ];

    const vessel = [
      {title: 'Manufacturer', value: vesselData.make || '-'},
      {title: 'Model', value: vesselData.boat_model || '-'},
      {
        title: 'Year',
        value: vesselData.year != null ? String(vesselData.year) : '-',
      },
      {title: 'Registration', value: vesselData.registration || '-'},
      {title: 'HIN', value: vesselData.hin_number || '-'},
      {
        title: 'Length',
        value: vesselData.length != null ? String(vesselData.length) : '-',
      },
      {title: 'Color', value: vesselData.hull_color || '-'},
      {
        title: 'Main boating location',
        value: vesselData.primary_boating_location || '-',
      },
    ];

    return {vesselOwner, vessel};
  }, []);

  const handleEdit = useCallback(() => {
    toggleVisible();
  }, [toggleVisible]);

  const openPhotoPicker = useCallback(
    (vessel: {_id?: string; images?: string[]} | null) => {
      if (!vessel?._id) {
        return;
      }
      setPhotoVesselId(vessel._id);
      setPhotoHasExisting(Boolean(vessel.images?.[0]));
      setImg(undefined);
      togglePhotoSheet();
    },
    [setImg, togglePhotoSheet],
  );

  useEffect(() => {
    if (!img?.uri || !photoVesselId || uploadingRef.current) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      uploadingRef.current = true;
      setPhotoUploading(true);
      try {
        const uploaded = await uploadImageFile(img, 'authenticated');
        if (cancelled) {
          return;
        }
        await updateVessel({
          id: photoVesselId,
          body: {images: [uploaded.path]},
        }).unwrap();
        Toast.show({
          type: 'success',
          text1: 'Vessel photo saved',
        });
        togglePhotoSheet();
        setPhotoVesselId(null);
        setPhotoHasExisting(false);
        setImg(undefined);
        refetch();
      } catch (error) {
        if (!cancelled) {
          showGeneralError(getApiErrorMessage(error), 'Unable to save photo');
        }
      } finally {
        uploadingRef.current = false;
        if (!cancelled) {
          setPhotoUploading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [img, photoVesselId, refetch, setImg, togglePhotoSheet, updateVessel]);

  const handleRefetch = useCallback(() => {
    if (!isLoading) {
      refetch();
    }
  }, [isLoading, refetch]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) {
      return;
    }
    try {
      await deleteVessel({id: deleteId}).unwrap();
      toggleModal();
    } catch (error) {
      showGeneralError(getApiErrorMessage(error), 'Unable to delete vessel');
    }
  }, [deleteId, deleteVessel, toggleModal]);

  const handleYes = useCallback(() => {
    toggleVisible();
  }, [toggleVisible]);

  return {
    values: {
      visible,
      modal,
      photoSheet,
      isLoading,
      data: data?.data,
      deleteLoading,
      photoUploading: photoUploading || isPicking,
      photoVesselId,
      photoHasExisting,
    },
    functions: {
      handleEdit,
      toggleVisible,
      handleYes,
      toggleModal,
      handleDelete,
      handleRefetch,
      formatVesselData,
      setDeleteId,
      openPhotoPicker,
      togglePhotoSheet,
      openCamera,
      openGallery,
    },
  };
};

export default useVessel;
