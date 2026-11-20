import {ADV_SOURCE_CAPTAIN_REFERRAL} from '@Utils/data';
import {addVesselValidation} from '@Utils/validators';
import {devLog} from '@Utils/devLog';
import {applyFormApiError, showGeneralError} from '@Utils/formErrors';
import {uploadImageFile} from '@Utils/uploadImage';
import {
  onPaymentCancel,
  onPaymentSuccess,
  openCheckout,
  refreshMembershipAfterPayment,
  resolveCheckoutOutcome,
} from '@Utils/paymentCompletion';
import {FormikHelpers} from 'formik';
import {useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import useCamera from '@Hooks/useCamera';
import useToggle from '@Hooks/useToggle';
import {useAuthMode} from '@Hooks/useAuthMode';
import {
  useCreateVesselMutation,
  useLazyGetVesselPaymentStatusQuery,
} from '@Api/user';
import {selectUserProfile} from '@Store/userSlice';
import {GeneralScreenProps} from '@Types/navigation';
import type {CreateVesselBody} from '@Types/models/vessel';

import {useRoute} from '@react-navigation/native';
import {goBack, replace} from '@Utils/navigation';
import type {PaymentFlowStatus} from '@Types/navigation';

type IValues = {
  first_name: string;
  last_name: string;
  mailing_address: string;
  primary_phone: string;
  secondary_phone: string;
  email: string;
  year: string;
  make: string;
  model: string;
  registration: string;
  hin_number: string;
  vessel_length: string;
  hull_color: string;
  vessel_owner_name: string;
  marina_agreement_date: string;
  vessel_aggreement_date: string;
  marina_name: string;
  advName: string;
  captainName: string;
  primary_boating_location: string;
};

const VESSEL_FIELDS = [
  'first_name',
  'last_name',
  'mailing_address',
  'primary_phone',
  'secondary_phone',
  'email',
  'year',
  'make',
  'model',
  'registration',
  'hin_number',
  'vessel_length',
  'hull_color',
  'vessel_owner_name',
  'marina_agreement_date',
  'vessel_aggreement_date',
  'marina_name',
  'advName',
  'captainName',
  'primary_boating_location',
] as const;

const POLL_INTERVAL_MS = 2500;
const POLL_ATTEMPTS_AFTER_CANCEL = 3;

const sleep = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

const useAddVessel = () => {
  const [marinaPicker, , toggleMarina] = useToggle();
  const [vesselPicker, , toggleVessel] = useToggle();
  const [imagePicker, setImagePicker, toggleImagePicker] = useToggle(false);
  const [image, setImage] = useState<any>(null);
  const [imageLoad, setImageLoad] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const paymentConfirmedRef = useRef(false);
  const pendingVesselIdRef = useRef<string | null>(null);

  const {img, openCamera, openGallery} = useCamera();

  const [createVessel, { isLoading }] = useCreateVesselMutation();
  const [getVesselPaymentStatus] = useLazyGetVesselPaymentStatusQuery();
  const user = useSelector(selectUserProfile);
  const {isUser} = useAuthMode();
  const { params } = useRoute<GeneralScreenProps<'AddVessel'>['route']>();

  useEffect(() => {
    // Soft-block only — do not promptLogin here. That flag survives into Auth
    // screens after logout/session clear and shows a bogus signup popup.
    if (!isUser) {
      goBack();
    }
  }, [isUser]);

  useEffect(() => {
    if (img) {
      setImage(img);
    }
    setImagePicker(false);
  }, [img, setImagePicker]);

  const showPaymentStatus = (status: PaymentFlowStatus, vesselId: string) => {
    setIsVerifyingPayment(false);
    // Replace AddVessel so back does not return to the submitted form.
    replace('PaymentStatus', {
      status,
      vesselId,
      packageId: params?.id,
    });
  };

  useEffect(() => {
    const offSuccess = onPaymentSuccess(({vesselId}) => {
      if (
        !pendingVesselIdRef.current ||
        (vesselId && vesselId !== pendingVesselIdRef.current)
      ) {
        return;
      }
      paymentConfirmedRef.current = true;
      const id = pendingVesselIdRef.current;
      pendingVesselIdRef.current = null;
      showPaymentStatus('success', id);
    });

    const offCancel = onPaymentCancel(() => {
      if (!pendingVesselIdRef.current) return;
      const id = pendingVesselIdRef.current;
      pendingVesselIdRef.current = null;
      showPaymentStatus('cancelled', id);
    });

    return () => {
      offSuccess();
      offCancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  const pollPaymentStatus = async (
    vesselId: string,
    maxAttempts: number,
  ): Promise<boolean> => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (paymentConfirmedRef.current) {
        return true;
      }

      try {
        const result = await getVesselPaymentStatus(vesselId).unwrap();
        if (result?.data?.paid || result?.data?.active) {
          return true;
        }
      } catch (error) {
        devLog('Payment status poll failed', error);
      }

      await sleep(POLL_INTERVAL_MS);
    }

    return false;
  };

  const handleUpdate = async (
    values: IValues,
    helpers: FormikHelpers<IValues>,
  ) => {
    const yearNum = parseInt(String(values?.year || '').trim(), 10);
    const lenNum = Number(String(values?.vessel_length || '').trim());
    const lengthFeet =
      Number.isInteger(lenNum) && lenNum >= 1 && lenNum <= 50
        ? lenNum
        : undefined;
    const obj: Record<string, unknown> = {
      first_name: values?.first_name,
      last_name: values?.last_name,
      mailing_address: values?.mailing_address,
      primary_phone: values?.primary_phone,
      secondary_phone: values?.secondary_phone,
      email: values?.email,
      make: values?.make,
      boat_model: values?.model,
      registration: String(values.registration || '').trim().slice(0, 15),
      ...(values?.hin_number?.trim()
        ? {hin_number: values.hin_number.trim()}
        : {}),
      length: lengthFeet,
      hull_color: values?.hull_color,
      primary_boating_location: values?.primary_boating_location,
      owner_agreement: {
        owner_name: values?.vessel_owner_name,
        agreement_date: values?.vessel_aggreement_date,
      },
      advName: values?.advName,
      captainName:
        values?.advName === ADV_SOURCE_CAPTAIN_REFERRAL
          ? values?.captainName
          : undefined,
      images: [],
    };
    if (Number.isFinite(yearNum) && String(values?.year || '').trim().length === 4) {
      obj.year = yearNum;
    }

    try {
      if (image?.uri) {
        setImageLoad(true);
        try {
          // Authenticated endpoint — Bearer required
          const uploaded = await uploadImageFile(image, 'authenticated');
          obj.images = [uploaded.path];
        } finally {
          setImageLoad(false);
        }
      }

      const res = await createVessel({
        body: obj as CreateVesselBody,
        id: params?.id,
      }).unwrap();
      const checkoutUrl = res?.data;
      const vesselId = res?.vessel_id;

      if (!checkoutUrl || typeof checkoutUrl !== 'string') {
        showGeneralError(
          'No checkout link was returned. Please try again.',
          'Unable to start payment',
        );
        return;
      }

      if (!vesselId) {
        showGeneralError(
          'Please contact support if you were charged.',
          'Unable to verify payment',
        );
        return;
      }

      paymentConfirmedRef.current = false;
      pendingVesselIdRef.current = vesselId;
      setIsVerifyingPayment(true);

      let browserResult: {type?: string} | null = null;

      try {
        browserResult = await openCheckout(checkoutUrl);
      } catch (err) {
        devLog('Checkout browser error', err);
        showGeneralError('Please try again.', 'Could not open payment page');
        setIsVerifyingPayment(false);
        pendingVesselIdRef.current = null;
        return;
      }

      if (paymentConfirmedRef.current) {
        // Deep link already moved us to the PaymentStatus screen.
        return;
      }

      // The auth browser resolves with the redirect URL it closed on, so the
      // outcome comes straight from Stripe's redirect — not from guessing.
      const outcome = resolveCheckoutOutcome(browserResult);

      if (outcome === 'success') {
        paymentConfirmedRef.current = true;
        pendingVesselIdRef.current = null;
        await refreshMembershipAfterPayment(vesselId);
        showPaymentStatus('success', vesselId);
        return;
      }

      if (outcome === 'cancelled') {
        pendingVesselIdRef.current = null;
        showPaymentStatus('cancelled', vesselId);
        return;
      }

      // Browser closed before any redirect — ask the API, which now verifies
      // the session against Stripe directly.
      const paid = await pollPaymentStatus(vesselId, POLL_ATTEMPTS_AFTER_CANCEL);

      if (paymentConfirmedRef.current || !pendingVesselIdRef.current) {
        return;
      }
      pendingVesselIdRef.current = null;

      showPaymentStatus(paid ? 'success' : 'cancelled', vesselId);
    } catch (error) {
      devLog('ERRORRR', error);
      setIsVerifyingPayment(false);
      pendingVesselIdRef.current = null;
      applyFormApiError(error, helpers, VESSEL_FIELDS, {
        toastTitle: 'Unable to save vessel',
      });
    }
  };

  const initialValues = {
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    mailing_address: user?.mailing_address ?? '',
    primary_phone: user?.primary_phone ?? '',
    secondary_phone: '',
    email: user?.email ?? '',
    year: '',
    make: '',
    model: '',
    registration: '',
    hin_number: '',
    vessel_length: '',
    hull_color: '',
    vessel_owner_name: '',
    marina_agreement_date: '',
    vessel_aggreement_date: '',
    marina_name: '',
    advName: '',
    captainName: '',
    primary_boating_location: '',
  };

  return {
    validator: addVesselValidation,
    values: {
      initialValues,
      marinaPicker,
      vesselPicker,
      imagePicker,
      image,
      isLoading: isLoading || imageLoad,
      isVerifyingPayment,
    },
    functions: {
      handleUpdate,
      toggleImagePicker,
      openImagePicker: () => setImagePicker(true),
      closeImagePicker: () => setImagePicker(false),
      openCamera,
      openGallery,
      clearImage: () => setImage(null),
      toggleMarina,
      toggleVessel,
    },
  };
};

export default useAddVessel;
