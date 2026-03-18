const revokedTokenExpirations = new Map();
function cleanupRevokedTokens(nowSeconds) {
    revokedTokenExpirations.forEach((exp, tokenId) => {
        if (exp <= nowSeconds) {
            revokedTokenExpirations.delete(tokenId);
        }
    });
}
export function revokeTokenId(tokenId, exp) {
    revokedTokenExpirations.set(tokenId, exp);
}
export function isTokenIdRevoked(tokenId) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    cleanupRevokedTokens(nowSeconds);
    const expiration = revokedTokenExpirations.get(tokenId);
    if (!expiration) {
        return false;
    }
    return expiration > nowSeconds;
}
export function clearRevokedTokenStore() {
    revokedTokenExpirations.clear();
}
