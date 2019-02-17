import React, { FC } from 'react';

import { Button, Container, Header, Icon } from 'semantic-ui-react';

interface HeaderProps {
  mobile?: boolean;
}

export const HomepageHeading: FC<HeaderProps> = ({ mobile = false }) => (
  <Container text={true} className='root'>
    <style jsx={true} global={true}>{`
      .root > h1.ui.header {
        font-size: ${mobile ? '2em' : '4em'};
        font-weight: normal;
        margin-bottom: 0;
        margin-top: ${mobile ? '1.5em' : '3em'};
      }

      .root > h2.ui.header {
        font-size: ${mobile ? '1.5em' : '1.7em'};
        font-weight: normal;
        margin-top: ${mobile ? '0.5em' : '1.5em'};
      }
    `}</style>
    <Header as='h1' content='Twitter Clone' inverted={true} mobile={mobile} />
    <Header as='h2' content="Let's build our own twitter." inverted={true} mobile={mobile} />
    <Button primary={true} size='huge'>
      Get Started
      <Icon name='arrow right' />
    </Button>
  </Container>
);
