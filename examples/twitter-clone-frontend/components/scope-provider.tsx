import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/core';
import memoize from '@emotion/memoize';
import React, { FC } from 'react';
import stylisPluginExtraScope from 'stylis-plugin-extra-scope';

const memoizedCreateCacheWithScope = memoize((scope: string) => {
  return createCache({
    stylisPlugins: [stylisPluginExtraScope(scope)],
  });
});

export const ScopeProvider: FC<{ scope: string }> = ({ scope, children }) => {
  return <CacheProvider value={memoizedCreateCacheWithScope(scope)}>{children}</CacheProvider>;
};
