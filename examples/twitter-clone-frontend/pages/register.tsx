import React from 'react';

import { AuthForm } from '@components/login-form.component';
import { redirect } from '@routes/route.helpers';
import { PageContext } from '@typings/next.types';
import { NextFunctionComponent } from 'next';

const RegisterPage: NextFunctionComponent<{}, {}, PageContext> = () => {
  return <AuthForm mode='create' />;
};

RegisterPage.getInitialProps = async (context: PageContext) => {
  if (context.authState.loggedIn) {
    await redirect({ context, path: '/' });
  }
};

export default RegisterPage;
