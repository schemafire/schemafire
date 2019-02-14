import { AuthContainer, AuthContainerState } from '@containers/auth.container';
import { obtainAuthStateFromUserId } from './helpers';

interface CreateServerStateParams {
  csrfToken: string;
  uid?: string;
}

/**
 * Setup the server initial state.
 * Each step is wrapped in a try catch block so that even if we don't have all the state, we still obtain enough to continue.
 */
export async function createServerState({ csrfToken, uid }: CreateServerStateParams) {
  console.info('Creating initial state');

  let authState: Partial<AuthContainerState> = { csrfToken };

  if (uid) {
    /* Retrieve the auth data */
    const data = await obtainAuthStateFromUserId(uid);
    authState = AuthContainer.authStateFromData(data, authState);
    authState = { ...authState, loginSource: authState.loggedIn ? 'server' : undefined };
  }
  return { authState };
}
