import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import "./Dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
);

/* =======================
   STATIC CHART DATA
======================= */

const lineData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Leads",
      data: [120, 190, 300, 280, 320, 400],
      borderColor: "#2C8769",
      backgroundColor: "rgba(44, 135, 105, 0.1)",
      tension: 0.4,
      fill: true,
      pointRadius: 4,
    },
  ],
};

const doughnutData = {
  labels: ["Interested", "No Interest", "Pending"],
  datasets: [
    {
      data: [55, 30, 15],
      backgroundColor: ["#2C8769", "#e57373", "#ffb74d"],
      cutout: "60%",
    },
  ],
};

/* =======================
   CHART OPTIONS
======================= */

const lineOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#fff",
      titleColor: "#000",
      bodyColor: "#666",
      borderColor: "#ddd",
      borderWidth: 1,
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: "#eee" } },
  },
};

const doughnutOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxWidth: 12,
        padding: 15,
      },
    },
  },
};

/* =======================
   MAIN DASHBOARD
======================= */

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* STATS */}
      <div className="row g-4 mb-4">
        <StatCard title="Active Projects" value="12" trend="+2" />
        <StatCard title="Workers On Site" value="347" trend="+23" />
        <StatCard title="Equipment" value="86" trend="+4" />
        <StatCard title="Materials Stock" value="73%" trend="-5%" />
      </div>

      {/* CHARTS */}
      <div className="row g-4">
        {/* LINE CHART */}
        <div className="col-lg-8">
          <div className="dashboard-card">
            <h6>Project Progress Overview</h6>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* DOUGHNUT */}
        <div className="col-lg-4">
          <div className="dashboard-card">
            <h6>Resource Allocation</h6>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======================
   STAT CARD COMPONENT
======================= */

function StatCard({ title, value, trend }) {
  return (
    <div className="col-xl-3 col-md-6">
      <div className="stat-card">
        <p>{title}</p>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>{value}</h3>

          <span
            style={{
              fontSize: "12px",
              color: trend.includes("-") ? "red" : "#10b981",
              background: "#f3f4f6",
              padding: "2px 8px",
              borderRadius: "20px",
            }}
          >
            {trend}
          </span>
        </div>
      </div>
    </div>
  );
}
