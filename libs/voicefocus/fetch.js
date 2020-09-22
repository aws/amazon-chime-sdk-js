"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidRevisionID = exports.isValidAssetGroup = exports.addQueryParams = exports.withQueryString = exports.withRequestHeaders = exports.fetchWithBehavior = void 0;
function fetchWithBehavior(url, init, fetchBehavior) {
    if (!fetchBehavior) {
        return fetch(url, init);
    }
    const withQuery = withQueryString(url, fetchBehavior);
    const withHeaders = withRequestHeaders(init, fetchBehavior);
    return fetch(withQuery, withHeaders);
}
exports.fetchWithBehavior = fetchWithBehavior;
function withRequestHeaders(init, fetchBehavior) {
    if (!(fetchBehavior === null || fetchBehavior === void 0 ? void 0 : fetchBehavior.headers)) {
        return init;
    }
    if (!init) {
        return {
            headers: fetchBehavior.headers,
        };
    }
    return Object.assign(Object.assign({}, init), { headers: Object.assign(Object.assign({}, init.headers || {}), fetchBehavior.headers) });
}
exports.withRequestHeaders = withRequestHeaders;
function withQueryString(url, fetchBehavior) {
    if (!(fetchBehavior === null || fetchBehavior === void 0 ? void 0 : fetchBehavior.escapedQueryString)) {
        return url;
    }
    const hasQuery = url.lastIndexOf('?') !== -1;
    return `${url}${hasQuery ? '&' : '?'}${fetchBehavior.escapedQueryString}`;
}
exports.withQueryString = withQueryString;
function addQueryParams(fetchBehavior, queryParams) {
    const keys = Object.keys(queryParams);
    if (!keys.length) {
        return fetchBehavior;
    }
    const params = new URLSearchParams(fetchBehavior === null || fetchBehavior === void 0 ? void 0 : fetchBehavior.escapedQueryString);
    for (const key of keys) {
        params.append(key, queryParams[key]);
    }
    return Object.assign(Object.assign({}, fetchBehavior), { escapedQueryString: params.toString() });
}
exports.addQueryParams = addQueryParams;
function isValidAssetGroup(assetGroup) {
    return !!assetGroup && /^[-.a-zA-Z0-9]+$/.test(assetGroup);
}
exports.isValidAssetGroup = isValidAssetGroup;
function isValidRevisionID(revisionID) {
    return !!revisionID && /^[123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]{22}$/.test(revisionID);
}
exports.isValidRevisionID = isValidRevisionID;
