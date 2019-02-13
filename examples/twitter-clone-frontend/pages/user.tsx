import React, { PureComponent } from 'react';

import { NextContext } from 'next';
import { DefaultQuery } from 'next/router';

interface Props extends DefaultQuery {
  username: string;
}

class ProfilePage extends PureComponent<Props> {
  public static async getInitialProps({ query }: NextContext<Props>) {
    const { username } = query;
    // Logic to obtain user details from the server.
    return { username };
  }

  public render() {
    return (
      <div>
        <h1>{this.props.username}</h1>
        <p>Welcome to your profile page</p>
      </div>
    );
  }
}

export default ProfilePage;
