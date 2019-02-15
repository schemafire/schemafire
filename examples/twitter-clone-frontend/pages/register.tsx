import React from 'react';

import { LoginForm } from '@components/login-form.component';
import styled from '@emotion/styled';
import { NextFunctionComponent } from 'next';

const Wrapper = styled('div')`
  margin-top: 5%;
`;

const RegisterPage: NextFunctionComponent = () => {
  return (
    <Wrapper>
      <LoginForm mode='create' />
    </Wrapper>
  );
};

export default RegisterPage;
