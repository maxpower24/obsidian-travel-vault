/**
 * cache.js — "stale first" for widgets that fetch from the internet.
 * Draws the last saved result immediately, then refreshes in the background when it's old and draws
 * again. Only waits for the network when there's nothing saved yet (first ever load).
 * module.exports = { staleFirst({ key, maxAgeMs, isStale, fetcher, draw, empty }) }
 *   isStale(saved) overrides maxAgeMs (e.g. the exchange-rate API says when its next update is).
 */
module.exports = {
    async staleFirst({ key, maxAgeMs = 36e5, isStale, fetcher, draw, empty }) {
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem(key)); } catch (e) {}
        if (saved?.data) draw(saved.data);
        const stale = !saved?.data || (isStale ? isStale(saved) : Date.now() - saved.saved > maxAgeMs);
        if (!stale) return;
        const refresh = (async () => {
            try {
                const data = await fetcher();
                if (data) {
                    try { localStorage.setItem(key, JSON.stringify({ saved: Date.now(), data })); } catch (e) {}
                    draw(data);
                } else if (!saved?.data) empty?.();
            } catch (e) { console.error(`travel cache: ${key} refresh failed`, e); if (!saved?.data) empty?.(); }
        })();
        if (!saved?.data) await refresh;
    },
};
