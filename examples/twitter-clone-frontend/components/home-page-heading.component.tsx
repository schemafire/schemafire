import React, { FC } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Header, Icon } from 'semantic-ui-react';

interface HeaderProps {
  mobile?: boolean;
}

const StyledMainHeader = styled(Header)<HeaderProps>`
  font-size: ${({ mobile }) => (mobile ? '2em' : '4em')};
  font-weight: normal;
  margin-bottom: 0;
  margin-top: ${({ mobile }) => (mobile ? '1.5em' : '3em')};
`;

const StyledSubHeader = styled(Header)<HeaderProps>`
  font-size: ${({ mobile }) => (mobile ? '1.5em' : '1.7em')};
  font-weight: normal;
  margin-top: ${({ mobile }) => (mobile ? '0.5em' : '1.5em')};
`;

export const HomepageHeading: FC<HeaderProps> = ({ mobile = false }) => (
  <Container text={true}>
    <StyledMainHeader as='h1' content='Twitter Clone' inverted={true} mobile={mobile} />
    <StyledSubHeader as='h2' content="Let's build our own twitter." inverted={true} mobile={mobile} />
    <Button primary={true} size='huge'>
      Get Started
      <Icon name='arrow right' />
    </Button>
  </Container>
);
