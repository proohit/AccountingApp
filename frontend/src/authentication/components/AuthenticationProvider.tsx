import { useRouter } from 'next/dist/client/router';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { notificationState } from '../../shared/hooks/notificationState';
import { User } from '../../users/models/User';
import USER_API_SERVICE from '../../users/services/UserApiService';
import { AuthenticationContext } from '../hooks/useAuthentication';
import { AUTHENTICATION_API } from '../services/AuthenticationApi';
import { isAuthenticationRoute } from '../services/RoutingService';

export const AuthenticationProvider: FunctionComponent = (props) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [, setNotification] = useRecoilState(notificationState);
  const router = useRouter();

  const login = async (usernameForLogin: string, password: string) => {
    setIsLoading(true);
    try {
      await AUTHENTICATION_API.login(usernameForLogin, password);
      const loggedInUser = await USER_API_SERVICE.getCurrentUser();
      setUsername(loggedInUser.username);
      setAuthenticated(true);
      return loggedInUser;
    } catch (err) {
      const error: Error = err;
      setNotification({ severity: 'error', content: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const offlineLogin = (loggedInUsername: string) => {
    setUsername(loggedInUsername);
    setAuthenticated(true);
    setIsLoading(false);
  };

  const logout = async () => {
    setUsername('');
    setAuthenticated(false);
    setIsLoading(false);
    await AUTHENTICATION_API.logout();
  };

  const loginFromLocalStorage = async () => {
    setIsLoading(true);

    let currentUser: User;

    try {
      currentUser = await USER_API_SERVICE.getCurrentUser();
    } catch (e) {
      if (!isAuthenticationRoute(router.route)) {
        setNotification({ severity: 'error', content: e?.message });
      }
    }

    if (!currentUser) {
      await logout();
      setIsLoading(false);
      return;
    }

    offlineLogin(currentUser.username);
    setIsLoading(false);
  };

  useEffect(() => {
    loginFromLocalStorage();
  }, []);

  return (
    <AuthenticationContext.Provider
      value={{
        authenticated,
        login,
        offlineLogin,
        logout,
        username,
        isLoginLoading: isLoading,
      }}
    >
      {props.children}
    </AuthenticationContext.Provider>
  );
};