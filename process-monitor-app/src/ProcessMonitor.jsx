import React, { useState, useEffect } from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  AlertTriangle,
  X,
  Search,
} from "lucide-react";

const ProcessMonitor = () => {
  const [processes, setProcesses] = useState([]);
  const [systemStats, setSystemStats] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    totalMemory: 16384, // MB
    activeProcesses: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("cpu");
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const generateProcesses = () => {
    const processNames = [
      "chrome.exe",
      "firefox.exe",
      "code.exe",
      "node.exe",
      "python.exe",
      "docker.exe",
      "postgres.exe",
      "nginx.exe",
      "java.exe",
      "explorer.exe",
      "system",
      "svchost.exe",
      "Teams.exe",
      "Slack.exe",
      "Spotify.exe",
    ];

    const states = ["Running", "Sleeping", "Waiting", "Zombie"];

    return processNames.map((name, i) => {
      const cpu = Math.random() * 100;
      const memory = Math.random() * 2048;
      const state = states[Math.floor(Math.random() * states.length)];

      return {
        pid: 1000 + i,
        name,
        cpu: parseFloat(cpu.toFixed(1)),
        memory: parseFloat(memory.toFixed(1)),
        state,
        user: i % 3 === 0 ? "root" : "user",
        startTime: new Date(
          Date.now() - Math.random() * 86400000
        ).toLocaleTimeString(),
      };
    });
  };

  // simulate process activity
  useEffect(() => {
    setProcesses(generateProcesses());

    const interval = setInterval(() => {
      setProcesses((prev) =>
        prev.map((p) => ({
          ...p,
          cpu: Math.max(0, p.cpu + (Math.random() - 0.5) * 10),
          memory: Math.max(0, p.memory + (Math.random() - 0.5) * 100),
          state:
            Math.random() > 0.95
              ? ["Running", "Sleeping", "Waiting"][
                  Math.floor(Math.random() * 3)
                ]
              : p.state,
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // system stats + alerts
  useEffect(() => {
    if (processes.length === 0) return;

    const totalCpu = processes.reduce((sum, p) => sum + p.cpu, 0);
    const totalMem = processes.reduce((sum, p) => sum + p.memory, 0);
    const running = processes.filter((p) => p.state === "Running").length;

    setSystemStats({
      cpuUsage: Math.min(100, totalCpu / processes.length || 0),
      memoryUsage: totalMem,
      totalMemory: 16384,
      activeProcesses: running,
    });

    const newAlerts = [];
    processes.forEach((p) => {
      if (p.cpu > 80) {
        newAlerts.push({
          type: "cpu",
          pid: p.pid,
          name: p.name,
          value: p.cpu,
        });
      }
      if (p.memory > 1500) {
        newAlerts.push({
          type: "memory",
          pid: p.pid,
          name: p.name,
          value: p.memory,
        });
      }
      if (p.state === "Zombie") {
        newAlerts.push({ type: "zombie", pid: p.pid, name: p.name });
      }
    });
    setAlerts(newAlerts);
  }, [processes]);

  // filter + sort
  const filteredProcesses = processes
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.pid.toString().includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === "cpu") return b.cpu - a.cpu;
      if (sortBy === "memory") return b.memory - a.memory;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return a.pid - b.pid;
    });

  const killProcess = (pid) => {
    setProcesses((prev) => prev.filter((p) => p.pid !== pid));
    setSelectedProcess(null);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="pm-stat-card" style={{ borderLeftColor: color }}>
      <div>
        <p className="pm-stat-title">{title}</p>
        <p className="pm-stat-value" style={{ color }}>
          {value}
        </p>
        {subtitle && <p className="pm-stat-subtitle">{subtitle}</p>}
      </div>
      <Icon className="pm-stat-icon" size={40} style={{ color }} />
    </div>
  );

  const ProgressBar = ({ value, max, color }) => (
    <div className="pm-progress-track">
      <div
        className="pm-progress-fill"
        style={{
          width: `${(value / max) * 100}%`,
          background: color,
        }}
      />
    </div>
  );

  const memoryUsagePercent =
    (systemStats.memoryUsage / systemStats.totalMemory) * 100 || 0;

  return (
    <div className="pm-root">
      <div className="pm-container">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div className="pm-header-title">
            <Activity size={28} color="#2563eb" />
            <span>System Process Monitor</span>
          </div>
          <p className="pm-header-subtitle">
            Real-time process management and system monitoring (simulated data)
          </p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="pm-alert">
            <AlertTriangle size={18} color="#ef4444" style={{ marginTop: 2 }} />
            <div>
              <div className="pm-alert-title">
                Active Alerts ({alerts.length})
              </div>
              {alerts.slice(0, 3).map((alert, i) => (
                <div key={i} className="pm-alert-text">
                  {alert.type === "cpu" &&
                    `High CPU: ${alert.name} (${alert.value.toFixed(1)}%)`}
                  {alert.type === "memory" &&
                    `High Memory: ${alert.name} (${alert.value.toFixed(0)} MB)`}
                  {alert.type === "zombie" &&
                    `Zombie Process: ${alert.name}`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="pm-stats-grid">
          <StatCard
            title="CPU Usage"
            value={`${systemStats.cpuUsage.toFixed(1)}%`}
            icon={Cpu}
            color="#3b82f6"
          />
          <StatCard
            title="Memory Usage"
            value={`${(systemStats.memoryUsage / 1024).toFixed(1)} GB`}
            icon={HardDrive}
            color="#10b981"
            subtitle={`of ${(systemStats.totalMemory / 1024).toFixed(1)} GB`}
          />
          <StatCard
            title="Active Processes"
            value={systemStats.activeProcesses}
            icon={Activity}
            color="#f59e0b"
          />
          <StatCard
            title="Total Processes"
            value={processes.length}
            icon={Activity}
            color="#8b5cf6"
          />
        </div>

        {/* Resource usage */}
        <div className="pm-card">
          <div className="pm-card-title">System Resources</div>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="pm-resource-row-label">
                <span>CPU Usage</span>
                <span>{systemStats.cpuUsage.toFixed(1)}%</span>
              </div>
              <ProgressBar
                value={systemStats.cpuUsage}
                max={100}
                color={systemStats.cpuUsage > 80 ? "#ef4444" : "#3b82f6"}
              />
            </div>
            <div>
              <div className="pm-resource-row-label">
                <span>Memory Usage</span>
                <span>{memoryUsagePercent.toFixed(1)}%</span>
              </div>
              <ProgressBar
                value={systemStats.memoryUsage}
                max={systemStats.totalMemory}
                color={
                  memoryUsagePercent > 80 ? "#ef4444" : "#10b981"
                }
              />
            </div>
          </div>
        </div>

        {/* Process table */}
        <div className="pm-table-card">
          <div className="pm-table-header">
            <div className="pm-table-title">Process List</div>
            <div className="pm-table-controls">
              <div className="pm-search-wrapper">
                <Search className="pm-search-icon" />
                <input
                  type="text"
                  placeholder="Search processes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pm-search-input"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pm-select"
              >
                <option value="cpu">Sort by CPU</option>
                <option value="memory">Sort by Memory</option>
                <option value="name">Sort by Name</option>
                <option value="pid">Sort by PID</option>
              </select>
            </div>
          </div>

          <div className="pm-table-wrapper">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>PID</th>
                  <th>Process Name</th>
                  <th>State</th>
                  <th>CPU %</th>
                  <th>Memory (MB)</th>
                  <th>User</th>
                  <th>Start Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcesses.map((process) => (
                  <tr
                    key={process.pid}
                    onClick={() => setSelectedProcess(process)}
                  >
                    <td>{process.pid}</td>
                    <td style={{ fontWeight: 500 }}>{process.name}</td>
                    <td>
                      <span
                        className={
                          "pm-badge " +
                          (process.state === "Running"
                            ? "pm-badge-running"
                            : process.state === "Sleeping"
                            ? "pm-badge-sleeping"
                            : process.state === "Zombie"
                            ? "pm-badge-zombie"
                            : "pm-badge-waiting")
                        }
                      >
                        {process.state}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color:
                            process.cpu > 80 ? "#dc2626" : "#111827",
                          fontWeight: process.cpu > 80 ? 600 : 400,
                        }}
                      >
                        {process.cpu.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color:
                            process.memory > 1500
                              ? "#dc2626"
                              : "#111827",
                          fontWeight:
                            process.memory > 1500 ? 600 : 400,
                        }}
                      >
                        {process.memory.toFixed(0)}
                      </span>
                    </td>
                    <td style={{ color: "#4b5563" }}>{process.user}</td>
                    <td style={{ color: "#4b5563" }}>
                      {process.startTime}
                    </td>
                    <td>
                      <button
                        className="pm-link-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Kill process ${process.name} (PID: ${process.pid})?`
                            )
                          ) {
                            killProcess(process.pid);
                          }
                        }}
                      >
                        Kill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {selectedProcess && (
          <div
            className="pm-modal-backdrop"
            onClick={() => setSelectedProcess(null)}
          >
            <div
              className="pm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pm-modal-header">
                <div className="pm-modal-title">Process Details</div>
                <button
                  className="pm-modal-close"
                  onClick={() => setSelectedProcess(null)}
                >
                  <X size={22} />
                </button>
              </div>
              <div className="pm-modal-body">
                <div className="pm-modal-grid">
                  <div>
                    <div className="pm-modal-label">Process ID</div>
                    <div className="pm-modal-value">
                      {selectedProcess.pid}
                    </div>
                  </div>
                  <div>
                    <div className="pm-modal-label">Process Name</div>
                    <div className="pm-modal-value">
                      {selectedProcess.name}
                    </div>
                  </div>
                  <div>
                    <div className="pm-modal-label">State</div>
                    <div className="pm-modal-value">
                      {selectedProcess.state}
                    </div>
                  </div>
                  <div>
                    <div className="pm-modal-label">User</div>
                    <div className="pm-modal-value">
                      {selectedProcess.user}
                    </div>
                  </div>
                  <div>
                    <div className="pm-modal-label">CPU Usage</div>
                    <div className="pm-modal-value">
                      {selectedProcess.cpu.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="pm-modal-label">Memory Usage</div>
                    <div className="pm-modal-value">
                      {selectedProcess.memory.toFixed(0)} MB
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="pm-modal-label">Start Time</div>
                    <div className="pm-modal-value">
                      {selectedProcess.startTime}
                    </div>
                  </div>
                </div>
                <div className="pm-modal-actions">
                  <button
                    className="pm-btn-danger"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Kill process ${selectedProcess.name}?`
                        )
                      ) {
                        killProcess(selectedProcess.pid);
                      }
                    }}
                  >
                    Kill Process
                  </button>
                  <button
                    className="pm-btn-secondary"
                    onClick={() => setSelectedProcess(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessMonitor;
