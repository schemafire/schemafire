import React from 'react';

import { AuthForm } from '@components/login-form.component';
import styled from '@emotion/styled';
import { redirect } from '@routes/route.helpers';
import { PageContext } from '@typings/next.types';
import { NextFunctionComponent } from 'next';

const Wrapper = styled('div')`
  margin-top: 5%;
`;

const LoginPage: NextFunctionComponent<{}, {}, PageContext> = () => {
  return (
    <Wrapper>
      <AuthForm mode='login' />
    </Wrapper>
  );
};

LoginPage.getInitialProps = async (context: PageContext) => {
  if (context.authState.loggedIn) {
    await redirect({ context, path: '/' });
  }
};

export default LoginPage;
