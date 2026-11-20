import {useContext, useEffect} from 'react';
import {FormikContext} from 'formik';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type {ServerErrorShakeStatus} from '@Utils/formErrors';

const SHAKE_EASE = Easing.out(Easing.cubic);

/**
 * Subtle horizontal shake when Formik status marks this field
 * after a server-side validation / API error.
 */
const useServerErrorShake = (fieldName?: string) => {
  const formik = useContext(FormikContext);
  const offset = useSharedValue(0);

  const status = (formik?.status || {}) as ServerErrorShakeStatus;
  const shakeAt = status.serverErrorShakeAt;
  const fieldsKey = Array.isArray(status.serverErrorFields)
    ? status.serverErrorFields.join('\0')
    : '';

  useEffect(() => {
    if (!fieldName || !shakeAt || !fieldsKey) {
      return;
    }
    const fields = fieldsKey.split('\0');
    if (!fields.includes(fieldName)) {
      return;
    }

    offset.value = 0;
    offset.value = withSequence(
      withTiming(-7, {duration: 42, easing: SHAKE_EASE}),
      withTiming(7, {duration: 42, easing: SHAKE_EASE}),
      withTiming(-5, {duration: 40, easing: SHAKE_EASE}),
      withTiming(5, {duration: 40, easing: SHAKE_EASE}),
      withTiming(-3, {duration: 36, easing: SHAKE_EASE}),
      withTiming(0, {duration: 36, easing: SHAKE_EASE}),
    );
  }, [fieldName, fieldsKey, offset, shakeAt]);

  return useAnimatedStyle(() => ({
    transform: [{translateX: offset.value}],
  }));
};

export default useServerErrorShake;
