import { Navigate, Outlet } from "react-router-dom";
import { extractAuthData } from "../../utils/storage";

const ProtectedRoute = () => {

    const isAuthenticated = () => {
        return !!extractAuthData("user")
    }

    return isAuthenticated() ? <Navigate to="/users" replace /> : <Outlet />

};

export default ProtectedRoute