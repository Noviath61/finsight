// src/Fundamentals.jsx
import { useEffect, useState } from "react";

const FMP_KEY = import.meta.env.VITE_FMP_API_KEY;

function fmtMoney(n, currency = "USD") {
  if (n == null || Number.isNaN(+n)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(+n);
  } catch {
    return (+n).toLocaleString();
  }
}

export default function Fundamentals({ symbol }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!symbol) return;
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErr("");

        // FMP company profile
        const pRes = await fetch(
          `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_KEY}`
        );
        const pJson = await pRes.json();
        const p = Array.isArray(pJson) ? pJson[0] : null;

        // FMP key metrics (TTM)
        const kRes = await fetch(
          `https://financialmodelingprep.com/api/v3/key-metrics/${symbol}?period=ttm&limit=1&apikey=${FMP_KEY}`
        );
        const kJson = await kRes.json();
        const k = Array.isArray(kJson) ? kJson[0] : null;

        if (alive) {
          setProfile(p || null);
          setMetrics(k || null);
        }
      } catch (e) {
        if (alive) setErr("Failed to load fundamentals.");
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [symbol]);

  if (!symbol) return null;
  if (loading) return <div className="fundamentals-card">Loading fundamentals…</div>;
  if (err) return <div className="fundamentals-card">{err}</div>;

  const currency = profile?.currency || "USD";
  const marketCap = profile?.mktCap;
  const pe =
    metrics?.peRatioTTM ??
    profile?.pe ?? // fallback
    null;
  const eps = profile?.eps ?? null;
  const beta = profile?.beta ?? null;
  // approximate dividend yield if only lastDiv and price are present
  const dividendYield =
    metrics?.dividendYieldTTM ??
    (profile?.lastDiv && profile?.price
      ? (Number(profile.lastDiv) / Number(profile.price)) * 100
      : null);

  return (
    <div className="fundamentals-grid">
      <section className="fundamentals-card">
        <h3>Overview</h3>
        <div className="f-row"><span>Company</span><b>{profile?.companyName || symbol}</b></div>
        <div className="f-row"><span>Exchange</span><b>{profile?.exchangeShortName || profile?.exchange || "—"}</b></div>
        <div className="f-row"><span>Sector</span><b>{profile?.sector || "—"}</b></div>
        <div className="f-row"><span>Industry</span><b>{profile?.industry || "—"}</b></div>
        <div className="f-row">
          <span>Website</span>
          {profile?.website ? (
            <a href={profile.website} target="_blank">{profile.website}</a>
          ) : (
            <b>—</b>
          )}
        </div>
      </section>

      <section className="fundamentals-card">
        <h3>Key Metrics</h3>
        <div className="f-row"><span>Market Cap</span><b>{fmtMoney(marketCap, currency)}</b></div>
        <div className="f-row"><span>P/E (TTM)</span><b>{pe != null ? Number(pe).toFixed(2) : "—"}</b></div>
        <div className="f-row"><span>EPS (TTM)</span><b>{eps != null ? Number(eps).toFixed(2) : "—"}</b></div>
        <div className="f-row"><span>Dividend Yield</span><b>{dividendYield != null ? `${Number(dividendYield).toFixed(2)}%` : "—"}</b></div>
        <div className="f-row"><span>Beta</span><b>{beta != null ? Number(beta).toFixed(2) : "—"}</b></div>
      </section>

      {profile?.description && (
        <section className="fundamentals-card f-desc">
          <h3>Description</h3>
          <p>{profile.description}</p>
        </section>
      )}
    </div>
  );
}
