import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import errorLogger from "../../middlewares/apierror.middleware";
import successLogger from "../../middlewares/apisuccess.middleware";
import { authApi } from "../Apis/Auth";
import { familyMembersApi } from "../Apis/FamilyMembers";
import { feedbackApi } from "../Apis/Feedbacks";
import { generalApi } from "../Apis/General";
import { incidentsApi } from "../Apis/Incidents";
import { activityLogApi } from "../Apis/ActivityLog";
import { notificationApi } from "../Apis/Notification";
import { packageApi } from "../Apis/Package";
import { promoApi } from "../Apis/Promo";
import { representativeApi } from "../Apis/Representative";
import { serviceApi } from "../Apis/Service";
import { userApi } from "../Apis/User";
import { vesselsApi } from "../Apis/Vessel";

export const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        [serviceApi.reducerPath]: serviceApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [feedbackApi.reducerPath]: feedbackApi.reducer,
        [notificationApi.reducerPath]: notificationApi.reducer,
        [packageApi.reducerPath]: packageApi.reducer,
        [generalApi.reducerPath]: generalApi.reducer,
        [representativeApi.reducerPath]: representativeApi.reducer,
        [familyMembersApi.reducerPath]: familyMembersApi.reducer,
        [promoApi.reducerPath]: promoApi.reducer,
        [incidentsApi.reducerPath]: incidentsApi.reducer,
        [activityLogApi.reducerPath]: activityLogApi.reducer,
        [vesselsApi.reducerPath]: vesselsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(authApi.middleware)
            .concat(serviceApi.middleware)
            .concat(userApi.middleware)
            .concat(feedbackApi.middleware)
            .concat(notificationApi.middleware)
            .concat(packageApi.middleware)
            .concat(generalApi.middleware)
            .concat(representativeApi.middleware)
            .concat(familyMembersApi.middleware)
            .concat(promoApi.middleware)
            .concat(incidentsApi.middleware)
            .concat(activityLogApi.middleware)
            .concat(vesselsApi.middleware)
            .concat(errorLogger)
            .concat(successLogger)
})

setupListeners(store.dispatch)
