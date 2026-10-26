<%*
/**
- Trip Template
- Triggers the travel orchestrator to:
- - Prompt for a trip name
- - Check uniqueness within the Trips folder
- - Create the trip folder
- - Move and rename this note into the new folder as the trip dashboard

- CONFIG_PATH points to the travel domain config note.
- Update this path here if the config file is ever relocated within the vault or if you decide to use an alternative folder structure or naming convention.
*/

const CONFIG_PATH = "98 - Meta/System/Travel/_config.md";

const travel = tp.user.travelOrchestrator(tp);

await travel.createNewTrip(CONFIG_PATH);
%>