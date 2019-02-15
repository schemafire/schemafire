import { AuthContainer } from '@containers/auth.container';
import { zip } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { loadAuth } from './loaders';

/** Listens for login changes and then logs in to the app */
export const authListener = (authContainer: AuthContainer) => {
  console.log('listener being created');
  return loadAuth()
    .pipe(switchMap(({ user$, idToken$ }) => zip(user$, idToken$)))
    .subscribe(([user, token]) => authContainer.setData(user, token));
};
