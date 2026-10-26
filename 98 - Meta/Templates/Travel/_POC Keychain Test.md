<%*
/**
 * PROOF OF CONCEPT — Keychain + REST Countries v5 test.
 * Writes results (never key values) to _scripts/keychain-test-output.json
 */
const OUT = "_scripts/keychain-test-output.json";
const secrets = tp.user.sysSecrets(tp);
const http    = tp.user.sysHttp(tp);
const geo     = tp.user.sysGeo(tp);
const result  = {};

try {
    result.secretIds    = secrets.listSecretIds();
    result.hasGoogle    = secrets.hasSecret("google-places");
    result.hasCountries = secrets.hasSecret("rest-countries");

    // Google key from Keychain -> reverse geocode Shibuya Crossing
    const geoResults = await geo.reverseGeocode(35.659482, 139.7005596);
    result.reverseGeocode = geo.parseAdminAreas(geoResults);

    // REST Countries v5 by alpha-2 code
    const key = secrets.getSecret("rest-countries");
    result.restCountries = {};
    for (const code of ["JP", "AU"]) {
        const r = await http.requestJson({
            url: `https://api.restcountries.com/countries/v5/codes.alpha_2/${code}`,
            headers: { Authorization: `Bearer ${key}` },
        });
        result.restCountries[code] = { status: r.status, json: r.json };
    }
} catch (e) {
    result.error = e.message;
}

await tp.app.vault.adapter.write(OUT, JSON.stringify(result, null, 2));
new Notice(result.error ? `Keychain test failed: ${result.error}` : "Keychain test done", 6000);
%>
