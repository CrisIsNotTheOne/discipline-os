import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div style={appBg}>
      <div style={{ maxWidth: "400px", width: "100%" }}>
        {page === "home" && <Home />}
        {page === "stats" && <Stats />}

        <div style={nav}>
          <button onClick={() => setPage("home")} style={navBtn}>Home</button>
          <button onClick={() => setPage("stats")} style={navBtn}>Stats</button>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [workout, setWorkout] = useState(false);
  const [study, setStudy] = useState(0);
  const [protein, setProtein] = useState(0);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("discipline"));
    if (saved) {
      setWorkout(saved.workout || false);
      setStudy(saved.study || 0);
      setProtein(saved.protein || 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "discipline",
      JSON.stringify({ workout, study, protein })
    );
  }, [workout, study, protein]);

  const completed =
    (workout ? 1 : 0) +
    (study >= 3 ? 1 : 0) +
    (protein >= 130 ? 1 : 0);

  const score = (completed / 3) * 100;

  const endDay = () => {
    const history = JSON.parse(localStorage.getItem("history")) || [];
    const today = new Date().toLocaleDateString();

    // remove duplicate same day
    const filtered = history.filter((item) => item.date !== today);

    filtered.push({
      date: today,
      score: Math.floor(score)
    });

    localStorage.setItem("history", JSON.stringify(filtered));

    // reset
    setWorkout(false);
    setStudy(0);
    setProtein(0);
  };

  return (
    <div style={{ paddingBottom: "70px" }}>
      <h1 style={title}>Discipline OS</h1>

      <div style={card}>
        <h3>Daily Missions</h3>

        <button onClick={() => setWorkout(!workout)} style={btn(workout)}>
          Workout {workout ? "✓" : ""}
        </button>

        <button onClick={() => setStudy(study + 1)} style={btn(study >= 3)}>
          Study {study}/3 hrs
        </button>

        <button onClick={() => setProtein(protein + 20)} style={btn(protein >= 130)}>
          Protein {protein}/130g
        </button>
      </div>

      <div style={card}>
        <h3>Progress</h3>
        <Bar value={score} color="#22c55e" />
        <p>{Math.floor(score)}%</p>
      </div>

      <button onClick={endDay} style={endBtn}>
        End Day
      </button>
    </div>
  );
}

function Stats() {
  const data = (JSON.parse(localStorage.getItem("history")) || []).slice(-7);

  return (
    <div style={{ paddingBottom: "70px" }}>
      <h1 style={title}>Stats</h1>

      <div style={card}>
        <h3>Weekly Progress</h3>

        <LineChart width={320} height={220} data={data}>
          <XAxis dataKey="date" tick={{ fill: "white", fontSize: 10 }} />
          <YAxis tick={{ fill: "white" }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </div>
    </div>
  );
}

/* COMPONENTS */

const Bar = ({ value, color }) => (
  <div style={{
    background: "rgba(255,255,255,0.08)",
    height: "12px",
    borderRadius: "12px",
    overflow: "hidden"
  }}>
    <div style={{
      width: `${value}%`,
      background: `linear-gradient(90deg, ${color}, #4ade80)`,
      height: "100%",
      borderRadius: "12px",
      boxShadow: "0 0 10px rgba(34,197,94,0.6)",
      transition: "0.3s"
    }} />
  </div>
);

/* STYLES */

const appBg = {
  background: "radial-gradient(circle at top, #0f172a, #020617)",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  padding: "20px",
  color: "white",
  fontFamily: "system-ui"
};

const card = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(12px)",
  borderRadius: "20px",
  padding: "18px",
  marginBottom: "15px",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 0 25px rgba(0,0,0,0.4)"
};

const btn = (done) => ({
  width: "100%",
  padding: "14px",
  marginTop: "10px",
  borderRadius: "14px",
  border: "none",
  background: done
    ? "linear-gradient(135deg, #22c55e, #16a34a)"
    : "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "600",
  letterSpacing: "0.5px",
  transition: "0.2s",
  boxShadow: done
    ? "0 0 15px rgba(34,197,94,0.6)"
    : "0 0 10px rgba(255,255,255,0.05)"
});

const endBtn = {
  width: "100%",
  padding: "16px",
  borderRadius: "16px",
  border: "none",
  background: "linear-gradient(135deg, #22c55e, #4ade80)",
  color: "white",
  fontWeight: "700",
  fontSize: "16px",
  marginTop: "15px",
  boxShadow: "0 0 20px rgba(34,197,94,0.7)"
};

const title = {
  textAlign: "center",
  marginBottom: "20px",
  fontSize: "28px",
  fontWeight: "700",
  letterSpacing: "1px"
};

const nav = {
  position: "fixed",
  bottom: "10px",
  left: "10px",
  right: "10px",
  background: "rgba(30,41,59,0.8)",
  backdropFilter: "blur(12px)",
  display: "flex",
  justifyContent: "space-around",
  padding: "12px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.1)"
};

const navBtn = {
  background: "none",
  border: "none",
  color: "white",
  fontSize: "15px",
  fontWeight: "600"
};