interface SimpleCookies {
  _csrf?: string;
}

interface SignedCookies {
  session?: string;
  deviceId?: string;
}

declare module 'http' {
  interface IncomingMessage {
    csrfToken(): string;
    cookies?: SimpleCookies;
    signedCookies?: SignedCookies;
    /**
     * The ID of the logged in User.
     */
    uid?: string;
    deviceId?: string;
    ssrLoggedIn: boolean;
  }
}
