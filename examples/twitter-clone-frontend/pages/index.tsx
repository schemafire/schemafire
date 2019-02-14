import React from 'react';

import { LoginForm } from '@components/login-form.component';
import styled from '@emotion/styled';

const Wrapper = styled('div')`
  margin-top: 5%;
`;

const IndexPage = () => {
  return (
    <Wrapper>
      <LoginForm />
    </Wrapper>
  );
};

export default IndexPage;
