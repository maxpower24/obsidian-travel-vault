<%*
/**
 * Trip Refresh — run by the "Refresh Trip" button on a trip note (Meta Bind runTemplaterFile).
 * Rewrites the trip note's layout, keeping everything you entered, and offers the one-time cover
 * picker once the trip has a first stay.
 */
const CONFIG_PATH = "98 - Meta/System/Travel/_config.md";
try { await tp.user.travelOrchestrator(tp).refreshTrip(CONFIG_PATH); }
catch (e) { console.error("Trip Refresh failed", e); new Notice(`Trip Refresh failed: ${e.message}`, 8000); }
%>
