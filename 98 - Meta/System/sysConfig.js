/**
 * sysConfig.js
 * Utility for loading domain config files.
 * Knows how to interpret a config note — delegates raw frontmatter reading to sysFrontmatter.
 * Domain orchestrators call this with a config path and receive a parsed config object.
 */

module.exports = (tp) => {

    const frontmatter = tp.user.sysFrontmatter(tp);

    /**
     * Load a config file at the given vault path and return its frontmatter as a config object.
     * Throws a descriptive error if the file is missing or has no frontmatter,
     * as a missing config is always a setup problem that should surface loudly.
     *
     * @param {string} configPath - Vault-relative path to the config note
     * @returns {object} Config object derived from the note's frontmatter
     */
    function loadConfig(configPath) {
        const config = frontmatter.getFrontmatter(configPath);

        if (!config) {
            throw new Error(
                `sysConfig: Could not load config at "${configPath}". ` +
                `Check that the file exists and contains frontmatter.`
            );
        }

        return config;
    }

    return {
        loadConfig,
    };

};