// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "chart.js/auto";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import Select from "react-select";

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import GroupsIcon from '@mui/icons-material/Groups';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Loader from "../components/Loader";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const fmtINRShort = (n) => {
  if (n == null) return "₹0";
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};
const numberStr = (n) => (n ?? 0).toLocaleString("en-IN");

const StatCard = ({ title, value, change, icon: Icon, bgColor, iconColor }) => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800 mb-2">{value}</h3>
        {typeof change === "number" && (
          <div className="flex items-center gap-1">
            {change >= 0 ? (
              <TrendingUpIcon fontSize="small" className="text-green-500" />
            ) : (
              <TrendingDownIcon fontSize="small" className="text-red-500" />
            )}
            <span className={`text-sm font-medium ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
              {Math.abs(change).toFixed(1)}% vs last period
            </span>
          </div>
        )}
      </div>
      <div className={`${bgColor} p-3 rounded-lg`}>
        <Icon className={`${iconColor}`} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [period, setPeriod] = useState({ value: "all", label: "All Time" });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [totalCollections, setTotalCollections] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [repossessions, setRepossessions] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);

  const [trend, setTrend] = useState({ labels: [], data: [] });
  const [modes, setModes] = useState({ labels: [], data: [] });
  const [agents, setAgents] = useState({ labels: [], data: [] });

  const options = [
    { value: "day", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
  ];

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${BACKEND_BASE_URL}/web/dashboard?period=${encodeURIComponent(period.value)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (cancel) return;

        const { stats, charts } = res.data || {};
        // inside your axios call after getting res.data
        const utcLabels = charts?.trend?.labels || [];

        // convert each UTC date string to IST-readable format
        const istLabels = utcLabels.map(utcTime => {
          const utcDate = new Date(utcTime); // UTC assumed
          // convert to IST by adding 5.5 hours (19800000 ms)
          const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
          // format as local readable label
          return istDate.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour12: true,
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
          });
        });

        setTrend({
          labels: istLabels,
          data: charts?.trend?.data || []
        });

        setTotalCollections(stats?.totalCollections ?? 0);
        setActiveLoans(stats?.activeLoans ?? 0);
        setRepossessions(stats?.repossessions ?? 0);
        setActiveAgents(stats?.activeAgents ?? 0);

        // setTrend(charts?.trend ?? { labels: [], data: [] });
        setModes(charts?.paymentModes ?? { labels: [], data: [] });
        setAgents(charts?.agentPerformance ?? { labels: [], data: [] });
      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.message || "Failed to load dashboard");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [period]);

  const EmptyBox = ({ show }) =>
    show ? (
      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">No data</div>
    ) : null;

  const lineData = {
    labels: trend.labels,
    datasets: [
      {
        label: "Collections",
        data: trend.data,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };
  const pieData = {
    labels: modes.labels,
    datasets: [
      {
        data: modes.data,
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"],
      },
    ],
  };
  const barData = {
    labels: agents.labels,
    datasets: [{ label: "Collections", data: agents.data, backgroundColor: "#3b82f6" }],
  };

  const lineOptions = { responsive: true, maintainAspectRatio: false };
  const pieOptions = { responsive: true, maintainAspectRatio: false };
  const barOptions = { responsive: true, maintainAspectRatio: false };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <div className="w-48">
          <Select
            value={period}
            onChange={setPeriod}
            options={options}
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({
                ...base,
                borderColor: "#d1d5db",
                boxShadow: "none",
                "&:hover": { borderColor: "#3b82f6" },
              }),
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader />
        </div>
      ) : err ? (
        <div className="w-full py-3 px-4 mb-6 rounded border border-red-300 bg-red-50 text-red-700">{err}</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Collections" value={fmtINRShort(totalCollections)} icon={CurrencyRupeeIcon} bgColor="bg-blue-100" iconColor="text-blue-600" />
            <StatCard title="Active Loans" value={numberStr(activeLoans)} icon={CreditCardIcon} bgColor="bg-green-100" iconColor="text-green-600" />
            <StatCard title="Repossessions" value={numberStr(repossessions)} icon={WarningAmberIcon} bgColor="bg-orange-100" iconColor="text-orange-600" />
            <StatCard title="Active Agents" value={numberStr(activeAgents)} icon={GroupsIcon} bgColor="bg-purple-100" iconColor="text-purple-600" />
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="relative lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Collection Trend</h2>
                <div className="h-80">
                  <Line key={`line-${period.value}`} data={lineData} options={lineOptions} />
                </div>
                <EmptyBox show={!trend.data?.length || trend.data.every((v) => !v)} />
              </div>

              <div className="relative bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Payment Modes</h2>
                <div className="h-80">
                  <Doughnut key={`pie-${period.value}`} data={pieData} options={pieOptions} />
                </div>
                <EmptyBox show={!modes.data?.length || modes.data.every((v) => !v)} />
              </div>
            </div>

            <div className="relative bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Agent Performance</h2>
              <div className="h-80">
                <Bar key={`bar-${period.value}`} data={barData} options={barOptions} />
              </div>
              <EmptyBox show={!agents.data?.length || agents.data.every((v) => !v)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
