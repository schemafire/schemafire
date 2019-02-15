import { FirebaseUserProperty } from '@typings/firebase.types';

export interface AuthContainerState {
  /** The url to visit after a successful login */
  nextUrl: string;
  loading: boolean;
  loggedIn: boolean;
  data: FirebaseUserProperty | null;
  csrfToken: string;
  loginSource?: 'server' | 'browser';
}
