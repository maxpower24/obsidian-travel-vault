/**
 * sysNotice.js
 * Utility for displaying Obsidian notices to the user.
 * Wraps the Obsidian Notice API to provide a consistent interface
 * and allow for future extension (e.g. notice types, durations).
 *
 * STUB — to be fully implemented.
 */

module.exports = (tp) => {

    /**
     * Display a notice to the user.
     *
     * @param {string} message  - The message to display
     * @param {number} duration - Duration in milliseconds (default: 4000)
     */
    function show(message, duration = 4000) {
        new Notice(message, duration);
    }

    return {
        show,
    };

};