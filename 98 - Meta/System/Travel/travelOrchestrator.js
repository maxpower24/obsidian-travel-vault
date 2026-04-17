/**
 * Trip dashboard template
 * - Load config
 * - Prompt for trip name
 * - Check for uniqueness
 * - Create folder
 * - Move and rename file
 */

module.exports = (tp) => {
    async function createNewTrip(configPath) {
        const configFile = tp.app.vault.getAbstractFileByPath(configPath);
        const config = tp.app.metadataCache.getFileCache(configFile).frontmatter;
        const travelRoot = config["Travel Root"];

        const unique = true;
        
        while (!unique) {
            const tripName = await tp.system.prompt("Trip Name", null, true);
            return tripName;
        }
    }

    return {
        createNewTrip,
    }
}