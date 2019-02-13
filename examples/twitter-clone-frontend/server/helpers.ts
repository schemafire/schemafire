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
