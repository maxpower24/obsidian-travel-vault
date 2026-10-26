/**
 * sysGeo.js
 * Generic geography utilities backed by Google's APIs.
 * Not travel-specific — any domain needing "where is this?" can use it.
 *
 * The Google API key is read from Obsidian's Keychain (via sysSecrets).
 * If that secret is missing, it falls back to Map View's own settings.
 */

module.exports = (tp) => {

    const http    = tp.user.sysHttp(tp);
    const plugins = tp.user.sysPlugins(tp);
    const secrets = tp.user.sysSecrets(tp);

    const MAP_VIEW_ID       = "obsidian-map-view";
    const DEFAULT_SECRET_ID = "google-places";   // TODO: pass from domain config

    /**
     * Return the Google API key.
     * 1. Obsidian Keychain secret (preferred, documented API).
     * 2. Fallback: Map View's settings (undocumented app.plugins access).
     *
     * @param {string} [secretId] - Keychain secret ID
     * @returns {string}
     */
    function getGoogleApiKey(secretId = DEFAULT_SECRET_ID) {
        if (secrets.hasSecret(secretId)) {
            return secrets.getSecret(secretId);
        }

        const key = plugins.getPluginSettings(MAP_VIEW_ID).geocodingApiKey;

        if (!key) {
            throw new Error(`sysGeo: No Google API key. Add a "${secretId}" secret in Settings → Keychain.`);
        }

        return key;
    }

    /**
     * Parse a location value into numeric coordinates.
     * Map View stores front matter locations as a "lat,lng" string;
     * a [lat, lng] array is also accepted.
     *
     * @param {string|Array} value
     * @returns {{lat: number, lng: number}|null} null if the value isn't a valid location
     */
    function parseLatLng(value) {
        if (value === null || value === undefined) {
            return null;
        }

        const parts = Array.isArray(value)
            ? value.map(Number)
            : String(value).split(",").map((s) => parseFloat(s.trim()));

        if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
            return null;
        }

        return { lat: parts[0], lng: parts[1] };
    }

    /**
     * Reverse geocode coordinates with the Google Geocoding API.
     * Requires the Geocoding API to be enabled on the key.
     *
     * @param {number} lat
     * @param {number} lng
     * @returns {Promise<Array>} Google "results" array, most specific first
     */
    async function reverseGeocode(lat, lng) {
        const key = getGoogleApiKey();
        const url = "https://maps.googleapis.com/maps/api/geocode/json"
            + `?latlng=${lat},${lng}&language=en&key=${encodeURIComponent(key)}`;

        const response = await http.requestJson({ url });

        if (!response.ok || !response.json) {
            throw new Error(`sysGeo: Reverse geocode request failed (HTTP ${response.status}).`);
        }

        const status = response.json.status;

        if (status !== "OK") {
            const detail = response.json.error_message ? `: ${response.json.error_message}` : "";
            throw new Error(`sysGeo: Reverse geocode returned ${status}${detail}`);
        }

        return response.json.results;
    }

    /**
     * First address component of the given type across all results
     * (results are ordered most specific first).
     */
    function findComponent(results, type) {
        for (const result of results) {
            for (const component of result.address_components) {
                if (component.types.includes(type)) {
                    return component;
                }
            }
        }
        return null;
    }

    /**
     * All distinct long names of the given component type, in result order.
     */
    function findAllNames(results, type) {
        const names = [];
        for (const result of results) {
            for (const component of result.address_components) {
                if (component.types.includes(type) && !names.includes(component.long_name)) {
                    names.push(component.long_name);
                }
            }
        }
        return names;
    }

    /**
     * Derive the everyday administrative areas from reverse geocode results.
     *
     * Rule (validated against test data from JP, AU, GB, FR, KR):
     *   city = colloquial_area if present (e.g. Tokyo, Melbourne), else locality,
     *          else postal_town.
     *   area = when a colloquial area exists: the first locality that isn't the
     *          city (e.g. Shibuya, Fitzroy); otherwise sublocality_level_1
     *          (e.g. Fushimi Ward, Kensington).
     *
     * @param {Array} results - Output of reverseGeocode()
     * @returns {{country: ?string, countryCode: ?string, region: ?string, city: ?string, area: ?string}}
     */
    function parseAdminAreas(results) {
        const country    = findComponent(results, "country");
        const region     = findComponent(results, "administrative_area_level_1");
        const colloquial = findComponent(results, "colloquial_area");
        const localities = findAllNames(results, "locality");

        let city = null;
        let area = null;

        if (colloquial) {
            city = colloquial.long_name;
            area = localities.find((name) => name !== city) ?? null;
        } else {
            const postalTown = findComponent(results, "postal_town");
            city = localities[0] ?? (postalTown ? postalTown.long_name : null);

            const sublocality = findComponent(results, "sublocality_level_1");
            area = sublocality ? sublocality.long_name : null;
        }

        return {
            country:     country ? country.long_name : null,
            countryCode: country ? country.short_name : null,
            region:      region ? region.long_name : null,
            city,
            area,
        };
    }

    return {
        getGoogleApiKey,
        parseLatLng,
        reverseGeocode,
        parseAdminAreas,
    };

};
