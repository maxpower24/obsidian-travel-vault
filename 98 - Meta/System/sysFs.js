/**
 * sysFs.js
 * Utility for vault file system operations.
 * Handles folder creation, note creation, and existence checks.
 * Purely structural — no knowledge of note content or domain logic.
 */

module.exports = (tp) => {

    /**
     * Check whether a folder exists at the given vault path.
     *
     * @param {string} folderPath - Vault-relative folder path
     * @returns {boolean}
     */
    function folderExists(folderPath) {
        const folder = tp.app.vault.getAbstractFileByPath(folderPath);
        return folder !== null && folder.children !== undefined;
    }

    /**
     * Check whether a note exists at the given vault path.
     *
     * @param {string} notePath - Vault-relative path including .md extension
     * @returns {boolean}
     */
    function noteExists(notePath) {
        const file = tp.app.vault.getAbstractFileByPath(notePath);
        return file !== null && file.children === undefined;
    }

    /**
     * Create a folder at the given vault path.
     * Does nothing if the folder already exists.
     *
     * @param {string} folderPath - Vault-relative folder path to create
     * @returns {Promise<void>}
     */
    async function createFolder(folderPath) {
        if (!folderExists(folderPath)) {
            await tp.app.vault.createFolder(folderPath);
        }
    }

    /**
     * Create a new note at the given vault path with the given content.
     * Returns the created TFile.
     *
     * @param {string} notePath  - Vault-relative path including .md extension
     * @param {string} content   - Initial content for the note (can be empty string)
     * @returns {Promise<TFile>}
     */
    async function createNote(notePath, content = "") {
        return await tp.app.vault.create(notePath, content);
    }

    /**
     * Move and/or rename an existing note to a new vault path.
     * Uses Obsidian's fileManager so that links are updated automatically.
     *
     * @param {TFile} file        - The TFile object to move
     * @param {string} newPath    - New vault-relative path including .md extension
     * @returns {Promise<void>}
     */
    async function moveNote(file, newPath) {
        await tp.app.fileManager.renameFile(file, newPath);
    }

    /**
     * Return the Markdown notes directly inside a folder (not recursive).
     * Returns an empty array if the folder doesn't exist.
     *
     * @param {string} folderPath - Vault-relative folder path
     * @returns {TFile[]}
     */
    function getNotesInFolder(folderPath) {
        const folder = tp.app.vault.getAbstractFileByPath(folderPath);

        if (!folder || folder.children === undefined) {
            return [];
        }

        return folder.children.filter((child) => child.children === undefined && child.extension === "md");
    }

    return {
        folderExists,
        noteExists,
        createFolder,
        createNote,
        moveNote,
        getNotesInFolder,
    };

};