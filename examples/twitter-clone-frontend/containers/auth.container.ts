import { loadAuth } from '@firebase/loaders';
import { ServerUserInfo } from '@server/helpers';
import { getFirebaseUserProperty } from '@utils/helpers';
import { Container } from 'unstated';
import { FirebaseUser, FirebaseUserProperty } from '../typings/firebase.types';

export interface AuthContainerState {
  /** The url to visit after a successful login */
  nextUrl?: string;
  loading: boolean;
  loggedIn: boolean;
  data: FirebaseUserProperty | null;
  csrfToken: string;
  loginSource?: 'server' | 'browser';
}

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

  public async loginViaEmail({ email, password }: LoginViaEmailParams) {
    await this.setState({ loading: true });
    const { app } = await loadAuth().toPromise();
    try {
      await app.auth().signInWithEmailAndPassword(email, password);
      await this.setState({ loading: false, loginSource: 'browser' });
    } catch (error) {
      await this.setState({ loading: false });
      throw error;
    }
  }

  /** Sets the data for the user in response to a change in the auth state */
  public setData(data: FirebaseUser | ServerUserInfo | null) {
    this.setState(AuthContainer.authStateFromData(data));
  }
}

interface LoginViaEmailParams {
  email: string;
  password: string;
}
