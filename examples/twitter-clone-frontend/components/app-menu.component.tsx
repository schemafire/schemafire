import React, { FC } from 'react';

import { AuthContainer } from '@containers/auth.container';
import withContainers from '@containers/unstated.hoc';
import Link, { LinkProps } from 'next/link';
import { withRouter, WithRouterProps } from 'next/router';
import { Button, Input, Menu, MenuItemProps } from 'semantic-ui-react';

interface ActiveLinkProps extends Pick<LinkProps, 'href'>, Required<WithRouterProps>, MenuItemProps {
  title?: string;
}

const ActiveLinkComponent: FC<ActiveLinkProps> = ({ href, children, router, title, ...props }) => {
  return (
    <Link href={href}>
      <Menu.Item as='a' {...props} active={`/${router.pathname.split('/')[1]}` === href}>
        {title ? title : children}
      </Menu.Item>
    </Link>
  );
};

const ActiveLink = withRouter(ActiveLinkComponent);

export interface AppMenuProps {
  fixed?: boolean;
  mobile?: boolean;
}

export const AppMenu: FC<AppMenuProps> = ({ fixed = false, mobile = false }) => {
  return (
    <>
      <ActiveLink title='Home' href='/' />
      <ActiveLink title='Feed' href='/feed' />
      <ActiveLink title='Notifications' href='/notifications' />
      <ActiveLink title='Messages' href='/messages' />
      <AuthMenu mobile={mobile} fixed={fixed} />
    </>
  );
};

interface AuthMenuProps {
  mobile: boolean;
  fixed: boolean;
  auth: AuthContainer;
}

export const AuthMenuComponent: FC<AuthMenuProps> = ({ mobile, fixed, auth }) => {
  if (mobile) {
    return auth.state.loggedIn ? (
      <Menu.Item>
        <Button inverted={!fixed} onClick={auth.logout}>
          Logout
        </Button>
      </Menu.Item>
    ) : (
      <>
        <ActiveLink title='Login' href='/login>' />
        <ActiveLink title='Register' href='/register' />
      </>
    );
  } else {
    return (
      <Menu.Item position='right'>
        {auth.state.loggedIn ? (
          <>
            <Input inverted={!fixed} icon='search' placeholder='Search...' />
            <Button
              inverted={!fixed}
              onClick={auth.logout}
              style={{
                marginLeft: '0.5em',
              }}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link href='/login'>
              <Button as='a' inverted={!fixed}>
                Login
              </Button>
            </Link>
            <Link href='register'>
              <Button
                as='a'
                inverted={!fixed}
                primary={fixed}
                style={{
                  marginLeft: '0.5em',
                }}
              >
                Register
              </Button>
            </Link>
          </>
        )}
      </Menu.Item>
    );
  }
};

export const AuthMenu = withContainers({ auth: AuthContainer })(AuthMenuComponent);
