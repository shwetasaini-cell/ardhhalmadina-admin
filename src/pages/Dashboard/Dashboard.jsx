// Dashboard.jsx - Responsive Dashboard Component
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
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "./Dashboard.css";
import axiosInstance from "../../utils/axiosInstance"; // ✅ Correct spelling

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

export default function Dashboard() {
  // Check if chart data exists
  const hasChartData = lineData && doughnutData;

  return (
    <div className="dashboard">
      {/* STATS CARDS */}
      <div className="row g-4 mb-4">
        <StatCard title="Active Projects" value="12" trend="+2" />
        <StatCard title="Workers On Site" value="347" trend="+23" />
        <StatCard title="Equipment" value="86" trend="+4" />
        <StatCard title="Materials Stock" value="73%" trend="-5%" />
      </div>

      {/* CHARTS */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="dashboard-card">
            <h6>Project Progress Overview</h6>
            {hasChartData ? (
              <Line data={lineData} options={chartOptions} />
            ) : (
              <div className="chart-skeleton" />
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="dashboard-card">
            <h6>Resource Allocation</h6>
            {hasChartData ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="chart-skeleton" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Stat Card Component */
function StatCard({ title, value, trend }) {
  return (
    <div className="col-xl-3 col-md-6">
      <div className="stat-card">
        <p>{title}</p>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <h3>{value}</h3>
          {trend && (
            <span
              style={{
                fontSize: "12px",
                color: "#10b981",
                background: "#e8f5e9",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* Chart Data */
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
      pointBackgroundColor: "#2C8769",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
};

const doughnutData = {
  labels: ["Interested", "No Interest", "Pending"],
  datasets: [
    {
      data: [55, 30, 15],
      backgroundColor: ["#2C8769", "#e57373", "#ffb74d"],
      borderWidth: 0,
      cutout: "60%",
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: "index",
      intersect: false,
      backgroundColor: "#fff",
      titleColor: "#374151",
      bodyColor: "#6b7280",
      borderColor: "#e5e7eb",
      borderWidth: 1,
    },
  },
  scales: {
    y: {
      grid: {
        color: "#f0f0f0",
      },
      ticks: {
        stepSize: 100,
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxWidth: 12,
        padding: 15,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: "#fff",
      titleColor: "#374151",
      bodyColor: "#6b7280",
      borderColor: "#e5e7eb",
      borderWidth: 1,
    },
  },
};
