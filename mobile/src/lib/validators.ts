import * as Yup from 'yup';
import {ADV_SOURCE_CAPTAIN_REFERRAL} from './data';

const strongPassword = Yup.string()
  .min(8, 'Password must be at least 8 characters')
  .matches(/[A-Za-z]/, 'Password must include at least one letter')
  .matches(/[0-9]/, 'Password must include at least one number')
  .required('Password is required');

export const loginValidation = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export const forgotEmailValidation = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

export const addVesselValidation = Yup.object().shape({
  first_name: Yup.string().required('First Name is required'),
  last_name: Yup.string().required('Last Name is required'),
  mailing_address: Yup.string().required('Mailing Address is required'),
  primary_phone: Yup.string()
    .matches(/^\d{10}$/, 'Enter a valid phone number')
    .required('Phone Number is required'),
  secondary_phone: Yup.string()
    .test('optional-or-valid', 'Enter a valid phone number', function(value) {
      // Allow empty string or exactly 10 digits
      return !value || /^\d{10}$/.test(value);
    }),
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
  year: Yup.string()
    .matches(/^\d{4}$/, 'Year must be 4 digits')
    // .test('less-than-current-year', 'Year must be less than current year', function(value) {
    //   if (!value) return true; // Let required() handle empty values
    //   const currentYear = new Date().getFullYear();
    //   const yearValue = parseInt(value, 10);
    //   return yearValue < currentYear;
    // })
    .required('Year is required'),
  model: Yup.string()
    .required('Model is required'),
  make: Yup.string().required('Manufacturer is required'),
  registration: Yup.string()
    .trim()
    .max(15, 'Registration must be at most 15 characters')
    .required('Registration is required'),
  hin_number: Yup.string().trim().optional(),
  vessel_length: Yup.string()
    .trim()
    .matches(/^(?:[1-9]|[1-4]\d|50)$/, 'Length must be from 1 to 50 ft')
    .required('Length is required'),
  hull_color: Yup.string().required('Color is required'),
  primary_boating_location: Yup.string().required(
    'Primary boating location is required',
  ),
  vessel_owner_name: Yup.string(),
  vessel_aggreement_date: Yup.string(),
  advName: Yup.string().required('Where did you hear about us is required'),
  captainName: Yup.string().when('advName', {
    is: ADV_SOURCE_CAPTAIN_REFERRAL,
    then: (schema) => schema.required('Captain name is required'),
    otherwise: (schema) => schema.optional(),
  }),
  // marina_agreement_date: Yup.string().required('Marina Agreement Date is required'),
  // marina_name: Yup.string().required('Marina Representative Name is required'),
});


export const verificationSchema = Yup.object().shape({
  otp: Yup.string()
    .matches(/^\d{6}$/, 'Enter the 6-digit code')
    .required('Verification code is required'),
});

export const contactUsValidator = Yup.object().shape({
  name: Yup.string()
    .matches(/^[A-Za-z\s'-]+$/, 'Name can only contain letters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  subject: Yup.string().required('Subject is required'),
  message: Yup.string().required('Message is required'),
});

export const passwordValidator = Yup.object().shape({
  existing: Yup.string().required('Old password is required'),
  password: strongPassword,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
});

export const recoverSchema = Yup.object().shape({
  password: strongPassword,
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
});

export const signupValidator = Yup.object().shape({
  first_name: Yup.string()
    .matches(/^[A-Za-z\s'-]+$/, 'Name can only contain letters')
    .required('First Name is required'),
  last_name: Yup.string()
    .matches(/^[A-Za-z\s'-]+$/, 'Name can only contain letters')
    .required('Last Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string()
    .matches(/^\d{10}$/, 'Enter a valid phone number')
    .required('Phone number is required'),
  password: strongPassword,
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
});
export const editProfileValidator = Yup.object().shape({
  first_name: Yup.string()
    .matches(/^[A-Za-z\s'-]+$/, 'Name can only contain letters')
    .required('First Name is required'),
  last_name: Yup.string()
    .matches(/^[A-Za-z\s'-]+$/, 'Name can only contain letters')
    .required('Last Name is required'),
  email: Yup.string().email('Invalid email'),
  phone: Yup.string()
    .matches(/^\d{10}$/, 'Enter a valid phone number')
    .required('Phone number is required'),
  mailing_address: Yup.string(),
});
export const addMemberValidator = Yup.object().shape({
  first_name: Yup.string()
    .matches(/^[A-Za-z\s'-]+$/, 'Name can only contain letters')
    .required('First Name is required'),
  last_name: Yup.string()
    .matches(/^[A-Za-z\s'-]+$/, 'Surname can only contain letters')
    .required('Last Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string()
    .matches(/^\d{10}$/, 'Enter a valid phone number')
    .required('Phone number is required'),
  relation: Yup.string().required('Relationship is required'),
});
