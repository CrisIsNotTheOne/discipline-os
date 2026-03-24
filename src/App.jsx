import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

/* ===================== UTIL ===================== */

const today = () => new Date().toISOString().slice(0, 10);

const load = (k, d) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? d; }
  catch { return d; }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const calcScore = (d, g) => {
  const a = d.workout ? 1 : 0;
  const b = d.study >= g.study ? 1 : 0;
  const c = d.protein >= g.protein ? 1 : 0;
  return Math.round(((a + b + c) / 3) * 100);
};

const levelFromXp = (xp) => ({
  level: Math.floor(xp / 100),
  current: xp % 100
});

/* ===================== APP ===================== */

export default function App() {
  const [page, setPage] = useState("home");

  useEffect(() => {
    // PWA hook
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
    });
  }, []);

  return (
    <div style={bg}>
      <div style={container}>
        {page === "home" && <Home />}
        {page === "stats" && <Stats />}
        {page === "achievements" && <Achievements />}
        {page === "settings" && <Settings />}

        <nav style={nav}>
          <NavBtn label="Home" onClick={() => setPage("home")} />
          <NavBtn label="Stats" onClick={() => setPage("stats")} />
          <NavBtn label="Awards" onClick={() => setPage("achievements")} />
          <NavBtn label="Settings" onClick={() => setPage("settings")} />
        </nav>
      </div>
    </div>
  );
}

/* ===================== HOME ===================== */

function Home() {
  const [data, setData] = useState(() =>
    load("data", {
      workout: false,
      study: 0,
      protein: 0,
      xp: 0,
      streak: 0,
      lastDate: today()
    })
  );

  const [goals, setGoals] = useState(() =>
    load("goals", { study: 3, protein: 130 })
  );

  // Daily reset
  useEffect(() => {
    if (data.lastDate !== today()) {
      setData((d) => ({
        ...d,
        workout: false,
        study: 0,
        protein: 0,
        lastDate: today()
      }));
    }
  }, []);

  useEffect(() => save("data", data), [data]);
  useEffect(() => save("goals", goals), [goals]);

  const score = useMemo(() => calcScore(data, goals), [data, goals]);
  const { level, current } = levelFromXp(data.xp);

  // Adaptive goals (auto difficulty)
  useEffect(() => {
    const history = load("history", []);
    const last5 = history.slice(-5);
    if (last5.length < 5) return;

    const avg = last5.reduce((a, b) => a + b.score, 0) / 5;

    if (avg > 90) {
      setGoals((g) => ({
        study: Math.min(g.study + 1, 8),
        protein: g.protein + 10
      }));
    }
    if (avg < 50) {
      setGoals((g) => ({
        study: Math.max(g.study - 1, 2),
        protein: Math.max(g.protein - 10, 80)
      }));
    }
  }, [data]);

  // Intelligence engine
  const insights = useMemo(() => {
    const history = load("history", []);
    const last7 = history.slice(-7);
    const last14 = history.slice(-14);

    if (!last7.length) return ["Start strong today"];

    const avg7 = last7.reduce((a, b) => a + b.score, 0) / last7.length;
    const avg14 = last14.length
      ? last14.reduce((a, b) => a + b.score, 0) / last14.length
      : avg7;

    const trend = avg7 - avg14;
    const missed = last7.filter(d => d.score < 100).length;

    const out = [];

    if (trend > 10) out.push("📈 Improving fast");
    else if (trend < -10) out.push("📉 Declining");

    if (avg7 > 85) out.push("🔥 Elite discipline");
    else if (avg7 > 65) out.push("⚡ Good consistency");
    else out.push("🚨 Lock in");

    if (missed >= 3) out.push("🍗 Protein inconsistent");
    if (data.streak >= 5) out.push("🧠 Habit forming");

    return out;
  }, [data]);

  const endDay = () => {
    const history = load("history", []);
    const t = today();

    const filtered = history.filter((h) => h.date !== t);
    filtered.push({ date: t, score });
    save("history", filtered);

    const success = score === 100;

    setData((d) => ({
      ...d,
      xp: success ? d.xp + 50 : d.xp,
      streak: success ? d.streak + 1 : 0,
      workout: false,
      study: 0,
      protein: 0
    }));

    if (success) celebrate();
  };

  const progressColor =
    score > 80 ? "#22c55e" :
    score > 50 ? "#facc15" :
    "#ef4444";

  return (
    <div style={wrap}>
      <h1 style={title}>Discipline OS</h1>

      <Card>
        <h3>Level {level}</h3>
        <Bar value={current} color="#3b82f6" />
        <p>🔥 {data.streak} Day Streak</p>
      </Card>

      <Card>
        <Btn done={data.workout}
          onClick={() => setData({ ...data, workout: !data.workout })}>
          Workout {data.workout && "✓"}
        </Btn>

        <Btn done={data.study >= goals.study}
          onClick={() => setData({ ...data, study: data.study + 1 })}>
          Study {data.study}/{goals.study}
        </Btn>

        <Btn done={data.protein >= goals.protein}
          onClick={() => setData({ ...data, protein: data.protein + 20 })}>
          Protein {data.protein}/{goals.protein}
        </Btn>
      </Card>

      <Card>
        <h3>Progress</h3>
        <Bar value={score} color={progressColor} />
        <p>{score}%</p>
      </Card>

      <Card>
        <h3>Insights</h3>
        {insights.map((i, idx) => (
          <p key={idx} style={{ opacity: 0.8 }}>{i}</p>
        ))}
      </Card>

      <button style={endBtn} onClick={endDay}>End Day</button>
    </div>
  );
}

/* ===================== STATS ===================== */

function Stats() {
  const history = load("history", []);
  const data = history.slice(-14);

  const weekly = useMemo(() => {
    if (!data.length) return null;
    const avg = Math.round(data.reduce((a, b) => a + b.score, 0) / data.length);
    const best = Math.max(...data.map(d => d.score));
    const worst = Math.min(...data.map(d => d.score));
    return { avg, best, worst };
  }, [data]);

  return (
    <div style={wrap}>
      <h1 style={title}>Analytics</h1>

      {weekly && (
        <Card>
          <h3>Weekly Report</h3>
          <p>Avg: {weekly.avg}%</p>
          <p>Best: {weekly.best}%</p>
          <p>Worst: {weekly.worst}%</p>
        </Card>
      )}

      <Card>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fill: "white", fontSize: 10 }} />
            <YAxis tick={{ fill: "white" }} />
            <Tooltip />
            <Line type="monotone" dataKey="score"
              stroke="#22c55e" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <Heatmap data={history} />
      </Card>
    </div>
  );
}

/* ===================== HEATMAP ===================== */

function Heatmap({ data }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 5
    }}>
      {data.slice(-28).map((d, i) => (
        <div key={i} style={{
          height: 18,
          borderRadius: 4,
          background:
            d.score === 100 ? "#22c55e" :
            d.score >= 70 ? "#4ade80" :
            d.score >= 40 ? "#facc15" :
            "#ef4444"
        }} />
      ))}
    </div>
  );
}

/* ===================== ACHIEVEMENTS ===================== */

function Achievements() {
  const { streak } = load("data", { streak: 0 });

  const badges = [
    { name: "Starter", unlock: 1 },
    { name: "Consistent", unlock: 3 },
    { name: "Beast", unlock: 7 }
  ];

  return (
    <div style={wrap}>
      <h1 style={title}>Achievements</h1>

      {badges.map((b, i) => (
        <Card key={i}>
          <h3>{b.name}</h3>
          <p>{streak >= b.unlock ? "Unlocked 🔥" : "Locked"}</p>
        </Card>
      ))}
    </div>
  );
}

/* ===================== SETTINGS ===================== */

function Settings() {
  const [goals, setGoals] = useState(() =>
    load("goals", { study: 3, protein: 130 })
  );

  useEffect(() => save("goals", goals), [goals]);

  return (
    <div style={wrap}>
      <h1 style={title}>Settings</h1>

      <Card>
        <p>Study</p>
        <input type="number" value={goals.study}
          onChange={(e) => setGoals({ ...goals, study: +e.target.value })} />

        <p>Protein</p>
        <input type="number" value={goals.protein}
          onChange={(e) => setGoals({ ...goals, protein: +e.target.value })} />
      </Card>
    </div>
  );
}

/* ===================== UI ===================== */

const Card = ({ children }) => (
  <div style={card}>{children}</div>
);

const Btn = ({ children, onClick, done }) => (
  <button
    onClick={onClick}
    style={btn(done)}
    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    {children}
  </button>
);

const Bar = ({ value, color }) => (
  <div style={barBg}>
    <div style={{
      width: `${value}%`,
      height: "100%",
      background: `linear-gradient(90deg, ${color}, #4ade80)`,
      boxShadow: "0 0 15px rgba(34,197,94,0.7)",
      transition: "0.3s"
    }} />
  </div>
);

const NavBtn = ({ label, onClick }) => (
  <button style={navBtn} onClick={onClick}>{label}</button>
);

/* ===================== EFFECT ===================== */

function celebrate() {
  const el = document.createElement("div");
  el.innerText = "🔥 PERFECT DAY";
  Object.assign(el.style, {
    position: "fixed",
    top: "40%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "28px",
    color: "#22c55e",
    zIndex: 999,
    opacity: 1,
    transition: "0.6s"
  });
  document.body.appendChild(el);
  setTimeout(() => el.style.opacity = "0", 400);
  setTimeout(() => document.body.removeChild(el), 1000);
}

/* ===================== STYLES ===================== */

const bg = {
  background: "radial-gradient(circle at top,#0f172a,#020617)",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  color: "white"
};

const container = { maxWidth: 420, width: "100%" };
const wrap = { padding: 20, paddingBottom: 80 };
const title = { textAlign: "center", fontSize: 26 };

const card = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(16px)",
  borderRadius: 20,
  padding: 16,
  marginBottom: 12,
  boxShadow: "0 0 30px rgba(0,0,0,0.6)"
};

const btn = (done) => ({
  width: "100%",
  padding: 14,
  marginTop: 8,
  borderRadius: 16,
  border: "none",
  color: "white",
  background: done
    ? "linear-gradient(135deg,#22c55e,#16a34a)"
    : "rgba(255,255,255,0.08)",
  boxShadow: done
    ? "0 0 25px rgba(34,197,94,0.9)"
    : "0 0 10px rgba(255,255,255,0.05)",
  transition: "all 0.2s"
});

const barBg = {
  background: "#1e293b",
  height: 12,
  borderRadius: 12,
  overflow: "hidden"
};

const endBtn = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  background: "linear-gradient(135deg,#22c55e,#4ade80)",
  boxShadow: "0 0 25px rgba(34,197,94,0.8)",
  border: "none",
  marginTop: 10
};

const nav = {
  position: "fixed",
  bottom: 10,
  left: 10,
  right: 10,
  display: "flex",
  justifyContent: "space-around",
  background: "#1e293b",
  padding: 10,
  borderRadius: 20
};

const navBtn = {
  background: "none",
  border: "none",
  color: "white"
};