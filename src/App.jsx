import { useState } from "react";
import StreamTile from "./StreamTile.jsx";

const DEMO_URL = "rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0";
let nextId = 1;

export default function App() {
  const [url, setUrl] = useState("");
  const [streams, setStreams] = useState([]);
  const [error, setError] = useState("");

  const add = (value) => {
    const v = value.trim();
    if (!/^rtsps?:\/\/.+/i.test(v)) return setError("Enter a URL that starts with rtsp://");
    setError("");
    setStreams((s) => [...s, { id: nextId++, url: v }]);
    setUrl("");
  };

  return (
    <div className="app">
      <header>
        <h1>Live camera wall</h1>
        <p>Paste an RTSP address to watch it here. Add as many as you like and they tile automatically.</p>
        <form onSubmit={(e) => { e.preventDefault(); add(url); }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="rtsp://user:password@host:554/path"
            aria-label="RTSP stream URL"
            spellCheck={false}
          />
          <button type="submit">Add stream</button>
          <button type="button" className="ghost" onClick={() => add(DEMO_URL)}>Use test stream</button>
        </form>
        {error && <div className="form-error" role="alert">{error}</div>}
      </header>

      {streams.length === 0 ? (
        <div className="empty">No streams yet. Add an RTSP URL above to start watching.</div>
      ) : (
        <main className="grid">
          {streams.map((s) => (
            <StreamTile key={s.id} url={s.url} onRemove={() => setStreams((all) => all.filter((x) => x.id !== s.id))} />
          ))}
        </main>
      )}
    </div>
  );
}
