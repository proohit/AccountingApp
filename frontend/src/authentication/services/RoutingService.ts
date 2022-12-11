export const isAuthenticationRoute = (route: string) => {
  return ['/login', '/register'].includes(route);
};

export const isOfflineRoute = (route) => {
  return route === '/_offline';
};

export const isPasswordResetRoute = (route) => {
  return route === '/settings/reset-password';
};
