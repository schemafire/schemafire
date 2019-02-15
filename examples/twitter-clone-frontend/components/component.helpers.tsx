import { Env } from '@utils/environment';
import { Responsive } from 'semantic-ui-react';

export const getWidth = () => {
  return Env.isServer ? Number(Responsive.onlyTablet.minWidth) : window.innerWidth;
};
