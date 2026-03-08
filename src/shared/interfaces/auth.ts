/**
 * Typed JWT claims / authenticated user — attached to req.user by auth.middleware.
 * Eliminates all `(req as any).user` casts.
 */
export interface AuthUser {
    id: string;
    _id?: string;
    name?: string;
    role: string;
    brandId?: string;
    outlets?: string[];
    permissions?: string[];
}

declare global {
    namespace Express {
        interface Request {
            user: AuthUser;
        }
    }
}
