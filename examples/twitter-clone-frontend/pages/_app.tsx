/* tslint:disable-line:file-name-casing */

import React, { ComponentType } from 'react';

import { AuthContainer } from '@containers/auth.container';
import { AuthContainerState } from '@containers/types';
import { authListener } from '@firebase/listeners';
import { createServerState } from '@server/create-state.server';
import { Context, PageContext } from '@typings/next.types';
import { Env } from '@utils/environment';
import { getCsrfToken, getUid } from '@utils/helpers';
import App, { AppProps, Container, DefaultAppIProps } from 'next/app';
import { Subscription } from 'rxjs';
import { Provider } from 'unstated';
import 'unstated-debug';

interface Props {
  Component: ComponentType<{}>;
  pageProps: {};
  authState: AuthContainerState;
}

/**
 * Mutate the appContext with the store and state which can be used in all NextJS page contexts
 *
 * @param appContext
 * @param reduxStore
 * @param initialState
 */
const decoratePageContext = (pageContext: PageContext, authContainer: AuthContainer) => {
  pageContext.authState = authContainer.state;
};

interface Props extends DefaultAppIProps, AppProps {
  authState: AuthContainerState;
}

class TwitterCloneApp extends App<Props> {
  public static async getInitialProps(appContext: Context) {
    let pageProps = {};
    if (Env.isServer) {
      const { ctx, Component } = appContext;
      const uid = getUid(appContext);
      const csrfToken = getCsrfToken(appContext);

      const { authState } = await createServerState({ uid, csrfToken });
      const authContainer = AuthContainer.create(authState);
      decoratePageContext(ctx, AuthContainer.create(authState));

      if (Component.getInitialProps) {
        pageProps = await Component.getInitialProps(ctx);
      }

      return { authState: authContainer.state, authContainer, pageProps };
    }
    return { pageProps };
  }

  private readonly authContainer: AuthContainer;

  /** Stores the auth events subscription for the app */
  private readonly authListener?: Subscription;

  constructor(props: Props) {
    super(props);
    this.authContainer = AuthContainer.create(props.authState);

    if (Env.isBrowser) {
      // Start listening to auth events
      this.authListener = authListener(this.authContainer);
    }
  }

  public componentWillUnmount() {
    if (this.authListener) {
      this.authListener.unsubscribe();
    }
  }

  public render() {
    const { Component, pageProps } = this.props;
    return (
      <Container>
        <Provider inject={[this.authContainer]}>
          <Component {...pageProps} />
        </Provider>
      </Container>
    );
  }
}

export default TwitterCloneApp;
