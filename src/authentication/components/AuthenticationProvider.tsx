import React, { FunctionComponent, useEffect, useState } from 'react';
import USER_API_SERVICE from '../../users/services/UserApiService';
import { AuthenticationContext } from '../hooks/useAuthentication';

export const AuthenticationProvider: FunctionComponent = (props) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const STORAGE_TOKEN = 'token';

  const login = (loggedInUsername: string, newToken: string) => {
    setUsername(loggedInUsername);
    setAuthenticated(true);
    setToken(newToken);
    localStorage.setItem(STORAGE_TOKEN, newToken);
  };

  const logout = () => {
    setUsername('');
    setAuthenticated(false);
    setToken('');
    localStorage.removeItem(STORAGE_TOKEN);
  };

  const redirectToLoginPage = () => {
    // TODO: Add redirect
  };

  const loginFromLocalStorage = async () => {
    const tokenFromStorage = localStorage.getItem(STORAGE_TOKEN);

    if (!tokenFromStorage) {
      redirectToLoginPage();
      return;
    }

    let currentUser;

    try {
      currentUser = await USER_API_SERVICE.getCurrentUser(tokenFromStorage);
    } catch (e) {
      console.log(e);
    }

    if (!currentUser) {
      redirectToLoginPage();
      return;
    }

    login(currentUser.username, tokenFromStorage);
  };

  useEffect(() => {
    loginFromLocalStorage();
  }, []);

  return (
    <AuthenticationContext.Provider
      value={{ authenticated, login, logout, username, token }}
    >
      {props.children}
    </AuthenticationContext.Provider>
  );
};