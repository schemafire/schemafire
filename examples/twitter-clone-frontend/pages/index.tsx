import React from 'react';

import styled from '@emotion/styled';
import { redirect } from '@routes/route.helpers';
import { PageContext } from '@typings/next.types';
import { NextFunctionComponent } from 'next';

const Wrapper = styled('div')`
  margin-top: 5%;
`;

const IndexPage: NextFunctionComponent<{}, {}, PageContext> = () => {
  return <Wrapper />;
};

IndexPage.getInitialProps = async (context: PageContext) => {
  if (!context.authState.loggedIn) {
    await redirect({ context, path: '/login' });
  }
};

export default IndexPage;
