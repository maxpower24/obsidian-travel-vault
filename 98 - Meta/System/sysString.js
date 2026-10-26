/**
 * sysString.js
 * Utility for common string operations used across domains.
 *
 * STUB — to be fully implemented as needs arise.
 */

module.exports = (tp) => {

    /**
     * Sanitise a string for use as a vault folder or file name.
     * Removes characters that Obsidian or the OS would reject.
     *
     * @param {string} input
     * @returns {string}
     */
    function sanitiseFileName(input) {
        // Obsidian disallows: * " \ / < > : | ?
        return input.replace(/[*"\\/<>:|?]/g, "").trim();
    }

    return {
        sanitiseFileName,
    };

};