/**
 * sysHttp.js
 * Generic utility for HTTP requests from inside Obsidian.
 * Wraps Obsidian's requestUrl (exposed by Templater as tp.obsidian.requestUrl),
 * which is not subject to browser CORS restrictions.
 * Purely transport — no knowledge of any particular API.
 */

module.exports = (tp) => {

    /**
     * Send a request and return the parsed JSON response.
     * Never throws on HTTP error status — callers check `ok` / `status`.
     *
     * @param {object} options
     * @param {string} options.url               - Full request URL
     * @param {string} [options.method="GET"]    - HTTP method
     * @param {object} [options.headers={}]      - Request headers
     * @param {object|null} [options.body=null]  - Object to send as a JSON body
     * @returns {Promise<{ok: boolean, status: number, json: (object|null), text: string}>}
     */
    async function requestJson({ url, method = "GET", headers = {}, body = null }) {
        const params = { url, method, headers, throw: false };

        if (body !== null) {
            params.contentType = "application/json";
            params.body = JSON.stringify(body);
        }

        const response = await tp.obsidian.requestUrl(params);

        // response.json throws if the body isn't valid JSON
        let json = null;
        try {
            json = response.json;
        } catch (e) {
            json = null;
        }

        return {
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            json,
            text: response.text,
        };
    }

    return {
        requestJson,
    };

};
