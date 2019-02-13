import React from 'react';

import { AppWrapperContainer } from '@containers/app-wrapper.container';
import { WebNotificationsContainer } from '@containers/web-notifications.container';

const SettingsPage = () => (
  <AppWrapperContainer>
    <WebNotificationsContainer />
  </AppWrapperContainer>
);

export default SettingsPage;
