import { lazy } from "react"

const ComingSoon = lazy(() => import("../pages/ComingSoon"))

const Login = lazy(() => import("../pages/Auth/Login"))
const ForgotPassword = lazy(() => import("../pages/Auth/ForgotPassword"))
const VerifyCode = lazy(() => import("../pages/Auth/VerifyCode"))
const ResetPassword = lazy(() => import("../pages/Auth/ResetPassword"))

const ViewUsers = lazy(() => import("../pages/Users/View"))
const AddEditUser = lazy(() => import("../pages/Users/AddEdit"))
const ViewRepresentatives = lazy(() => import("../pages/Representatives/View"))
const ViewManagersDetails = lazy(() => import("../pages/Users/ViewDetails"))
const ViewFeedbacks = lazy(() => import("../pages/Feedbacks/View"))
const ViewFeedbacksDetails = lazy(() => import("../pages/Feedbacks/ViewDetails"))
const ViewFamilyMembers = lazy(() => import("../pages/FamilyMembers/View"))
const ViewFamilyMembersDetails = lazy(() => import("../pages/FamilyMembers/ViewDetails"))
const AuthorizedUserRequests = lazy(() => import("../pages/AuthorizedUserRequests"))
const ViewPackages = lazy(() => import("../pages/Packages/View"))
const ViewPaymentLogs = lazy(() => import("../pages/PaymentLogs/View"))
const ViewPromos = lazy(() => import("../pages/Promo/View"))
// const ViewServices = lazy(() => import("../pages/Services/View"))
const ViewVesselDetails = lazy(() => import("../pages/Vessel/Details"))
const EditVessel = lazy(() => import("../pages/Vessel/Edit"))
const Notifications = lazy(() => import("../pages/Notifications"))
const SuperSettings = lazy(() => import("../pages/SuperSettings"))
const ActivityLogs = lazy(() => import("../pages/ActivityLogs"))
const DeletedAccounts = lazy(() => import("../pages/DeletedAccounts"))

export const ROUTES = [
  {
    path: "/",
    element: <Login />,
    private: false,
    layout: false
  },
  {
    path: "/coming-soon",
    element: <ComingSoon />,
    private: true,
    layout: true
  },
  {
    path: "/login",
    element: <Login />,
    private: false,
    layout: false
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
    private: false,
    layout: false
  },
  {
    path: "/verify",
    element: <VerifyCode />,
    private: false,
    layout: false
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
    private: false,
    layout: false
  },
  {
    path: "/users",
    element: <ViewUsers />,
    private: true,
    layout: true
  },
  {
    path: "/users/add",
    element: <AddEditUser />,
    private: true,
    layout: true
  },
  {
    path: "/users/:id/edit",
    element: <AddEditUser />,
    private: true,
    layout: true
  },
  {
    path: "/users/:id",
    element: <ViewManagersDetails />,
    private: true,
    layout: true
  },
  {
    path: "/representatives",
    element: <ViewRepresentatives />,
    private: true,
    layout: true
  },
  {
    path: "/inqueries",
    element: <ViewFeedbacks />,
    private: true,
    layout: true
  },
  {
    path: "/inqueries/:id",
    element: <ViewFeedbacksDetails />,
    private: true,
    layout: true
  },
  {
    path: "/authorized-user-requests",
    element: <AuthorizedUserRequests />,
    private: true,
    layout: true
  },
  {
    path: "/users/:id/family-member-requests",
    element: <ViewFamilyMembers />,
    private: true,
    layout: true
  },
  {
    path: "/users/:id/family-member-requests/:request_id",
    element: <ViewFamilyMembersDetails />,
    private: true,
    layout: true
  },
  {
    path: "/users/:id/vessel",
    element: <ViewVesselDetails />,
    private: true,
    layout: true
  },
  {
    path: "/users/:id/vessel/:vessel_id",
    element: <ViewVesselDetails />,
    private: true,
    layout: true
  },
  {
    path: "/users/:id/vessel/:vessel_id/edit",
    element: <EditVessel />,
    private: true,
    layout: true
  },
  {
    path: "/packages",
    element: <ViewPackages />,
    private: true,
    layout: true
  },
  {
    path: "/payment-logs",
    element: <ViewPaymentLogs />,
    private: true,
    layout: true
  },
  {
    path: "/promos",
    element: <ViewPromos />,
    private: true,
    layout: true
  },
  // {
  //   path: "/services",
  //   element: <ViewServices />,
  //   private: true,
  //   layout: true
  // },
  {
    path: "/notifications",
    element: <Notifications />,
    private: true,
    layout: true
  },
  {
    path: "/super-settings",
    element: <SuperSettings />,
    private: true,
    layout: true
  },
  {
    path: "/activity-logs",
    element: <ActivityLogs />,
    private: true,
    layout: true
  },
  {
    path: "/deleted-accounts",
    element: <DeletedAccounts />,
    private: true,
    layout: true
  },
]
