import type {AppDispatch} from '@Store/index';
import {authApi} from '@Api/auth';
import {userApi} from '@Api/user';

/** Clear in-memory API caches so the next session cannot reuse another user's data. */
export const resetSessionCaches = (dispatch: AppDispatch | ((action: any) => any)) => {
  dispatch(userApi.util.resetApiState());
  dispatch(authApi.util.resetApiState());
};
