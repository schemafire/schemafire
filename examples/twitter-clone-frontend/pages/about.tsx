import React from 'react';

import { AppWrapperContainer } from '@containers/app-wrapper.container';

const AboutPage = () => (
  <AppWrapperContainer authRequired={false}>
    <p>About us</p>
    <div>Plejio makes donations easy</div>
  </AppWrapperContainer>
);

export default AboutPage;
