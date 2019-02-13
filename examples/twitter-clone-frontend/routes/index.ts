import NextRoutes from 'next-routes';

const routes = new NextRoutes();

routes.add('user', '/@:username');

export default routes;
export const { Link, Router } = routes;
