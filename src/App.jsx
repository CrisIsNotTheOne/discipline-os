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
  <div style={{ background: "#1e293b", height: "10px", borderRadius: "10px" }}>
    <div style={{
      width: `${value}%`,
      background: color,
      height: "100%",
      borderRadius: "10px"
    }} />
  </div>
);

/* STYLES */

const appBg = {
  background: "linear-gradient(135deg, #0f172a, #020617)",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  padding: "20px",
  color: "white",
  fontFamily: "system-ui"
};

const title = {
  textAlign: "center",
  marginBottom: "15px"
};

const card = {
  background: "rgba(30,41,59,0.8)",
  padding: "15px",
  borderRadius: "16px",
  marginBottom: "15px"
};

const btn = (done) => ({
  width: "100%",
  padding: "12px",
  marginTop: "10px",
  borderRadius: "12px",
  border: "none",
  background: done ? "#22c55e" : "#334155",
  color: "white"
});

const endBtn = {
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  border: "none",
  background: "#22c55e",
  color: "white",
  marginTop: "15px"
};

const nav = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: "#1e293b",
  display: "flex",
  justifyContent: "space-around",
  padding: "10px"
};

const navBtn = {
  background: "none",
  border: "none",
  color: "white",
  fontSize: "16px"
};