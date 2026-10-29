<%*
/**
 * Trip Template — run by the "New Trip" button (Meta Bind templaterCreateNote in the Trips folder).
 * Asks for the trip name and dates, moves this new note to <Trips>/<Name>/<Name>.md, creates the
 * packing note and the trip's documents folder, and writes the trip note.
 * The content is returned through tR because Templater writes the template's output into the new note.
 */
const CONFIG_PATH = "98 - Meta/System/Travel/_config.md";
tR += await tp.user.travelOrchestrator(tp).createNewTrip(CONFIG_PATH);
%>
