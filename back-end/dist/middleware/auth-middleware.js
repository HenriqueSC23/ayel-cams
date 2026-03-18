import { verifyAuthToken } from '../lib/auth-token.js';
import { isTokenIdRevoked } from '../lib/token-revocation-store.js';
function getBearerToken(req) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
        return null;
    }
    return authorization.slice('Bearer '.length).trim();
}
export function optionalAuth(req, _res, next) {
    const token = getBearerToken(req);
    if (!token) {
        next();
        return;
    }
    try {
        const payload = verifyAuthToken(token);
        if (isTokenIdRevoked(payload.jti)) {
            req.auth = undefined;
            next();
            return;
        }
        req.auth = {
            userId: payload.sub,
            role: payload.role,
            email: payload.email,
            tokenId: payload.jti,
            tokenExp: payload.exp,
        };
    }
    catch {
        req.auth = undefined;
    }
    next();
}
export function requireAuth(req, res, next) {
    const token = getBearerToken(req);
    if (!token) {
        res.status(401).json({ message: 'Autenticacao obrigatoria.' });
        return;
    }
    try {
        const payload = verifyAuthToken(token);
        if (isTokenIdRevoked(payload.jti)) {
            res.status(401).json({ message: 'Token invalido ou expirado.' });
            return;
        }
        req.auth = {
            userId: payload.sub,
            role: payload.role,
            email: payload.email,
            tokenId: payload.jti,
            tokenExp: payload.exp,
        };
        next();
    }
    catch {
        res.status(401).json({ message: 'Token invalido ou expirado.' });
    }
}
export function requireAdmin(req, res, next) {
    if (!req.auth) {
        res.status(401).json({ message: 'Autenticacao obrigatoria.' });
        return;
    }
    if (req.auth.role !== 'administrador') {
        res.status(403).json({ message: 'Permissao insuficiente para esta rota.' });
        return;
    }
    next();
}
