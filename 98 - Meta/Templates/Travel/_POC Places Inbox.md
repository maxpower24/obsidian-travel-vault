<%*
/**
 * PROOF OF CONCEPT — run via "Templater: Insert Travel/_POC Places Inbox".
 * Adds country / region / city / area to every note in the Places Inbox.
 * Outputs nothing into the note it is inserted into.
 */
const CONFIG_PATH = "98 - Meta/System/Travel/_config.md";
await tp.user.travelOrchestrator(tp).pocPlacesInbox(CONFIG_PATH);
%>
