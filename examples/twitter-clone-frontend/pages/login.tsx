import React from 'react';
import { connect } from 'react-redux';

import { AppWrapperContainer } from '@containers/app-wrapper.container';
import { LoginCard } from '@kj/plejio-components';
import { RootState } from '@kj/plejio-core';
import { AuthActionCreator, AuthSelector } from '@redux/reducers/auth.redux';
import { PageContext } from '@typings/redux';
import { NextFunctionComponent } from 'next';
import Router from 'next/router';

type Props = ReturnType<typeof mapStateToProps> & typeof actionDispatch;

const LoginScreen: NextFunctionComponent<Props, {}, PageContext> = ({ login, nextUrl }) => {
  const onGitHubLogin = () => {
    login({
      onSuccess: async () => {
        console.log('logged in successfully');
        await Router.replace(nextUrl);
      },
    });
  };

  return (
    <AppWrapperContainer authRequired={false} redirectWhenAuthenticated={{ url: nextUrl, method: 'replace' }}>
      <LoginCard onClickGitHubLogin={onGitHubLogin} />
    </AppWrapperContainer>
  );
};

LoginScreen.getInitialProps = ({ res, initialState }) => {
  if (res && initialState) {
    const isLoggedIn = AuthSelector.loggedIn(initialState);
    if (isLoggedIn) {
      /* Redirecting the user */
      res.writeHead(302, {
        Location: AuthSelector.nextUrl(initialState),
      });
      res.end();
    }
  }
  return {};
};

const mapStateToProps = (state: RootState) => ({
  nextUrl: AuthSelector.nextUrl(state),
  isLoggedIn: AuthSelector.loggedIn(state),
});

const actionDispatch = {
  login: AuthActionCreator.login.request,
};

export default connect(
  mapStateToProps,
  actionDispatch,
)(LoginScreen);
