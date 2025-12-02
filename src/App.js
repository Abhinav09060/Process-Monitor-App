import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, AlertTriangle, X, Search } from 'lucide-react';
import './App.css';

function App() {
  const [processes, setProcesses] = useState([]);
  const [systemStats, setSystemStats] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    totalMemory: 16384,
    activeProcesses: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('cpu');
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Generate realistic process data
  const generateProcesses = () => {
    const processNames = [
      'chrome.exe', 'firefox.exe', 'code.exe', 'node.exe', 'python.exe',
      'docker.exe', 'postgres.exe', 'nginx.exe', 'java.exe', 'explorer.exe',
      'system', 'svchost.exe', 'Teams.exe', 'Slack.exe', 'Spotify.exe'
    ];
    
    const states = ['Running', 'Sleeping', 'Waiting', 'Zombie'];
    
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
        user: i % 3 === 0 ? 'root' : 'user',
        startTime: new Date(Date.now() - Math.random() * 86400000).toLocaleTimeString()
      };
    });
  };

  // Initialize and update processes
  useEffect(() => {
    setProcesses(generateProcesses());
    
    const interval = setInterval(() => {
      setProcesses(prev => prev.map(p => ({
        ...p,
        cpu: Math.max(0, p.cpu + (Math.random() - 0.5) * 10),
        memory: Math.max(0, p.memory + (Math.random() - 0.5) * 100),
        state: Math.random() > 0.95 ? 
          ['Running', 'Sleeping', 'Waiting'][Math.floor(Math.random() * 3)] : 
          p.state
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Update system stats
  useEffect(() => {
    const totalCpu = processes.reduce((sum, p) => sum + p.cpu, 0);
    const totalMem = processes.reduce((sum, p) => sum + p.memory, 0);
    const running = processes.filter(p => p.state === 'Running').length;

    setSystemStats({
      cpuUsage: Math.min(100, totalCpu / processes.length || 0),
      memoryUsage: totalMem,
      totalMemory: 16384,
      activeProcesses: running
    });

    // Check for alerts
    const newAlerts = [];
    processes.forEach(p => {
      if (p.cpu > 80) {
        newAlerts.push({ type: 'cpu', pid: p.pid, name: p.name, value: p.cpu });
      }
      if (p.memory > 1500) {
        newAlerts.push({ type: 'memory', pid: p.pid, name: p.name, value: p.memory });
      }
      if (p.state === 'Zombie') {
        newAlerts.push({ type: 'zombie', pid: p.pid, name: p.name });
      }
    });
    setAlerts(newAlerts);
  }, [processes]);

  // Filter and sort processes
  const filteredProcesses = processes
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 p.pid.toString().includes(searchTerm))
    .sort((a, b) => {
      if (sortBy === 'cpu') return b.cpu - a.cpu;
      if (sortBy === 'memory') return b.memory - a.memory;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.pid - b.pid;
    });

  const killProcess = (pid) => {
    setProcesses(prev => prev.filter(p => p.pid !== pid));
    setSelectedProcess(null);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Icon className="w-12 h-12 opacity-20" style={{ color }} />
      </div>
    </div>
  );

  const ProgressBar = ({ value, max, color }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="h-2 rounded-full transition-all duration-500"
        style={{ 
          width: `${(value / max) * 100}%`,
          backgroundColor: color 
        }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            System Process Monitor
          </h1>
          <p className="text-gray-600 mt-1">Real-time process management and system monitoring</p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <p className="font-semibold text-red-800">Active Alerts ({alerts.length})</p>
                <div className="mt-2 space-y-1">
                  {alerts.slice(0, 3).map((alert, i) => (
                    <p key={i} className="text-sm text-red-700">
                      {alert.type === 'cpu' && `High CPU: ${alert.name} (${alert.value.toFixed(1)}%)`}
                      {alert.type === 'memory' && `High Memory: ${alert.name} (${alert.value.toFixed(0)} MB)`}
                      {alert.type === 'zombie' && `Zombie Process: ${alert.name}`}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
            subtitle={`of ${systemStats.totalMemory / 1024} GB`}
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

        {/* Resource Usage Bars */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">System Resources</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">CPU Usage</span>
                <span className="text-gray-600">{systemStats.cpuUsage.toFixed(1)}%</span>
              </div>
              <ProgressBar 
                value={systemStats.cpuUsage} 
                max={100} 
                color={systemStats.cpuUsage > 80 ? '#ef4444' : '#3b82f6'} 
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Memory Usage</span>
                <span className="text-gray-600">
                  {((systemStats.memoryUsage / systemStats.totalMemory) * 100).toFixed(1)}%
                </span>
              </div>
              <ProgressBar 
                value={systemStats.memoryUsage} 
                max={systemStats.totalMemory} 
                color={systemStats.memoryUsage / systemStats.totalMemory > 0.8 ? '#ef4444' : '#10b981'} 
              />
            </div>
          </div>
        </div>

        {/* Process Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold">Process List</h2>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search processes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cpu">Sort by CPU</option>
                  <option value="memory">Sort by Memory</option>
                  <option value="name">Sort by Name</option>
                  <option value="pid">Sort by PID</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Process Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPU %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Memory (MB)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProcesses.map((process) => (
                  <tr 
                    key={process.pid} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedProcess(process)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{process.pid}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{process.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        process.state === 'Running' ? 'bg-green-100 text-green-800' :
                        process.state === 'Sleeping' ? 'bg-blue-100 text-blue-800' :
                        process.state === 'Zombie' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {process.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={process.cpu > 80 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                        {process.cpu.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={process.memory > 1500 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                        {process.memory.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{process.user}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{process.startTime}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Kill process ${process.name} (PID: ${process.pid})?`)) {
                            killProcess(process.pid);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 font-medium"
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

        {/* Process Details Modal */}
        {selectedProcess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedProcess(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold">Process Details</h3>
                <button onClick={() => setSelectedProcess(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Process ID</p>
                    <p className="text-lg font-semibold">{selectedProcess.pid}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Process Name</p>
                    <p className="text-lg font-semibold">{selectedProcess.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">State</p>
                    <p className="text-lg font-semibold">{selectedProcess.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User</p>
                    <p className="text-lg font-semibold">{selectedProcess.user}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CPU Usage</p>
                    <p className="text-lg font-semibold">{selectedProcess.cpu.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Memory Usage</p>
                    <p className="text-lg font-semibold">{selectedProcess.memory.toFixed(0)} MB</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Start Time</p>
                    <p className="text-lg font-semibold">{selectedProcess.startTime}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      if (window.confirm(`Kill process ${selectedProcess.name}?`)) {
                        killProcess(selectedProcess.pid);
                      }
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Kill Process
                  </button>
                  <button
                    onClick={() => setSelectedProcess(null)}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
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
}

export default App;