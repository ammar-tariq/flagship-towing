import { ROLE_SUPER_ADMIN } from "../constants/roles"
import { extractAuthData } from "./storage"

export function isSuperAdminUser() {
    const user = extractAuthData("user")
    return user?.role === ROLE_SUPER_ADMIN
}
