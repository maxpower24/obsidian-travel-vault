/**
 * travelOrchestrator.js
 * Primary orchestrator for all travel-related note creation and management.
 * Delegates config loading, file system operations, notices, and string
 * handling to the appropriate system utility scripts.
 */

module.exports = (tp) => {

    const config   = tp.user.sysConfig(tp);
    const fs       = tp.user.sysFs(tp);
    const notice   = tp.user.sysNotice(tp);
    const str      = tp.user.sysString(tp);
    const fm       = tp.user.sysFrontmatter(tp);
    const geo      = tp.user.sysGeo(tp);

    /**
     * Create a new trip.
     *
     * Steps:
     * 1. Load travel config to determine the Trips folder path.
     * 2. Prompt the user for a trip name.
     * 3. Check the name is unique within the Trips folder — re-prompt if not.
     * 4. Create the trip folder inside the Trips folder.
     * 5. Create the trip dashboard note inside that folder (same name as folder).
     * 6. Move the currently active template file into the new folder and rename it.
     *
     * @param {string} configPath - Vault-relative path to the travel config note
     */
    async function createNewTrip(configPath) {

        // --- 1. Load config ---
        const travelConfig = config.loadConfig(configPath);
        const travelRoot   = travelConfig["Travel Root"];
        const tripsFolder  = `${travelRoot}/Trips`;

        // --- 2 & 3. Prompt for trip name, re-prompt if not unique ---
        let tripName;

        while (true) {
            const input = await tp.system.prompt("Trip Name", "", true);

            // User cancelled the prompt — abort silently
            if (input === null) {
                return;
            }

            const sanitised = str.sanitiseFileName(input);

            if (sanitised.length === 0) {
                notice.show("Trip name cannot be empty or contain only invalid characters. Please try again.");
                continue;
            }

            const candidatePath = `${tripsFolder}/${sanitised}`;

            if (fs.folderExists(candidatePath)) {
                notice.show(`A trip named "${sanitised}" already exists. Please choose a different name.`);
                continue;
            }

            tripName = sanitised;
            break;
        }

        // --- 4. Create trip folder ---
        const tripFolderPath = `${tripsFolder}/${tripName}`;
        await fs.createFolder(tripFolderPath);

        // --- 5 & 6. Move and rename the active template file into the new folder ---
        // The template file is currently open as tp.file.path.
        // Renaming it via fileManager moves it and updates any vault links.
        const tripNotePath = `${tripFolderPath}/${tripName}.md`;
        await fs.moveNote(tp.app.vault.getAbstractFileByPath(tp.file.path(true)), tripNotePath);

        notice.show(`Trip "${tripName}" created.`);
    }

    /**
     * PROOF OF CONCEPT — temporary, to be replaced by the real place import.
     *
     * For every note in the Places Inbox folder:
     * 1. Read its Map View `location`.
     * 2. Reverse geocode it with Google (key read from Map View's settings).
     * 3. Write country / region / city / area into its frontmatter.
     *
     * Notes are not moved or renamed. Failures are reported per note and skipped.
     *
     * @param {string} configPath - Vault-relative path to the travel config note
     */
    async function pocPlacesInbox(configPath) {

        const travelConfig = config.loadConfig(configPath);
        const inboxFolder  = travelConfig["Places Inbox"];

        if (!inboxFolder) {
            throw new Error(`travelOrchestrator: "Places Inbox" is not set in ${configPath}.`);
        }

        const notes = fs.getNotesInFolder(inboxFolder);

        if (notes.length === 0) {
            notice.show(`No notes found in "${inboxFolder}".`);
            return;
        }

        let processed = 0;
        let failed    = 0;

        for (const file of notes) {
            try {
                const data   = fm.getFrontmatter(file.path);
                const coords = geo.parseLatLng(data ? data.location : null);

                if (!coords) {
                    throw new Error("no valid `location` in frontmatter");
                }

                const results = await geo.reverseGeocode(coords.lat, coords.lng);
                const areas   = geo.parseAdminAreas(results);

                await fm.setFields(file.path, {
                    country:      areas.country,
                    country_code: areas.countryCode,
                    region:       areas.region,
                    city:         areas.city,
                    area:         areas.area,
                });

                processed++;
            } catch (e) {
                failed++;
                console.error(`travelOrchestrator: failed on ${file.path}`, e);
                notice.show(`Failed: ${file.basename} (${e.message})`, 8000);
            }
        }

        notice.show(`Places POC: ${processed} processed, ${failed} failed.`);
    }

    return {
        createNewTrip,
        pocPlacesInbox,
    };

};