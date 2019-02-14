/* tslint:disable-line:file-name-casing */

import React, { ComponentType } from 'react';

import { AuthContainer } from '@containers/auth.container';
import { AuthContainerState } from '@containers/types';
import { createServerState } from '@server/create-state.server';
import { Context, PageContext } from '@typings/next.types';
import { getCsrfToken, getUid } from '@utils/helpers';
import App, { AppProps, Container, DefaultAppIProps } from 'next/app';
import { Provider } from 'unstated';

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
    const { ctx, Component } = appContext;
    const uid = getUid(appContext);
    const csrfToken = getCsrfToken(appContext);

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }

    const { authState } = await createServerState({ uid, csrfToken });
    const authContainer = AuthContainer.create(authState);
    decoratePageContext(ctx, AuthContainer.create(authState));

    return { authState: authContainer.state, authContainer, pageProps };
  }

  private readonly authContainer: AuthContainer;

  constructor(props: Props) {
    super(props);

    this.authContainer = AuthContainer.create(props.authState);
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
