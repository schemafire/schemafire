import { FirebaseUserProperty } from '@typings/firebase.types';
import admin from 'firebase-admin';

const internalPrefixes = [/^\/_next\//, /^\/static\//];

export function isInternalNextUrl(url: string) {
  for (const prefix of internalPrefixes) {
    if (prefix.test(url)) {
      return true;
    }
  }

  return false;
}

interface UserSessionLoggedIn {
  loggedIn: true;
  token: admin.auth.DecodedIdToken;
}

type UserSession = UserSessionLoggedIn | { loggedIn: false };

/**
 * When a user first visits the site we need to check whether or not they have an active session.
 *
 * If they do we can pre-render a page with authentication built it.
 */
export const getTokenFromUserSession = async (cookie?: string): Promise<UserSession> => {
  const noSession = { loggedIn: false as false };
  if (!cookie) {
    return noSession;
  }
  try {
    const token = await admin.auth().verifySessionCookie(cookie, true);
    return { loggedIn: true, token };
  } catch {
    return noSession;
  }
};

/**
 * Simply checks the user session for whether they are logged in or not.
 */
export const isUserLoggedIn = (userSession: UserSession): userSession is UserSessionLoggedIn => {
  return userSession.loggedIn;
};

export class ServerUserInfo implements FirebaseUserProperty {
  public displayName: string;
  public email: string;
  public photoURL: string;
  public providerId: string = '';
  public uid: string = '';
  public isAnonymous: boolean;
  public refreshToken: string = '';
  public metadata: firebase.auth.UserMetadata;
  public emailVerified: boolean;
  public phoneNumber: string;
  public providerData: firebase.UserInfo[];

  constructor(user: admin.auth.UserRecord) {
    this.displayName = user.displayName || '';
    this.email = user.email || '';
    this.photoURL = user.photoURL || '';
    this.emailVerified = user.emailVerified;
    this.isAnonymous = false;
    this.metadata = user.metadata;
    this.providerData = user.providerData;
    this.phoneNumber = user.phoneNumber || '';
  }

  public toJSON(): FirebaseUserProperty {
    return {
      displayName: this.displayName,
      email: this.email,
      photoURL: this.photoURL,
      providerId: this.providerId,
      uid: this.uid,
      isAnonymous: this.isAnonymous,
      refreshToken: this.refreshToken,
      metadata: this.metadata,
      emailVerified: this.emailVerified,
      phoneNumber: this.phoneNumber,
      providerData: this.providerData,
    };
  }
}

/**
 * Create a client compatible authData object
 */
export const obtainAuthStateFromUserId = async (uid: string) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return new ServerUserInfo(userRecord);
  } catch {
    return null;
  }
};
