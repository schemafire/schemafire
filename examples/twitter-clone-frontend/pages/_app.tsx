/* tslint:disable-line:file-name-casing */

import React, { ComponentType } from 'react';
import { Provider } from 'react-redux';

import { NextContext } from 'next';
import App, { AppComponentContext, Container } from 'next/app';
import { DefaultQuery } from 'next/router';

import { GlobalStyle } from '@kj/plejio-components/lib/global';
import withReduxStore from '@redux/with-store';
import { AppProvider } from '../containers/providers.container';
import { Env } from '../utils/environment';

/* Load ReactIntl Locale data, on initial page load in the browser */
Env.loadIntl();

interface Props {
  Component: ComponentType<{}>;
  pageProps: {};
  reduxStore: EnhancedStore;
}

interface PlejioContext extends AppComponentContext {
  Component: ComponentType & {
    getInitialProps?(ctx: NextContext<DefaultQuery>): Promise<object>;
  };
}

class PlejioApp extends App<Props> {
  public static async getInitialProps({ Component, ctx }: PlejioContext) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }

    return { pageProps };
  }

  public render() {
    const { Component, pageProps, reduxStore } = this.props;
    return (
      <Container>
        <GlobalStyle />
        <Provider store={reduxStore}>
          <AppProvider>
            <Component {...pageProps} />
          </AppProvider>
        </Provider>
      </Container>
    );
  }
}

export default withReduxStore(PlejioApp);
