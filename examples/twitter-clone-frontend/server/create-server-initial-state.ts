import { I18nState } from '@kj/plejio-core';
import { getUser, obtainAuthStateFromUserId } from '@kj/plejio-server-core';
import { createInitialState } from '@redux/create-initial-state';
import { createReducer } from '@redux/create-reducer';
import { AuthActionCreator } from '@redux/reducers/auth.redux';
import { CoreActionCreator } from '@redux/reducers/core.redux';
import { UserActionCreator } from '@redux/reducers/user.redux';
import { namespace } from '@utils/logger';
import debug from 'debug';
import { I18nActionCreator } from '../redux/reducers/i18n.redux';

const log = debug(namespace('redux:initial:state'));

export interface InitialStateParams {
  csrfToken: string;
  uid?: string;
  deviceId: string;
  i18n: I18nState;
}

/**
 * Setup the server initial state.
 *
 * Pass each action through to the web app reducer until we have a satisfactory starting point.
 *
 * Each step is wrapped in a try catch block so that even if we don't have all the state, we still obtain enough to continue.
 *
 * @param uid The id of the users logged in cookie
 */
export async function createServerInitialState({ csrfToken, uid, deviceId, i18n }: InitialStateParams) {
  log('Creating initial state');

  /* Create our reducer and to allow us to transform our state. */
  const reducer = createReducer();

  /* Set up our initial state - used in an immutable way */
  let state = createInitialState();

  /* Store the csrf token - Essential */
  state = reducer(state, CoreActionCreator.setCsrfToken(csrfToken));

  /* Store the deviceId */
  state = reducer(state, CoreActionCreator.setDeviceId(deviceId));

  /* Store the i18n data */
  state = reducer(state, I18nActionCreator.updateLocale.success(i18n));

  if (uid) {
    /* Get the user data */
    try {
      const auth = await obtainAuthStateFromUserId(uid);
      state = reducer(state, AuthActionCreator.setData({ data: auth, token: '' }));

      /* Let the client know that the user is already authenticated on the server side */
      state = reducer(state, CoreActionCreator.setSsrLoggedIn());
    } catch (e) {
      log('Failure while obtaining auth state');
    }

    /* Get the user data */
    try {
      const { data: user } = await getUser(uid);
      state = reducer(state, user ? UserActionCreator.setData(user) : CoreActionCreator.emptyAction());
    } catch (e) {
      log('Failure with obtaining user data', e);
    }
  }
  return state;
}
