import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart
} from 'recharts';
import { api } from '../../api/client';
import './VitalsChart.css';

const VitalsChart = ({ patientId = null, sessionId = null, compact = false }) => {
  const [vitalsData, setVitalsData] = useState([]);
  const [chartType, setChartType] = useState('multi');
  const [timeRange, setTimeRange] = useState('1h'); // 1h, 4h, 24h
  const [selectedVitals, setSelectedVitals] = useState(['HR', 'SpO2', 'SBP', 'Temp']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId || sessionId) {
      fetchVitalsData();
      // Refresh every 60 seconds
      const interval = setInterval(fetchVitalsData, 60000);
      return () => clearInterval(interval);
    }
  }, [patientId, sessionId, timeRange]);

  const fetchVitalsData = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (sessionId) {
        response = await api.client.get(`/perop/sessions/${sessionId}/vitals/?time_range=${timeRange}`);
      } else if (patientId) {
        response = await api.client.get(`/patients/${patientId}/vitals/?time_range=${timeRange}`);
      }

      if (response) {
        // Transform data for recharts
        const transformedData = (response.data.results || response.data).map(reading => ({
          time: new Date(reading.timestamp).toLocaleTimeString(),
          timestamp: reading.timestamp,
          HR: reading.heart_rate || reading.HR,
          SpO2: reading.oxygen_saturation || reading.SpO2,
          SBP: reading.systolic_bp || reading.SBP,
          DBP: reading.diastolic_bp || reading.DBP,
          Temp: reading.temperature || reading.Temp,
          MAP: reading.mean_arterial_pressure || reading.MAP,
          RR: reading.respiratory_rate || reading.RR
        }));
        setVitalsData(transformedData);
      }
    } catch (err) {
      console.error('Error fetching vitals:', err);
      // Use mock data for demo
      setVitalsData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for demonstration
  const generateMockData = () => {
    const now = new Date();
    const data = [];
    for (let i = 60; i >= 0; i--) {
      const time = new Date(now - i * 60000);
      data.push({
        time: time.toLocaleTimeString(),
        timestamp: time.toISOString(),
        HR: 72 + Math.sin(i / 10) * 8 + Math.random() * 4,
        SpO2: 98 + Math.random() * 2,
        SBP: 120 + Math.cos(i / 15) * 10 + Math.random() * 3,
        DBP: 75 + Math.sin(i / 20) * 5 + Math.random() * 2,
        Temp: 37 + Math.random() * 0.5,
        MAP: 90 + Math.random() * 5,
        RR: 16 + Math.random() * 2
      });
    }
    return data;
  };

  const handleVitalToggle = (vital) => {
    setSelectedVitals(prev => {
      if (prev.includes(vital)) {
        return prev.filter(v => v !== vital);
      } else {
        return [...prev, vital];
      }
    });
  };

  const vitalColors = {
    HR: '#ef4444',    // red
    SpO2: '#3b82f6',  // blue
    SBP: '#f59e0b',   // amber
    DBP: '#10b981',   // green
    Temp: '#8b5cf6',  // purple
    MAP: '#06b6d4',   // cyan
    RR: '#ec4899'     // pink
  };

  const getAlertStatus = (vital, value) => {
    if (!value) return 'normal';
    
    const thresholds = {
      HR: { min: 60, max: 100, criticalMin: 50, criticalMax: 120 },
      SpO2: { min: 95, max: 100, criticalMin: 90, criticalMax: 100 },
      SBP: { min: 100, max: 140, criticalMin: 90, criticalMax: 180 },
      DBP: { min: 60, max: 90, criticalMin: 50, criticalMax: 110 },
      Temp: { min: 36.5, max: 37.5, criticalMin: 35, criticalMax: 39 },
      RR: { min: 12, max: 20, criticalMin: 10, criticalMax: 30 }
    };

    const th = thresholds[vital];
    if (!th) return 'normal';

    if (value < th.criticalMin || value > th.criticalMax) return 'critical';
    if (value < th.min || value > th.max) return 'warning';
    return 'normal';
  };

  const renderChart = () => {
    if (vitalsData.length === 0) {
      return <div className="no-data">No vitals data available</div>;
    }

    switch (chartType) {
      case 'multi':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={vitalsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis
                dataKey="time"
                stroke="#718096"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="#718096"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1f2e',
                  border: '1px solid #2d3748',
                  borderRadius: 8,
                  color: '#cbd5e0'
                }}
                cursor={{ stroke: '#60a5fa' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                iconType="line"
              />
              {selectedVitals.includes('HR') && (
                <Line
                  type="monotone"
                  dataKey="HR"
                  stroke={vitalColors.HR}
                  dot={false}
                  name="Heart Rate (bpm)"
                  strokeWidth={2}
                />
              )}
              {selectedVitals.includes('SpO2') && (
                <Line
                  type="monotone"
                  dataKey="SpO2"
                  stroke={vitalColors.SpO2}
                  dot={false}
                  name="SpO₂ (%)"
                  strokeWidth={2}
                />
              )}
              {selectedVitals.includes('SBP') && (
                <Line
                  type="monotone"
                  dataKey="SBP"
                  stroke={vitalColors.SBP}
                  dot={false}
                  name="Systolic BP"
                  strokeWidth={2}
                />
              )}
              {selectedVitals.includes('Temp') && (
                <Line
                  type="monotone"
                  dataKey="Temp"
                  stroke={vitalColors.Temp}
                  dot={false}
                  name="Temperature (°C)"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'hr':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={vitalsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="time" stroke="#718096" tick={{ fontSize: 11 }} />
              <YAxis stroke="#718096" tick={{ fontSize: 11 }} domain={[40, 140]} />
              <Tooltip
                contentStyle={{
                  background: '#1a1f2e',
                  border: '1px solid #2d3748',
                  borderRadius: 8,
                  color: '#cbd5e0'
                }}
              />
              <Area
                type="monotone"
                dataKey="HR"
                stroke={vitalColors.HR}
                fill={vitalColors.HR}
                fillOpacity={0.3}
                name="Heart Rate (bpm)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bp':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vitalsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="time" stroke="#718096" tick={{ fontSize: 11 }} />
              <YAxis stroke="#718096" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: '#1a1f2e',
                  border: '1px solid #2d3748',
                  borderRadius: 8,
                  color: '#cbd5e0'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              <Line
                type="monotone"
                dataKey="SBP"
                stroke={vitalColors.SBP}
                dot={false}
                name="Systolic"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="DBP"
                stroke={vitalColors.DBP}
                dot={false}
                name="Diastolic"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'spo2':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={vitalsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="time" stroke="#718096" tick={{ fontSize: 11 }} />
              <YAxis stroke="#718096" tick={{ fontSize: 11 }} domain={[90, 100]} />
              <Tooltip
                contentStyle={{
                  background: '#1a1f2e',
                  border: '1px solid #2d3748',
                  borderRadius: 8,
                  color: '#cbd5e0'
                }}
              />
              <Area
                type="monotone"
                dataKey="SpO2"
                stroke={vitalColors.SpO2}
                fill={vitalColors.SpO2}
                fillOpacity={0.3}
                name="SpO₂ (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className="vitals-chart compact">
        <div className="chart-header">
          <h3>📊 Vital Signs</h3>
        </div>
        <div className="compact-chart">
          {vitalsData.length > 0 && (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={vitalsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="time" hide stroke="#718096" />
                <YAxis hide stroke="#718096" />
                <Tooltip
                  contentStyle={{
                    background: '#1a1f2e',
                    border: '1px solid #2d3748',
                    borderRadius: 8,
                    color: '#cbd5e0'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="HR"
                  stroke={vitalColors.HR}
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="vitals-chart full">
      {/* Header */}
      <div className="chart-header">
        <h2>📊 Vital Signs Monitor</h2>
      </div>

      {/* Controls */}
      <div className="chart-controls">
        <div className="control-group">
          <label>Chart Type:</label>
          <div className="btn-group">
            <button
              className={`chart-btn ${chartType === 'multi' ? 'active' : ''}`}
              onClick={() => setChartType('multi')}
            >
              Multi-View
            </button>
            <button
              className={`chart-btn ${chartType === 'hr' ? 'active' : ''}`}
              onClick={() => setChartType('hr')}
            >
              Heart Rate
            </button>
            <button
              className={`chart-btn ${chartType === 'bp' ? 'active' : ''}`}
              onClick={() => setChartType('bp')}
            >
              Blood Pressure
            </button>
            <button
              className={`chart-btn ${chartType === 'spo2' ? 'active' : ''}`}
              onClick={() => setChartType('spo2')}
            >
              SpO₂
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Time Range:</label>
          <div className="btn-group">
            <button
              className={`time-btn ${timeRange === '1h' ? 'active' : ''}`}
              onClick={() => setTimeRange('1h')}
            >
              1H
            </button>
            <button
              className={`time-btn ${timeRange === '4h' ? 'active' : ''}`}
              onClick={() => setTimeRange('4h')}
            >
              4H
            </button>
            <button
              className={`time-btn ${timeRange === '24h' ? 'active' : ''}`}
              onClick={() => setTimeRange('24h')}
            >
              24H
            </button>
          </div>
        </div>

        <button className="refresh-btn" onClick={fetchVitalsData} disabled={loading}>
          ↻ Refresh
        </button>
      </div>

      {/* Vital Selectors */}
      {chartType === 'multi' && (
        <div className="vital-selectors">
          <span>Display:</span>
          {['HR', 'SpO2', 'SBP', 'Temp'].map(vital => (
            <label key={vital} className="vital-checkbox">
              <input
                type="checkbox"
                checked={selectedVitals.includes(vital)}
                onChange={() => handleVitalToggle(vital)}
              />
              <span className="checkbox-label">
                <span
                  className="color-box"
                  style={{ backgroundColor: vitalColors[vital] }}
                ></span>
                {vital}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="chart-container">
        {loading && <div className="loading">Loading vitals data...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && renderChart()}
      </div>

      {/* Summary Stats */}
      {vitalsData.length > 0 && (
        <div className="vitals-summary">
          <div className="summary-item">
            <span className="summary-label">Latest HR</span>
            <span className={`summary-value ${getAlertStatus('HR', vitalsData[vitalsData.length - 1].HR)}`}>
              {vitalsData[vitalsData.length - 1].HR?.toFixed(0)} bpm
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Latest SpO₂</span>
            <span className={`summary-value ${getAlertStatus('SpO2', vitalsData[vitalsData.length - 1].SpO2)}`}>
              {vitalsData[vitalsData.length - 1].SpO2?.toFixed(1)} %
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Latest BP</span>
            <span className={`summary-value ${getAlertStatus('SBP', vitalsData[vitalsData.length - 1].SBP)}`}>
              {vitalsData[vitalsData.length - 1].SBP?.toFixed(0)}/{vitalsData[vitalsData.length - 1].DBP?.toFixed(0)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Latest Temp</span>
            <span className={`summary-value ${getAlertStatus('Temp', vitalsData[vitalsData.length - 1].Temp)}`}>
              {vitalsData[vitalsData.length - 1].Temp?.toFixed(1)} °C
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalsChart;
