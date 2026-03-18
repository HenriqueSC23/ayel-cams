import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { changeOwnUserPassword, countAdministrators, createCamera, createUserByAdmin, findUserByEmail, findUserById, findCameraById, listCameras, listUsers, removeCameraByAdmin, removeUserByAdmin, registerUser, touchUserAccess, updateCameraByAdmin, updateOwnUserProfile, updateUserByAdmin, } from './data/in-memory-store.js';
import { revokeTokenId } from './lib/token-revocation-store.js';
import { optionalAuth, requireAdmin, requireAuth } from './middleware/auth-middleware.js';
import { signAuthToken } from './lib/auth-token.js';
function normalizeValue(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}
function hasBodyField(body, field) {
    return typeof body === 'object' && body !== null && Object.prototype.hasOwnProperty.call(body, field);
}
function parseCameraAccess(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = normalizeValue(value);
    if (['public', 'publica', 'publicas'].includes(normalized)) {
        return 'public';
    }
    if (['restricted', 'restrita', 'restritas'].includes(normalized)) {
        return 'restricted';
    }
    return null;
}
function parseCameraStatus(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = normalizeValue(value);
    if (['live', 'ao vivo', 'aovivo'].includes(normalized)) {
        return 'live';
    }
    if (normalized === 'offline') {
        return 'offline';
    }
    return null;
}
function parseQuality(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = value.trim().toUpperCase();
    if (normalized === 'HD' || normalized === 'FHD' || normalized === '4K') {
        return normalized;
    }
    return null;
}
function parseRole(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = normalizeValue(value);
    if (['administrador', 'admin'].includes(normalized)) {
        return 'administrador';
    }
    if (['cliente', 'user', 'usuario'].includes(normalized)) {
        return 'cliente';
    }
    return null;
}
function parseUserStatus(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = normalizeValue(value);
    if (normalized === 'ativo') {
        return 'Ativo';
    }
    if (normalized === 'inativo') {
        return 'Inativo';
    }
    return null;
}
function parseUserAccess(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = normalizeValue(value);
    if (['administrador', 'admin'].includes(normalized)) {
        return 'Administrador';
    }
    if (['area restrita', 'restrito', 'restrita'].includes(normalized)) {
        return 'Area restrita';
    }
    if (['sem acesso', 'bloqueado', 'sem permissao'].includes(normalized)) {
        return 'Sem acesso';
    }
    return null;
}
function parseBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    return null;
}
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function toSafeUserPayload(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        access: user.access,
        status: user.status,
        unit: user.unit,
        avatar: user.avatar,
        lastAccess: user.lastAccess,
        phone: user.phone,
        company: user.company,
        jobTitle: user.jobTitle,
        preferences: user.preferences,
    };
}
const loginAttempts = new Map();
const loginMaxFailures = Number(process.env.LOGIN_MAX_FAILURES || 5);
const loginWindowMs = Number(process.env.LOGIN_WINDOW_MS || 10 * 60 * 1000);
const loginBlockMs = Number(process.env.LOGIN_BLOCK_MS || 15 * 60 * 1000);
function getLoginAttemptKey(ip, email) {
    return `${ip}|${email}`;
}
function getLoginBlockRemainingSeconds(key, now) {
    const entry = loginAttempts.get(key);
    if (!entry || entry.blockedUntil <= now) {
        return 0;
    }
    return Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000));
}
function clearLoginFailures(key) {
    loginAttempts.delete(key);
}
function registerLoginFailure(key, now) {
    const current = loginAttempts.get(key);
    if (!current || now - current.firstFailureAt > loginWindowMs) {
        const nextEntry = {
            failedCount: 1,
            firstFailureAt: now,
            blockedUntil: 0,
        };
        loginAttempts.set(key, nextEntry);
        return nextEntry;
    }
    const nextFailedCount = current.failedCount + 1;
    const shouldBlock = nextFailedCount >= loginMaxFailures;
    const nextEntry = {
        failedCount: nextFailedCount,
        firstFailureAt: current.firstFailureAt,
        blockedUntil: shouldBlock ? now + loginBlockMs : current.blockedUntil,
    };
    loginAttempts.set(key, nextEntry);
    return nextEntry;
}
const app = express();
const port = Number(process.env.PORT || 3333);
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((value) => value.trim()) : true;
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'ayel-cams-api',
        timestamp: new Date().toISOString(),
    });
});
app.post('/auth/login', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const now = Date.now();
    const loginKey = getLoginAttemptKey(req.ip || 'unknown-ip', email || 'unknown-email');
    const retryAfter = getLoginBlockRemainingSeconds(loginKey, now);
    if (retryAfter > 0) {
        res.status(429).json({
            message: `Muitas tentativas de login. Aguarde ${retryAfter}s para tentar novamente.`,
        });
        return;
    }
    if (!email || !password) {
        res.status(422).json({ message: 'E-mail e senha sao obrigatorios.' });
        return;
    }
    if (!isValidEmail(email)) {
        res.status(422).json({ message: 'E-mail invalido.' });
        return;
    }
    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
        const attempt = registerLoginFailure(loginKey, now);
        if (attempt.blockedUntil > now) {
            const retryAfterSeconds = Math.max(1, Math.ceil((attempt.blockedUntil - now) / 1000));
            res.status(429).json({ message: `Muitas tentativas de login. Aguarde ${retryAfterSeconds}s para tentar novamente.` });
            return;
        }
        res.status(401).json({ message: 'Credenciais invalidas.' });
        return;
    }
    clearLoginFailures(loginKey);
    if (user.status !== 'Ativo') {
        res.status(403).json({ message: 'Usuario inativo. Contate o administrador.' });
        return;
    }
    touchUserAccess(user.id);
    const token = signAuthToken({
        sub: user.id,
        email: user.email,
        role: user.role,
    });
    res.status(200).json({
        token,
        user: toSafeUserPayload(user),
    });
});
app.post('/auth/register', (req, res) => {
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!fullName || !email || !password) {
        res.status(422).json({ message: 'Nome, e-mail e senha sao obrigatorios.' });
        return;
    }
    if (!isValidEmail(email)) {
        res.status(422).json({ message: 'E-mail invalido.' });
        return;
    }
    if (password.length < 6) {
        res.status(422).json({ message: 'A senha deve conter no minimo 6 caracteres.' });
        return;
    }
    if (findUserByEmail(email)) {
        res.status(409).json({ message: 'Ja existe um usuario com este e-mail.' });
        return;
    }
    const user = registerUser({ fullName, email, password, role: 'cliente' });
    const token = signAuthToken({
        sub: user.id,
        email: user.email,
        role: user.role,
    });
    res.status(201).json({
        token,
        user: toSafeUserPayload(user),
    });
});
app.get('/auth/me', requireAuth, (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
        res.status(401).json({ message: 'Autenticacao obrigatoria.' });
        return;
    }
    const user = findUserById(userId);
    if (!user) {
        res.status(401).json({ message: 'Sessao invalida.' });
        return;
    }
    res.status(200).json({
        ...toSafeUserPayload(user),
    });
});
app.post('/auth/logout', requireAuth, (req, res) => {
    const tokenId = req.auth?.tokenId;
    const tokenExp = req.auth?.tokenExp;
    if (!tokenId || typeof tokenExp !== 'number') {
        res.status(401).json({ message: 'Sessao invalida.' });
        return;
    }
    revokeTokenId(tokenId, tokenExp);
    res.status(204).send();
});
app.get('/profile/me', requireAuth, (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
        res.status(401).json({ message: 'Autenticacao obrigatoria.' });
        return;
    }
    const user = findUserById(userId);
    if (!user) {
        res.status(401).json({ message: 'Sessao invalida.' });
        return;
    }
    res.status(200).json({
        item: toSafeUserPayload(user),
    });
});
app.patch('/profile/me', requireAuth, (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
        res.status(401).json({ message: 'Autenticacao obrigatoria.' });
        return;
    }
    const currentUser = findUserById(userId);
    if (!currentUser) {
        res.status(401).json({ message: 'Sessao invalida.' });
        return;
    }
    const updatePayload = {};
    if (hasBodyField(req.body, 'fullName')) {
        const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
        if (!fullName) {
            res.status(422).json({ message: 'Nome completo invalido.' });
            return;
        }
        updatePayload.fullName = fullName;
    }
    if (hasBodyField(req.body, 'email')) {
        const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        if (!email || !isValidEmail(email)) {
            res.status(422).json({ message: 'E-mail invalido.' });
            return;
        }
        const existingUserWithEmail = findUserByEmail(email);
        if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
            res.status(409).json({ message: 'Ja existe um usuario com este e-mail.' });
            return;
        }
        updatePayload.email = email;
    }
    if (hasBodyField(req.body, 'phone')) {
        const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
        updatePayload.phone = phone;
    }
    if (hasBodyField(req.body, 'company')) {
        const company = typeof req.body?.company === 'string' ? req.body.company.trim() : '';
        if (!company) {
            res.status(422).json({ message: 'Empresa invalida.' });
            return;
        }
        updatePayload.company = company;
    }
    if (hasBodyField(req.body, 'jobTitle')) {
        const jobTitle = typeof req.body?.jobTitle === 'string' ? req.body.jobTitle.trim() : '';
        if (!jobTitle) {
            res.status(422).json({ message: 'Cargo invalido.' });
            return;
        }
        updatePayload.jobTitle = jobTitle;
    }
    if (hasBodyField(req.body, 'unit')) {
        const unit = typeof req.body?.unit === 'string' ? req.body.unit.trim() : '';
        if (!unit) {
            res.status(422).json({ message: 'Unidade invalida.' });
            return;
        }
        updatePayload.unit = unit;
    }
    if (hasBodyField(req.body, 'preferences')) {
        if (typeof req.body?.preferences !== 'object' || req.body.preferences === null) {
            res.status(422).json({ message: 'Preferencias invalidas.' });
            return;
        }
        const nextPreferences = {};
        if (hasBodyField(req.body.preferences, 'notifyAlerts')) {
            const parsedValue = parseBoolean(req.body.preferences.notifyAlerts);
            if (parsedValue === null) {
                res.status(422).json({ message: 'Preferencia notifyAlerts invalida.' });
                return;
            }
            nextPreferences.notifyAlerts = parsedValue;
        }
        if (hasBodyField(req.body.preferences, 'prioritizeFavorites')) {
            const parsedValue = parseBoolean(req.body.preferences.prioritizeFavorites);
            if (parsedValue === null) {
                res.status(422).json({ message: 'Preferencia prioritizeFavorites invalida.' });
                return;
            }
            nextPreferences.prioritizeFavorites = parsedValue;
        }
        if (hasBodyField(req.body.preferences, 'rememberLastView')) {
            const parsedValue = parseBoolean(req.body.preferences.rememberLastView);
            if (parsedValue === null) {
                res.status(422).json({ message: 'Preferencia rememberLastView invalida.' });
                return;
            }
            nextPreferences.rememberLastView = parsedValue;
        }
        if (hasBodyField(req.body.preferences, 'preferGridView')) {
            const parsedValue = parseBoolean(req.body.preferences.preferGridView);
            if (parsedValue === null) {
                res.status(422).json({ message: 'Preferencia preferGridView invalida.' });
                return;
            }
            nextPreferences.preferGridView = parsedValue;
        }
        if (Object.keys(nextPreferences).length > 0) {
            updatePayload.preferences = nextPreferences;
        }
    }
    if (Object.keys(updatePayload).length === 0) {
        res.status(422).json({ message: 'Nenhum campo valido foi enviado para atualizar o perfil.' });
        return;
    }
    const updatedUser = updateOwnUserProfile(userId, updatePayload);
    if (!updatedUser) {
        res.status(404).json({ message: 'Usuario nao encontrado.' });
        return;
    }
    res.status(200).json({ item: toSafeUserPayload(updatedUser) });
});
app.patch('/profile/me/password', requireAuth, (req, res) => {
    const userId = req.auth?.userId;
    if (!userId) {
        res.status(401).json({ message: 'Autenticacao obrigatoria.' });
        return;
    }
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (!currentPassword || !newPassword) {
        res.status(422).json({ message: 'Senha atual e nova senha sao obrigatorias.' });
        return;
    }
    if (newPassword.length < 6) {
        res.status(422).json({ message: 'A nova senha deve conter no minimo 6 caracteres.' });
        return;
    }
    if (currentPassword === newPassword) {
        res.status(422).json({ message: 'A nova senha precisa ser diferente da senha atual.' });
        return;
    }
    const result = changeOwnUserPassword(userId, currentPassword, newPassword);
    if (!result.ok) {
        if (result.reason === 'invalid-current-password') {
            res.status(422).json({ message: 'Senha atual invalida.' });
            return;
        }
        res.status(404).json({ message: 'Usuario nao encontrado.' });
        return;
    }
    res.status(204).send();
});
app.get('/cameras', optionalAuth, (req, res) => {
    const access = typeof req.query.access === 'string' ? normalizeValue(req.query.access) : '';
    const status = parseCameraStatus(req.query.status);
    const search = typeof req.query.search === 'string' ? normalizeValue(req.query.search) : '';
    const canViewRestricted = req.auth?.role === 'administrador' || req.auth?.role === 'cliente';
    let cameras = listCameras();
    if (!canViewRestricted) {
        cameras = cameras.filter((camera) => camera.access === 'public');
    }
    if (access === 'restricted' || access === 'restritas') {
        if (!canViewRestricted) {
            res.status(403).json({ message: 'Acesso negado para cameras restritas.' });
            return;
        }
        cameras = cameras.filter((camera) => camera.access === 'restricted');
    }
    else if (access === 'public' || access === 'publicas') {
        cameras = cameras.filter((camera) => camera.access === 'public');
    }
    if (status) {
        cameras = cameras.filter((camera) => camera.status === status);
    }
    if (search) {
        cameras = cameras.filter((camera) => {
            const value = normalizeValue([camera.name, camera.location, camera.unit, camera.category, camera.description].join(' '));
            return value.includes(search);
        });
    }
    res.status(200).json({ items: cameras });
});
app.post('/cameras', requireAuth, requireAdmin, (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const unit = typeof req.body?.unit === 'string' && req.body.unit.trim().length > 0 ? req.body.unit.trim() : 'Matriz';
    const image = typeof req.body?.image === 'string' ? req.body.image.trim() : '';
    const access = parseCameraAccess(req.body?.access);
    const status = parseCameraStatus(req.body?.status);
    const quality = parseQuality(req.body?.quality);
    if (!name || !location || !category || !access || !status || !quality) {
        res.status(422).json({
            message: 'Nome, local, categoria, acesso, status e qualidade sao obrigatorios para cadastrar camera.',
        });
        return;
    }
    const createdCamera = createCamera({
        name,
        location,
        category,
        description,
        access,
        status,
        quality,
        unit,
        image: image || undefined,
    });
    res.status(201).json({ item: createdCamera });
});
app.patch('/cameras/:cameraId', requireAuth, requireAdmin, (req, res) => {
    const cameraId = typeof req.params.cameraId === 'string' ? req.params.cameraId.trim() : '';
    if (!cameraId) {
        res.status(422).json({ message: 'Identificador da camera e obrigatorio.' });
        return;
    }
    const currentCamera = findCameraById(cameraId);
    if (!currentCamera) {
        res.status(404).json({ message: 'Camera nao encontrada.' });
        return;
    }
    const updatePayload = {};
    if (hasBodyField(req.body, 'name')) {
        const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
        if (!name) {
            res.status(422).json({ message: 'Nome da camera invalido.' });
            return;
        }
        updatePayload.name = name;
    }
    if (hasBodyField(req.body, 'location')) {
        const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
        if (!location) {
            res.status(422).json({ message: 'Local da camera invalido.' });
            return;
        }
        updatePayload.location = location;
    }
    if (hasBodyField(req.body, 'unit')) {
        const unit = typeof req.body?.unit === 'string' ? req.body.unit.trim() : '';
        if (!unit) {
            res.status(422).json({ message: 'Unidade da camera invalida.' });
            return;
        }
        updatePayload.unit = unit;
    }
    if (hasBodyField(req.body, 'category')) {
        const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
        if (!category) {
            res.status(422).json({ message: 'Categoria da camera invalida.' });
            return;
        }
        updatePayload.category = category;
    }
    if (hasBodyField(req.body, 'description')) {
        if (typeof req.body?.description !== 'string') {
            res.status(422).json({ message: 'Descricao da camera invalida.' });
            return;
        }
        updatePayload.description = req.body.description.trim();
    }
    if (hasBodyField(req.body, 'image')) {
        if (typeof req.body?.image !== 'string') {
            res.status(422).json({ message: 'Imagem da camera invalida.' });
            return;
        }
        updatePayload.image = req.body.image.trim();
    }
    if (hasBodyField(req.body, 'access')) {
        const parsedAccess = parseCameraAccess(req.body?.access);
        if (!parsedAccess) {
            res.status(422).json({ message: 'Acesso da camera invalido.' });
            return;
        }
        updatePayload.access = parsedAccess;
    }
    if (hasBodyField(req.body, 'status')) {
        const parsedStatus = parseCameraStatus(req.body?.status);
        if (!parsedStatus) {
            res.status(422).json({ message: 'Status da camera invalido.' });
            return;
        }
        updatePayload.status = parsedStatus;
    }
    if (hasBodyField(req.body, 'quality')) {
        const parsedQuality = parseQuality(req.body?.quality);
        if (!parsedQuality) {
            res.status(422).json({ message: 'Qualidade da camera invalida.' });
            return;
        }
        updatePayload.quality = parsedQuality;
    }
    if (Object.keys(updatePayload).length === 0) {
        res.status(422).json({ message: 'Nenhum campo valido foi enviado para atualizar a camera.' });
        return;
    }
    const updatedCamera = updateCameraByAdmin(cameraId, updatePayload);
    if (!updatedCamera) {
        res.status(404).json({ message: 'Camera nao encontrada.' });
        return;
    }
    res.status(200).json({ item: updatedCamera });
});
app.delete('/cameras/:cameraId', requireAuth, requireAdmin, (req, res) => {
    const cameraId = typeof req.params.cameraId === 'string' ? req.params.cameraId.trim() : '';
    if (!cameraId) {
        res.status(422).json({ message: 'Identificador da camera e obrigatorio.' });
        return;
    }
    const deleted = removeCameraByAdmin(cameraId);
    if (!deleted) {
        res.status(404).json({ message: 'Camera nao encontrada.' });
        return;
    }
    res.status(204).send();
});
app.get('/users', requireAuth, requireAdmin, (_req, res) => {
    res.status(200).json({ items: listUsers() });
});
app.post('/users', requireAuth, requireAdmin, (req, res) => {
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const parsedRole = parseRole(req.body?.role ?? req.body?.profile);
    const parsedStatus = parseUserStatus(req.body?.status);
    const parsedAccess = parseUserAccess(req.body?.access);
    const unit = typeof req.body?.unit === 'string' && req.body.unit.trim().length > 0 ? req.body.unit.trim() : 'Matriz';
    if (!fullName || !email || !password || !parsedRole || !parsedStatus) {
        res.status(422).json({
            message: 'Nome, e-mail, senha, perfil e status sao obrigatorios para cadastrar usuario.',
        });
        return;
    }
    if (!isValidEmail(email)) {
        res.status(422).json({ message: 'E-mail invalido.' });
        return;
    }
    if (password.length < 6) {
        res.status(422).json({ message: 'A senha deve conter no minimo 6 caracteres.' });
        return;
    }
    if (findUserByEmail(email)) {
        res.status(409).json({ message: 'Ja existe um usuario com este e-mail.' });
        return;
    }
    const defaultAccess = parsedRole === 'administrador' ? 'Administrador' : 'Area restrita';
    const createdUser = createUserByAdmin({
        fullName,
        email,
        password,
        role: parsedRole,
        status: parsedStatus,
        access: parsedAccess ?? defaultAccess,
        unit,
    });
    res.status(201).json({ item: createdUser });
});
app.patch('/users/:userId', requireAuth, requireAdmin, (req, res) => {
    const userId = typeof req.params.userId === 'string' ? req.params.userId.trim() : '';
    if (!userId) {
        res.status(422).json({ message: 'Identificador do usuario e obrigatorio.' });
        return;
    }
    const currentUser = findUserById(userId);
    if (!currentUser) {
        res.status(404).json({ message: 'Usuario nao encontrado.' });
        return;
    }
    const updatePayload = {};
    if (hasBodyField(req.body, 'fullName')) {
        const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
        if (!fullName) {
            res.status(422).json({ message: 'Nome completo invalido.' });
            return;
        }
        updatePayload.fullName = fullName;
    }
    if (hasBodyField(req.body, 'email')) {
        const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        if (!email || !email.includes('@')) {
            res.status(422).json({ message: 'E-mail invalido.' });
            return;
        }
        const existingUserWithEmail = findUserByEmail(email);
        if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
            res.status(409).json({ message: 'Ja existe um usuario com este e-mail.' });
            return;
        }
        updatePayload.email = email;
    }
    if (hasBodyField(req.body, 'password')) {
        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        if (!password || password.length < 6) {
            res.status(422).json({ message: 'A senha deve conter no minimo 6 caracteres.' });
            return;
        }
        updatePayload.password = password;
    }
    const roleFieldSent = hasBodyField(req.body, 'role') || hasBodyField(req.body, 'profile');
    if (roleFieldSent) {
        const parsedRole = parseRole(req.body?.role ?? req.body?.profile);
        if (!parsedRole) {
            res.status(422).json({ message: 'Perfil de usuario invalido.' });
            return;
        }
        updatePayload.role = parsedRole;
    }
    if (hasBodyField(req.body, 'status')) {
        const parsedStatus = parseUserStatus(req.body?.status);
        if (!parsedStatus) {
            res.status(422).json({ message: 'Status do usuario invalido.' });
            return;
        }
        updatePayload.status = parsedStatus;
    }
    if (hasBodyField(req.body, 'access')) {
        const parsedAccess = parseUserAccess(req.body?.access);
        if (!parsedAccess) {
            res.status(422).json({ message: 'Nivel de acesso invalido.' });
            return;
        }
        updatePayload.access = parsedAccess;
    }
    if (hasBodyField(req.body, 'unit')) {
        const unit = typeof req.body?.unit === 'string' ? req.body.unit.trim() : '';
        if (!unit) {
            res.status(422).json({ message: 'Unidade do usuario invalida.' });
            return;
        }
        updatePayload.unit = unit;
    }
    const isLastAdministrator = currentUser.role === 'administrador' && countAdministrators() <= 1;
    if (isLastAdministrator) {
        const willLoseAdminRole = updatePayload.role === 'cliente';
        const willBeInactive = updatePayload.status === 'Inativo';
        const willLoseAdminAccess = updatePayload.access === 'Sem acesso';
        if (willLoseAdminRole || willBeInactive || willLoseAdminAccess) {
            res.status(422).json({ message: 'A plataforma precisa manter pelo menos um administrador ativo.' });
            return;
        }
    }
    if (updatePayload.role === 'administrador' && !updatePayload.access) {
        updatePayload.access = 'Administrador';
    }
    if (updatePayload.role === 'cliente') {
        if (updatePayload.access === 'Administrador') {
            res.status(422).json({ message: 'Usuario cliente nao pode receber acesso de administrador.' });
            return;
        }
        if (!updatePayload.access && currentUser.access === 'Administrador') {
            updatePayload.access = 'Area restrita';
        }
    }
    if (Object.keys(updatePayload).length === 0) {
        res.status(422).json({ message: 'Nenhum campo valido foi enviado para atualizar o usuario.' });
        return;
    }
    const updatedUser = updateUserByAdmin(userId, updatePayload);
    if (!updatedUser) {
        res.status(404).json({ message: 'Usuario nao encontrado.' });
        return;
    }
    res.status(200).json({ item: updatedUser });
});
app.delete('/users/:userId', requireAuth, requireAdmin, (req, res) => {
    const userId = typeof req.params.userId === 'string' ? req.params.userId.trim() : '';
    if (!userId) {
        res.status(422).json({ message: 'Identificador do usuario e obrigatorio.' });
        return;
    }
    const currentUser = findUserById(userId);
    if (!currentUser) {
        res.status(404).json({ message: 'Usuario nao encontrado.' });
        return;
    }
    if (req.auth?.userId === userId) {
        res.status(422).json({ message: 'Nao e permitido remover o proprio usuario administrador.' });
        return;
    }
    if (currentUser.role === 'administrador' && countAdministrators() <= 1) {
        res.status(422).json({ message: 'A plataforma precisa manter pelo menos um administrador ativo.' });
        return;
    }
    const deleted = removeUserByAdmin(userId);
    if (!deleted) {
        res.status(404).json({ message: 'Usuario nao encontrado.' });
        return;
    }
    res.status(204).send();
});
app.use((_req, res) => {
    res.status(404).json({ message: 'Rota nao encontrada.' });
});
export { app };
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
    app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`[ayel-cams-api] listening on http://localhost:${port}`);
    });
}
