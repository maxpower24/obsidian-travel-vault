/**
 * sysFrontmatter.js
 * Generic utility for reading and writing frontmatter on any note in the vault.
 * Has no knowledge of what the frontmatter data means — purely structural.
 */

module.exports = (tp) => {

    /**
     * Read and return the frontmatter of a note at the given vault path.
     * Returns null if the file does not exist or has no frontmatter.
     *
     * @param {string} filePath - Vault-relative path to the note (e.g. "98 - Meta/System/Travel/_config.md")
     * @returns {object|null} Frontmatter object, or null
     */
    function getFrontmatter(filePath) {
        const file = tp.app.vault.getAbstractFileByPath(filePath);

        if (!file) {
            return null;
        }

        const cache = tp.app.metadataCache.getFileCache(file);

        if (!cache || !cache.frontmatter) {
            return null;
        }

        return cache.frontmatter;
    }

    /**
     * Set (add or overwrite) frontmatter fields on a note at the given vault path.
     * Uses Obsidian's processFrontMatter so the YAML stays valid and other fields are untouched.
     *
     * @param {string} filePath - Vault-relative path to the note
     * @param {object} fields   - Key/value pairs to write
     * @returns {Promise<void>}
     */
    async function setFields(filePath, fields) {
        const file = tp.app.vault.getAbstractFileByPath(filePath);

        if (!file) {
            throw new Error(`sysFrontmatter: No note found at "${filePath}".`);
        }

        await tp.app.fileManager.processFrontMatter(file, (frontmatter) => {
            for (const [key, value] of Object.entries(fields)) {
                frontmatter[key] = value;
            }
        });
    }

    return {
        getFrontmatter,
        setFields,
    };

};