import {StackScreenProps} from '@react-navigation/stack';
import {WeatherUpdateData} from '@Hooks/useWeatherUpdate';

export type WeatherDetailTab = 'weather' | 'tides';

export type PaymentFlowStatus = 'verifying' | 'success' | 'cancelled' | 'failed';

export type PaymentStatusParams = {
  status?: PaymentFlowStatus;
  vesselId?: string;
  packageId?: string;
};

export type WeatherUpdateDetailParams = WeatherUpdateData & {
  latitude: number;
  longitude: number;
  initialTab?: WeatherDetailTab;
};

export type GeneralParamList = {
  MainNavigator: {
    screen:
      | 'AuthNavigator'
      | 'AppNavigator'
      | 'FamilyMembers'
      | 'AddFamilyMember'
      | 'Emergency'
      | 'ServicesList'
      | 'ServiceDetail'
      | 'Memberships'
      | 'MembershipDetail'
      | 'ChangePassword'
      | 'AddVessel'
      | 'Notifications'
      | 'Map'
      | 'WeatherUpdateDetail'
      | 'WeatherMap'
      | 'WeatherRadar'
      | 'PaymentStatus';
  };
  AuthNavigator: {
    screen:
      | 'User'
      | 'Login'
      | 'ForgotPassword'
      | 'VerificationCode'
      | 'RecoverPassword'
      | 'Signup'
      | 'MothersProfile'
      | 'ForgotOptions';
  };
  AppNavigator: {screen: 'DrawerNavigator'};
  Signup: undefined;
  User: undefined;
  ChangePassword: undefined;
  MembershipCard: undefined;
  ServicesList: undefined;
  MembershipDetail: {item?: any; readOnly?: boolean};
  Memberships: undefined;
  ServiceDetail: {id?: string};
  FamilyMembers: undefined;
  Emergency: undefined;
  AddFamilyMember: undefined;
  DrawerNavigator: undefined;
  Home: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  VerificationCode: {email: string};
  RecoverPassword: {email: string; token: string};
  DrawerNavigation: {
    screen:
      | 'BottomNavigator'
      | 'MembershipStack'
      | 'MembershipTypesStack'
      | 'MembershipCardStack'
      | 'MemberAgreementStack'
      | 'SafetyStack'
      | 'PrivacyStack'
      | 'AboutStack'
      | 'ContactStack'
      | 'FAQsStack';
  };
  BottomNavigator: {
    screen: 'HomeStack' | 'VesselStack' | 'SafetyStack' | 'ProfileStack';
  };
  HomeStack: {screen: 'Home'};
  FAQsStack: {screen: 'FAQs'};
  AboutStack: {screen: 'AboutUs'};
  ContactStack: {screen: 'ContactUs'};
  PrivacyStack: {screen: 'PrivacyPolicy'};
  VesselStack: {screen: 'Vessel'};
  SafetyStack: {screen: 'Safety'};
  ServiceStack: {screen: 'ServiceLogs'};
  MembershipStack: {screen: 'MembershipLogs'};
  MembershipTypesStack: {screen: 'MembershipTypes'};
  MembershipCardStack: {screen: 'MembershipCard'};
  MemberAgreementStack: {screen: 'MemberAgreement'};
  ProfileStack: {screen: 'Profile'};
  ServiceListStack: {screen: 'ServiceList'};
  Map: {latitude?: number; longitude?: number} | undefined;
  WeatherMap: undefined;
  WeatherRadar: undefined;
  WeatherUpdateDetail: WeatherUpdateDetailParams;
  FAQs: undefined;
  ContactUs: undefined;
  AddVessel: {id: string};
  PaymentStatus: PaymentStatusParams | undefined;
  Vessel: undefined;
  ServiceLogs: undefined;
  AboutUs: undefined;
  PrivacyPolicy: undefined;
  TermsAndConditions: undefined;
  MemberAgreement: undefined;
  MembershipLogs: undefined;
  MembershipTypes: undefined;
  Safety: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Notifications: undefined;
};

export type GeneralScreenProps<T extends keyof GeneralParamList> =
  StackScreenProps<GeneralParamList, T>;
