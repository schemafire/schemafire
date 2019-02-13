/**
 * Stores some environment flags in an app singleton.
 * Used on both the server and the client.
 */
export class Env {
  private static initialized = false;
  public static csrfToken: string;

  static get isServer(): boolean {
    return typeof window === 'undefined';
  }

  static get isBrowser(): boolean {
    return !Env.isServer;
  }

  static get supports() {
    return {
      sw: Env.isBrowser && 'serviceWorker' in navigator,
    };
  }

  public static setupBrowser() {
    if (Env.isBrowser && !Env.initialized) {
      // const csrfToken: string = CoreSelector.csrf(store.getState());
      // Env.csrfToken = csrfToken;
      // Env.initialized = true;
    }
  }

  static get isDev(): boolean {
    return process.env.NODE_ENV !== 'production';
  }
}
