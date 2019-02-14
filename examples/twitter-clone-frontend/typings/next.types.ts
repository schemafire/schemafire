import { AuthContainerState } from '@containers/types';
import { NextContext } from 'next';
import { AppComponentContext } from 'next/app';
import { DefaultQuery } from 'next/router';
import { ComponentType } from 'react';

export interface Context extends AppComponentContext {
  Component: ComponentType & {
    getInitialProps?(ctx: NextContext<DefaultQuery>): Promise<object>;
  };
  ctx: PageContext;
}

export interface PageContext extends NextContext<DefaultQuery> {
  authState: AuthContainerState;
}
