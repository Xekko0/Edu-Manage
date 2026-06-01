import useAuthStore from '../store/authStore';
import * as authApi from '../api/auth.api';

const useAuth = () => {
  const { user, accessToken, setAuth, logout } = useAuthStore();

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res?.success) {
      setAuth({
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
    }
    return res;
  };

  return { user, accessToken, isAuthed: !!accessToken, login, logout };
};

export default useAuth;
