import { Navigate, Outlet } from "react-router-dom";
import { extractAuthData } from "../../utils/storage";

const PrivateRoute = () => {
  const user = extractAuthData("user");
  const access = extractAuthData("access_token");
  const refresh = extractAuthData("refresh_token");
  const isAuthenticated = Boolean(user && (access || refresh));

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
