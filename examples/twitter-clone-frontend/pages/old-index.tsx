import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { AuthContainer } from '@containers/auth.container';
import { RootState } from '@kj/plejio-core';
import Link from 'next/link';

import { AppWrapperContainer } from '@containers/app-wrapper.container';
import { OnboardingContainer } from '@containers/onboarding.container';
import { PledgeDashboardContainer } from '@containers/pledge-dashboard.container';
import { UserSelector } from '@redux/reducers/user.redux';
import { path } from 'ramda';

const getSeconds = path(['userData', 'createdAt', 'seconds']);
const getPlan = path(['userData', 'pledge', 'plan']);

type Props = ReturnType<typeof mapStateToProps>;

class IndexPage extends PureComponent<Props> {
  private get onboardingKey() {
    const timestamp: string | undefined = getSeconds(this.props);
    if (timestamp) {
      return timestamp;
    }
    return false;
  }

  private get pledgeDashboardKey() {
    const pledge: string | undefined = getPlan(this.props);
    return pledge ? pledge : 'default';
  }

  public render() {
    return (
      <AppWrapperContainer authRequired={false}>
        <div>
          <AuthContainer>
            <PledgeDashboardContainer key={this.pledgeDashboardKey} />
            <Link href='/account'>
              <a>Setup payment account</a>
            </Link>
          </AuthContainer>
          {this.onboardingKey && <OnboardingContainer key={this.onboardingKey} />}
        </div>
        <div />
      </AppWrapperContainer>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  userData: UserSelector.data(state),
});

export default connect(mapStateToProps)(IndexPage);
