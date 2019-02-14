import { AuthContainer } from '@containers/auth.container';
import { switchMap } from 'rxjs/operators';
import { loadAuth } from './loaders';

/** Listens for login changes and then logs in to the app */
export const authListener = () => {
  const authContainer = new AuthContainer();
  return loadAuth()
    .pipe(switchMap(({ authState$ }) => authState$))
    .subscribe(user => authContainer.setData(user));
};
