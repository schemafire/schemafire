import { PageContext } from '@typings/next.types';
import { Env } from '@utils/environment';
import Router from 'next/router';

interface RedirectParams {
  context: PageContext;
  path: string;
}

export const redirect = async ({ context, path }: RedirectParams) => {
  if (Env.isServer) {
    console.log('server redirecting');
    // server
    // 303: "See other"
    context.res!.writeHead(303, { Location: path });
    context.res!.end();
  } else {
    console.log('browser redirect');
    // In the browser, we just pretend like this never even happened ;)
    await Router.replace(path);
  }
};
