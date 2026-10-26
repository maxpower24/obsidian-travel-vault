/**
 * sysSecrets.js
 * Generic utility for reading secrets (API keys) from Obsidian's Keychain
 * (Settings → Keychain), via the public app.secretStorage API (Obsidian 1.11.4+).
 * Secret IDs are lowercase letters, numbers and dashes.
 * Values are never written to vault files.
 */

module.exports = (tp) => {

    function getStore() {
        const store = tp.app.secretStorage;

        if (!store) {
            throw new Error("sysSecrets: Obsidian Keychain is not available (requires Obsidian 1.11.4 or later).");
        }

        return store;
    }

    /**
     * Whether a secret with this ID exists and is non-empty.
     *
     * @param {string} id - Secret ID (e.g. "google-places")
     * @returns {boolean}
     */
    function hasSecret(id) {
        if (!tp.app.secretStorage) {
            return false;
        }
        const value = tp.app.secretStorage.getSecret(id);
        return typeof value === "string" && value.length > 0;
    }

    /**
     * Return a secret's value. Throws with setup instructions if it's missing.
     *
     * @param {string} id - Secret ID
     * @returns {string}
     */
    function getSecret(id) {
        const value = getStore().getSecret(id);

        if (typeof value !== "string" || value.length === 0) {
            throw new Error(`sysSecrets: No secret "${id}" found. Add it in Settings → Keychain.`);
        }

        return value;
    }

    /**
     * List the IDs (not values) of all stored secrets.
     *
     * @returns {string[]}
     */
    function listSecretIds() {
        return getStore().listSecrets();
    }

    return {
        hasSecret,
        getSecret,
        listSecretIds,
    };

};
