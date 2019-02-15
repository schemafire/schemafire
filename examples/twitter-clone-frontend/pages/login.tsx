import React from 'react';

import { LoginForm } from '@components/login-form.component';
import styled from '@emotion/styled';
import { PageContext } from '@typings/next.types';
import { NextFunctionComponent } from 'next';

const Wrapper = styled('div')`
  margin-top: 5%;
`;

const LoginPage: NextFunctionComponent<{}, {}, PageContext> = () => {
  return (
    <Wrapper>
      <LoginForm mode='login' />
    </Wrapper>
  );
};

export default LoginPage;
