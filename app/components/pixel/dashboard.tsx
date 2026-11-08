"use client";

import { LAYERS, useLab } from "./lab-state";
import { MapCanvas } from "./visuals";

const label = (v: number | "none" | null) => (v === null ? "—" : v === "none" ? "not a digit" : String(v));

export function Dashboard() {
  const { scans, reset, model, inspected, open } = useLab();
  const labeled = scans.filter((s) => typeof s.intended === "number");
  const correct = labeled.filter((s) => s.intended === s.trace.prediction).length;
  const counts = Array.from({ length: 10 }, (_, d) => scans.filter((s) => s.trace.prediction === d).length);
  const maxCount = Math.max(1, ...counts);
  const last = scans.at(-1);
  const prev = scans.at(-2);
  const accuracy = model.status === "ready" ? model.model.meta.testAccuracy : null;

  return (
    <div className="px-app px-dash">
      <div className="px-stats">
        <p>
          <b>{scans.length}</b>
          <span>drawings scanned</span>
        </p>
        <p>
          <b>{labeled.length ? `${correct}/${labeled.length}` : "—"}</b>
          <span>matched the digit you meant</span>
        </p>
        <p>
          <b>{accuracy !== null ? `${(accuracy * 100).toFixed(2)}%` : "—"}</b>
          <span>accuracy on the 10,000 MNIST test images</span>
        </p>
      </div>
      <p className="px-small">
        Your match count only covers scans where you said what you meant. The MNIST figure was measured once, on the official test set, by the
        training script. Neither is the same as the probability shown for a single drawing.
      </p>

      {scans.length === 0 ? (
        <div className="px-status">
          <p>No scans in this session yet.</p>
          <button type="button" className="btn btn--wide px-primary" onClick={() => open("scanner")}>
            Open Image Scanner
          </button>
        </div>
      ) : (
        <>
          <section>
            <p className="px-sys">PREDICTED LABELS THIS SESSION</p>
            <div className="px-hist" role="img" aria-label={counts.map((c, d) => `${d}: ${c}`).join(", ")}>
              {counts.map((c, d) => (
                <span key={d}>
                  <i style={{ height: `${(c / maxCount) * 100}%` }} />
                  <small>{d}</small>
                </span>
              ))}
            </div>
          </section>

          {last && prev && (
            <section>
              <p className="px-sys">LAST TWO SCANS, SIDE BY SIDE</p>
              <div className="px-pair">
                {[prev, last].map((s) => (
                  <div key={s.id}>
                    <MapCanvas data={s.pixels} size={28} scale={1} label="Scanned drawing" className="px-map--thumb" />
                    <p>
                      predicted <b>{s.trace.prediction}</b> at {(s.trace.probs[s.trace.prediction] * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
              <ol className="px-delta">
                {Array.from(last.trace.probs).map((p, d) => {
                  const change = (p - prev.trace.probs[d]) * 100;
                  return (
                    <li key={d} className={Math.abs(change) >= 1 ? "" : "px-delta--quiet"}>
                      <span>{d}</span>
                      <i className={change >= 0 ? "px-delta--up" : "px-delta--down"} style={{ width: `${Math.min(50, Math.abs(change) / 2)}%` }} />
                      <small>
                        {change >= 0 ? "+" : ""}
                        {change.toFixed(1)} pts
                      </small>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <section>
            <p className="px-sys">EVERY SCAN</p>
            <table className="px-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Drawing</th>
                  <th scope="col">Predicted</th>
                  <th scope="col">Top probability</th>
                  <th scope="col">You meant</th>
                </tr>
              </thead>
              <tbody>
                {scans
                  .map((s, i) => (
                    <tr key={s.id}>
                      <td>{i + 1}</td>
                      <td>
                        <MapCanvas data={s.pixels} size={28} scale={1} label={`Scan ${i + 1}`} className="px-map--row" />
                      </td>
                      <td>{s.trace.prediction}</td>
                      <td>{(s.trace.probs[s.trace.prediction] * 100).toFixed(1)}%</td>
                      <td className={typeof s.intended === "number" && s.intended !== s.trace.prediction ? "px-miss" : ""}>{label(s.intended)}</td>
                    </tr>
                  ))
                  .reverse()}
              </tbody>
            </table>
          </section>

          <section>
            <p className="px-sys">LAYERS YOU INSPECTED</p>
            <p className="px-small">
              {LAYERS.map((l) => `${l.name}: ${inspected[l.key] ?? 0}`).join(" · ")}
            </p>
          </section>
        </>
      )}
      <p className="px-small">Everything here lives in this browser tab only. Nothing is uploaded, and reloading the page clears it.</p>
      <button type="button" className="btn" onClick={reset} disabled={!scans.length}>
        Reset experiment
      </button>
    </div>
  );
}
