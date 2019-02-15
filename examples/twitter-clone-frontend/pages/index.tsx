import React from 'react';

import { HomepageLayout } from '@components/home-page.component';
// import { redirect } from '@routes/route.helpers';
import { PageContext } from '@typings/next.types';
import { NextFunctionComponent } from 'next';

const IndexPage: NextFunctionComponent<{}, {}, PageContext> = () => {
  return <HomepageLayout />;
};

// IndexPage.getInitialProps = async (context: PageContext) => {
//   if (!context.authState.loggedIn) {
//     await redirect({ context, path: '/login' });
//   }
// };

export default IndexPage;
