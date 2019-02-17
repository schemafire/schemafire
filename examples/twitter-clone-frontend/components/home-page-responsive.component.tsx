import React, { FC, useState } from 'react';

import { Container, Icon, Menu, Responsive, Segment, Sidebar, Visibility } from 'semantic-ui-react';
import { AppMenu, AuthMenu } from './app-menu.component';
import { getWidth } from './component.helpers';
import { HomepageHeading } from './home-page-heading.component';

const DesktopContainer: FC = ({ children }) => {
  const [state, setState] = useState({ fixed: false });

  const hideFixedMenu = () => setState({ fixed: false });
  const showFixedMenu = () => setState({ fixed: true });

  const { fixed } = state;

  return (
    <Responsive getWidth={getWidth} minWidth={Responsive.onlyTablet.minWidth}>
      <Visibility once={false} onBottomPassed={showFixedMenu} onBottomPassedReverse={hideFixedMenu}>
        <Segment
          inverted={true}
          textAlign='center'
          style={{ minHeight: 700, padding: '1em 0em' }}
          vertical={true}
        >
          <Menu
            fixed={fixed ? 'top' : undefined}
            inverted={!fixed}
            pointing={!fixed}
            secondary={!fixed}
            size='large'
          >
            <Container>
              <AppMenu fixed={fixed} />
            </Container>
          </Menu>
          <HomepageHeading mobile={false} />
        </Segment>
      </Visibility>

      {children}
    </Responsive>
  );
};

const MobileContainer: FC = ({ children }) => {
  const [state, setState] = useState({ sidebarOpened: false });
  const handleSidebarHide = () => setState({ sidebarOpened: false });
  const handleToggle = () => setState({ sidebarOpened: true });
  const { sidebarOpened } = state;
  return (
    <Responsive as={Sidebar.Pushable} getWidth={getWidth} maxWidth={Responsive.onlyMobile.maxWidth}>
      <Sidebar
        as={Menu}
        animation='push'
        inverted={true}
        onHide={handleSidebarHide}
        vertical={true}
        visible={sidebarOpened}
      >
        <AppMenu mobile={true} />
      </Sidebar>

      <Sidebar.Pusher dimmed={sidebarOpened}>
        <Segment
          inverted={true}
          textAlign='center'
          style={{ minHeight: 350, padding: '1em 0em' }}
          vertical={true}
        >
          <Container>
            <Menu inverted={true} pointing={true} secondary={true} size='large'>
              <Menu.Item onClick={handleToggle}>
                <Icon name='sidebar' />
              </Menu.Item>
              <Menu.Item position='right'>
                <AuthMenu mobile={false} fixed={false} />
              </Menu.Item>
            </Menu>
          </Container>
          <HomepageHeading mobile={true} />
        </Segment>

        {children}
      </Sidebar.Pusher>
    </Responsive>
  );
};

export const ResponsiveContainer: FC = ({ children }) => (
  <>
    <DesktopContainer>{children}</DesktopContainer>
    <MobileContainer>{children}</MobileContainer>
  </>
);
