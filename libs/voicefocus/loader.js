// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadWorker = void 0;
const fetch_js_1 = require("./fetch.js");
const WORKER_FETCH_OPTIONS = {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
};
const loadWorker = (workerURL, name, fetchBehavior, logger) => {
    logger === null || logger === void 0 ? void 0 : logger.debug(`Loading ${name} worker from ${workerURL}.`);
    let workerURLIsSameOrigin = false;
    try {
        workerURLIsSameOrigin = self.origin === (new URL(workerURL)).origin;
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.error('Could not compare origins.', e);
    }
    if (workerURLIsSameOrigin) {
        const workerURLWithQuery = (0, fetch_js_1.withQueryString)(workerURL, fetchBehavior);
        return Promise.resolve(new Worker(workerURLWithQuery, { name }));
    }
    return (0, fetch_js_1.fetchWithBehavior)(workerURL, WORKER_FETCH_OPTIONS, fetchBehavior).then((res) => {
        if (res.ok) {
            return res.blob()
                .then((blob) => new Worker(window.URL.createObjectURL(blob)));
        }
        throw new Error('Fetch failed.');
    });
};
exports.loadWorker = loadWorker;
