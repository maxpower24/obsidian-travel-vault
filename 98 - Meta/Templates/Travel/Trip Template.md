<%*
/**
 * Trip dashboard template
 * - Prompt for trip name
 * - Check for uniqueness
 * - Create folder
 * - Move and rename file
 */

const CONFIG_PATH = "98 - Meta/System/Travel/_config.md"

const tripName = await tp.user.travelOrchestrator(tp).createNewTrip();
tR += tripName;

const af = tp.app.vault.getAbstractFileByPath(CONFIG_PATH);
const conf = tp.app.metadataCache.getFileCache(af).frontmatter;
tR += conf
%>
