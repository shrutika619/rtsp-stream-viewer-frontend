import { useCallback, useEffect, useRef, useState } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/stream/";
const maskCreds = (u) => u.replace(/\/\/[^@/]*@/, "//");

export default function StreamTile({ url, onRemove }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [status, setStatus] = useState("connecting"); // connecting | live | paused | error
  const [message, setMessage] = useState("");

  const connect = useCallback(() => {
    wsRef.current?.close();
    setStatus("connecting");
    setMessage("");
    const ws = new WebSocket(WS_URL);
    ws.binaryType = "blob";
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ action: "start", url }));
    ws.onmessage = async (ev) => {
      if (ws !== wsRef.current) return;
      if (typeof ev.data === "string") {
        const msg = JSON.parse(ev.data);
        if (msg.type === "error") { setStatus("error"); setMessage(msg.message); }
        return;
      }
      try {
        const bmp = await createImageBitmap(ev.data);
        const c = canvasRef.current;
        if (c) {
          if (c.width !== bmp.width) { c.width = bmp.width; c.height = bmp.height; }
          c.getContext("2d").drawImage(bmp, 0, 0);
        }
        bmp.close();
        setStatus((s) => (s === "paused" ? s : "live"));
      } catch { /* skip a bad frame */ }
    };
    ws.onerror = () => { if (ws === wsRef.current) { setStatus("error"); setMessage("Cannot reach the streaming server."); } };
    ws.onclose = () => {
      if (ws === wsRef.current) setStatus((s) => (s === "error" ? s : "error"));
      if (ws === wsRef.current) setMessage((m) => m || "Connection closed.");
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => { const ws = wsRef.current; wsRef.current = null; ws?.close(); };
  }, [connect]);

  const togglePause = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const pausing = status !== "paused";
    ws.send(JSON.stringify({ action: pausing ? "pause" : "resume" }));
    setStatus(pausing ? "paused" : "live");
  };

  const label = { connecting: "Connecting", live: "Live", paused: "Paused", error: "Offline" }[status];

  return (
    <section className={`tile ${status}`}>
      <div className="screen">
        <canvas ref={canvasRef} />
        {status !== "live" && status !== "paused" && (
          <div className="overlay">
            {status === "connecting" ? <span className="spinner" aria-hidden /> : null}
            <p>{status === "connecting" ? "Connecting to stream…" : message}</p>
            {status === "error" && <button onClick={connect}>Try again</button>}
          </div>
        )}
        {status === "paused" && <div className="overlay dim"><p>Paused</p></div>}
      </div>
      <footer>
        <span className="dot" title={label} />
        <span className="name" title={maskCreds(url)}>{maskCreds(url)}</span>
        <button className="ghost" onClick={togglePause} disabled={status === "connecting" || status === "error"}>
          {status === "paused" ? "Play" : "Pause"}
        </button>
        <button className="ghost" onClick={onRemove}>Remove</button>
      </footer>
    </section>
  );
}
