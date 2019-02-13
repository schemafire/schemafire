import React, { PureComponent } from 'react';

import { AppWrapperContainer } from '@containers/app-wrapper.container';
import { SetupPaymentContainer } from '@containers/setup-payment.container';

class AccountPage extends PureComponent {
  public render() {
    return (
      <AppWrapperContainer>
        <SetupPaymentContainer />
      </AppWrapperContainer>
    );
  }
}

export default AccountPage;
