/**
 * sysPlugins.js
 * Generic utility for reading other installed Obsidian plugins.
 *
 * Note: app.plugins is not part of Obsidian's documented API. It is widely
 * used and stable in practice, but could change in a future Obsidian release.
 * Keeping all access here means only this file needs fixing if it does.
 */

module.exports = (tp) => {

    /**
     * Return a loaded plugin instance.
     * Throws if the plugin is not installed or not enabled.
     *
     * @param {string} pluginId - Plugin id from its manifest (e.g. "obsidian-map-view")
     * @returns {object} Plugin instance
     */
    function getPlugin(pluginId) {
        const plugin = tp.app.plugins?.plugins?.[pluginId];

        if (!plugin) {
            throw new Error(`sysPlugins: Plugin "${pluginId}" is not installed or not enabled.`);
        }

        return plugin;
    }

    /**
     * Return a plugin's in-memory settings object.
     *
     * @param {string} pluginId - Plugin id from its manifest
     * @returns {object} Settings object
     */
    function getPluginSettings(pluginId) {
        const settings = getPlugin(pluginId).settings;

        if (!settings) {
            throw new Error(`sysPlugins: Plugin "${pluginId}" has no readable settings.`);
        }

        return settings;
    }

    return {
        getPlugin,
        getPluginSettings,
    };

};
