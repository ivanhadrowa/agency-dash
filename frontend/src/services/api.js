const API_BASE = "http://localhost:8000/analytics";

function buildQuery(params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
            query.append(key, value);
        }
    }
    return query.toString();
}

export async function getSummary(wl, from, to) {
    const q = buildQuery({ from, to });
    const res = await fetch(`${API_BASE}/${wl}/summary?${q}`);
    return res.json();
}

export async function getUsersTimeseries(wl, from, to, bucket = 'day') {
    const q = buildQuery({ from, to, bucket });
    const res = await fetch(`${API_BASE}/${wl}/users/timeseries?${q}`);
    return res.json();
}

export async function getFinanceSummary(wl, from, to) {
    const q = buildQuery({ from, to });
    const res = await fetch(`${API_BASE}/${wl}/finance/summary?${q}`);
    return res.json();
}

export async function getFinanceTimeseries(wl, from, to, bucket = 'month') {
    const q = buildQuery({ from, to, bucket });
    const res = await fetch(`${API_BASE}/${wl}/finance/timeseries?${q}`);
    return res.json();
}

export async function getTopProfitable(wl, from, to, limit = 5) {
    const q = buildQuery({ from, to, limit });
    const res = await fetch(`${API_BASE}/${wl}/top/profit?${q}`);
    return res.json();
}

export async function getTeamSummary(wl) {
    const res = await fetch(`${API_BASE}/${wl}/team/summary`);
    return res.json();
}

export async function getClientDistribution(wl) {
    const res = await fetch(`${API_BASE}/${wl}/client/distribution`);
    return res.json();
}

export async function getBrands() {
    const res = await fetch(`${API_BASE}/brands`);
    return res.json();
}
