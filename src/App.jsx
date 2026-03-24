import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

/* ----------------------- UTIL ----------------------- */

const todayStr = () => new Date().toISOString().slice(0, 10);

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const calcScore = ({ workout, study, protein }, goals) => {
  const a = workout ? 1 : 0;
  const b = study >= goals.study ? 1 : 0;
  const c = protein >= goals.protein ? 1 : 0;
  return Math.round(((a + b + c) / 3) * 100);
};

const levelFromXp = (xp) => {
  const level = Math.floor(xp / 100);
  const current = xp % 100;
  return { level, current };
};

/* ----------------------- STORAGE ----------------------- */

const load = (k, d) => JSON.parse(localStorage.getItem(k)) ?? d;
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ----------------------- APP ----------------------- */

export default function App() {
  const [page, setPage] = useState("home");

  useEffect(() => {
    // PWA install hook
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
        {page === "settings" && <Settings />}

        <nav style={nav}>
          <NavBtn label="Home" onClick={() => setPage("home")} />
          <NavBtn label="Stats" onClick={() => setPage("stats")} />
          <NavBtn label="Settings" onClick={() => setPage("settings")} />
        </nav>
      </div>
    </div>
  );
}

/* ----------------------- HOME ----------------------- */

function Home() {
  const [state, setState] = useState(() =>
    load("state", {
      workout: false,
      study: 0,
      protein: 0,
      xp: 0,
      streak: 0,
      lastDate: todayStr(),
    })
  );

  const [goals, setGoals] = useState(() =>
    load("goals", { study: 3, protein: 130 })
  );

  // Daily reset
  useEffect(() => {
    if (state.lastDate !== todayStr()) {
      setState((s) => ({
        ...s,
        workout: false,
        study: 0,
        protein: 0,
        lastDate: todayStr(),
      }));
    }
  }, []);

  useEffect(() => save("state", state), [state]);
  useEffect(() => save("goals", goals), [goals]);

  const score = useMemo(() => calcScore(state, goals), [state, goals]);
  const { level, current } = levelFromXp(state.xp);

  const insights = useMemo(() => {
    const history = load("history", []);
    const last7 = history.slice(-7);
    if (!last7.length) return ["Start strong today."];
    const avg =
      last7.reduce((a, b) => a + b.score, 0) / last7.length;

    return [
      avg > 70
        ? "Strong week 🔥"
        : "Push harder this week",
      state.protein < goals.protein
        ? "Protein lagging"
        : "Protein on track",
    ];
  }, [state, goals]);

  const endDay = () => {
    const history = load("history", []);
    const today = todayStr();

    const filtered = history.filter((h) => h.date !== today);
    filtered.push({ date: today, score });

    save("history", filtered);

    const success = score === 100;

    setState((s) => ({
      ...s,
      xp: success ? s.xp + 50 : s.xp,
      streak: success ? s.streak + 1 : 0,
      workout: false,
      study: 0,
      protein: 0,
      lastDate: today,
    }));

    alert(success ? "Perfect Day 🔥" : "Lock in tomorrow");
  };

  const progressColor =
    score > 80 ? "#22c55e" :
    score > 50 ? "#facc15" :
    "#ef4444";

  return (
    <div style={pageWrap}>
      <h1 style={title}>Discipline OS</h1>

      <Card>
        <h3>Level {level}</h3>
        <Bar value={current} color="#3b82f6" />
        <p>{current}/100 XP</p>
        <p>🔥 {state.streak} Day Streak</p>
      </Card>

      <Card>
        <h3>Daily Missions</h3>

        <Btn done={state.workout}
          onClick={() =>
            setState((s) => ({ ...s, workout: !s.workout }))
          }>
          Workout {state.workout && "✓"}
        </Btn>

        <Btn done={state.study >= goals.study}
          onClick={() =>
            setState((s) => ({ ...s, study: s.study + 1 }))
          }>
          Study {state.study}/{goals.study}
        </Btn>

        <Btn done={state.protein >= goals.protein}
          onClick={() =>
            setState((s) => ({ ...s, protein: s.protein + 20 }))
          }>
          Protein {state.protein}/{goals.protein}
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

/* ----------------------- STATS ----------------------- */

function Stats() {
  const data = load("history", []).slice(-14);

  return (
    <div style={pageWrap}>
      <h1 style={title}>Analytics</h1>

      <Card>
        <h3>Performance</h3>
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
    </div>
  );
}

/* ----------------------- SETTINGS ----------------------- */

function Settings() {
  const [goals, setGoals] = useState(() =>
    load("goals", { study: 3, protein: 130 })
  );

  useEffect(() => save("goals", goals), [goals]);

  return (
    <div style={pageWrap}>
      <h1 style={title}>Settings</h1>

      <Card>
        <h3>Goals</h3>

        <input
          type="number"
          value={goals.study}
          onChange={(e) =>
            setGoals({ ...goals, study: +e.target.value })
          }
        />

        <input
          type="number"
          value={goals.protein}
          onChange={(e) =>
            setGoals({ ...goals, protein: +e.target.value })
          }
        />
      </Card>
    </div>
  );
}

/* ----------------------- COMPONENTS ----------------------- */

const Card = ({ children }) => <div style={card}>{children}</div>;

const Btn = ({ children, onClick, done }) => (
  <button
    onClick={onClick}
    style={btn(done)}
    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    {children}
  </button>
);

const Bar = ({ value, color }) => (
  <div style={barBg}>
    <div style={{
      width: `${value}%`,
      background: `linear-gradient(90deg, ${color}, #4ade80)`,
      height: "100%"
    }} />
  </div>
);

const NavBtn = ({ label, onClick }) => (
  <button onClick={onClick} style={navBtn}>{label}</button>
);

/* ----------------------- STYLES ----------------------- */

const bg = {
  background: "radial-gradient(circle at top,#0f172a,#020617)",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  padding: 20,
  color: "white",
  fontFamily: "system-ui"
};

const container = { maxWidth: 420, width: "100%" };

const pageWrap = { paddingBottom: 80 };

const title = { textAlign: "center", marginBottom: 10 };

const card = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(12px)",
  borderRadius: 20,
  padding: 18,
  marginBottom: 15
};

const btn = (done) => ({
  width: "100%",
  padding: 14,
  marginTop: 10,
  borderRadius: 16,
  border: "none",
  color: "white",
  background: done ? "#22c55e" : "#334155",
  transition: "0.2s"
});

const barBg = {
  background: "#1e293b",
  height: 10,
  borderRadius: 10,
  overflow: "hidden"
};

const endBtn = {
  width: "100%",
  padding: 16,
  borderRadius: 16,
  border: "none",
  background: "#22c55e",
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