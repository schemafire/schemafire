import { loadAuth } from '@firebase/loaders';
import { ServerUserInfo } from '@server/helpers';
import { getFirebaseUserProperty } from '@utils/helpers';
import ky from 'ky/umd';
import Router from 'next/router';
import { Container } from 'unstated';
import { FirebaseUser } from '../typings/firebase.types';
import { AuthContainerState } from './types';

/**
 * The container for auth details.
 */
export class AuthContainer extends Container<AuthContainerState> {
  public static get initialState(): AuthContainerState {
    return {
      loading: false,
      loggedIn: false,
      data: null,
      csrfToken: '',
      nextUrl: '/',
    };
  }

  public static create(state: Partial<AuthContainerState>) {
    return new AuthContainer(state);
  }

  public static authStateFromData(
    data: FirebaseUser | ServerUserInfo | null,
    state: Partial<AuthContainerState> = {},
  ) {
    const auth = data instanceof ServerUserInfo ? data.toJSON() : data ? getFirebaseUserProperty(data) : null;
    return {
      ...state,
      data: auth,
      loggedIn: Boolean(auth),
    };
  }

  public readonly state: AuthContainerState;

  /**
   * Allow for initializing the state with a value
   * @param state
   */
  constructor(state: Partial<AuthContainerState> = {}) {
    super();
    this.state = { ...AuthContainer.initialState, ...state };
  }

  private get headers() {
    return { 'csrf-token': this.state.csrfToken };
  }

  private async auth() {
    const { auth } = await loadAuth().toPromise();
    return auth;
  }

  public loginViaEmail = async ({ email, password, create = false }: LoginViaEmailParams) => {
    await this.setState({ loading: true });
    const auth = await this.auth();
    try {
      if (create) {
        await auth.createUserWithEmailAndPassword(email, password);
      } else {
        await auth.signInWithEmailAndPassword(email, password);
      }
      await Router.replace(this.state.nextUrl);
      await this.setState({
        loading: false,
        loginSource: 'browser',
        nextUrl: AuthContainer.initialState.nextUrl,
      });
    } catch (error) {
      await this.setState({ loading: false });
      throw error;
    }
  };

  public logout = async () => {
    await this.setState({ loading: true });
    const auth = await this.auth();
    await auth.signOut();
    await this.setState({ loading: false, loginSource: 'browser' });
  };

  /** Sets the data for the user in response to a change in the auth state */
  public async setData(data: FirebaseUser | ServerUserInfo | null, token: string | null) {
    // console.log('setting data', data, token);
    await this.setState(AuthContainer.authStateFromData(data));
    if (data && token && this.state.loginSource === 'browser') {
      // Login on the server
      await ky.post('/api/login', { json: { token }, headers: this.headers });
    }
    if (!data && this.state.loginSource === 'server') {
      // Logout on the server
      await ky.post('/api/logout', { headers: this.headers });
    }
  }
}

interface LoginViaEmailParams {
  email: string;
  password: string;
  create?: boolean;
}
