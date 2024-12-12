import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './StatisticsAndChart.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const StatisticsAndChartPage: React.FC = () => {
  const [statistics, setStatistics] = useState<Record<string, number>>({});
  const [employmentStats, setEmploymentStats] = useState<Record<string, number>>({});
  const [occupatiStats, setOccupatiStats] = useState<Record<string, number>>({});
  const [totalRows, setTotalRows] = useState<number>(0);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string>("LICENTA");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();

      if (file.name.endsWith('.csv')) {
        reader.onload = () => {
          const result = Papa.parse(reader.result as string, { header: true });
          const keys = Object.keys(result.data[0] || {});
          setColumns(keys);
          setCsvData(result.data);
          processStatistics(result.data);
          processEmploymentStatistics(result.data);
          processOccupatiStatistics(result.data);
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx')) {
        reader.onload = () => {
          const workbook = XLSX.read(reader.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          const keys = Object.keys(data[0] || {});
          setColumns(keys);
          setCsvData(data);
          processStatistics(data);
          processEmploymentStatistics(data);
          processOccupatiStatistics(data);
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const processStatistics = (data: any[]) => {
    const categories = {
      "Mi-am continuat studiile": "B1.1.1",
      "M-am angajat": "B1.2.1",
      "Mi-am continuat activitatea la locul de muncă pe care îl aveam deja": "B1.3.1",
      "Mi-am deschis propria afacere / Am fost liber profesionist": ["B1.4.1", "B1.5.1"],
      "Mi-am căutat loc de muncă, dar nu am reușit să mă angajezi": "B1.6.1",
      "Nu am avut loc de muncă în primele 12 luni după absolvirea studiilor masterale": "B1.7.1",
      "Alta situație": "B1.8.1",
    };

    const stats: Record<string, number> = {};
    let rowCount = 0;

    data.forEach((row) => {
      rowCount++;
      for (const [key, value] of Object.entries(categories)) {
        if (Array.isArray(value)) {
          if (value.some((col) => row[col] && row[col] !== 0)) {
            stats[key] = (stats[key] || 0) + 1;
          }
        } else {
          if (row[value] && row[value] !== 0) {
            stats[key] = (stats[key] || 0) + 1;
          }
        }
      }
    });

    Object.keys(stats).forEach((key) => {
      stats[key] = (stats[key] / rowCount) * 100;
    });

    setStatistics(stats);
    setTotalRows(rowCount);
  };

  const processEmploymentStatistics = (data: any[]) => {
    const employmentCategories = {
      "Angajat": ["B1.2.1", "B1.3.1"],
      "Au propria afacere / sunt liber profesioniști": ["B1.4.1", "B1.5.1"],
      "Continuă studiile": ["B1.1.1"],
      "Continua studiile și nu au loc de muncă": ["B1.1.1", "B1.6.1", "B1.7.1"],
      "Nu sunt inserați pe piața muncii și nu urmează programe de studiu": ["B1.6.1", "B1.7.1"],
    };

    const employmentStats: Record<string, number> = {};
    let rowCount = 0;

    data.forEach((row) => {
      rowCount++;
      for (const [key, value] of Object.entries(employmentCategories)) {
        if (Array.isArray(value)) {
          if (value.some((col) => row[col] && row[col] !== 0)) {
            employmentStats[key] = (employmentStats[key] || 0) + 1;
          }
        } else {
          if (row[value] && row[value] !== 0) {
            employmentStats[key] = (employmentStats[key] || 0) + 1;
          }
        }
      }
    });

    Object.keys(employmentStats).forEach((key) => {
      employmentStats[key] = (employmentStats[key] / rowCount) * 100;
    });

    setEmploymentStats(employmentStats);
  };

  const processOccupatiStatistics = (data: any[]) => {
    const occupatiCategories = ["B1.2.1", "B1.3.1", "B1.4.1", "B1.5.1"];
    let rowCount = 0;
    let occupatiCount = 0;

    data.forEach((row) => {
      rowCount++;
      if (occupatiCategories.some((col) => row[col] && row[col] !== 0)) {
        occupatiCount++;
      }
    });

    const ocupatiPercentage = (occupatiCount / rowCount) * 100;
    const neocupatiPercentage = 100 - ocupatiPercentage;

    setOccupatiStats({
      "Ocupati": ocupatiPercentage,
      "Neocupati": neocupatiPercentage,
    });
  };

  const exportAllStatisticsAsJSON = (type: string) => {
    const dataToExport = {
      type,
      totalRows,
      statistics,
      employmentStats,
      occupatiStats,
    };

    const jsonData = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type}_statistics.json`;
    link.click();
  };

  const handleGenerateChart = () => {
    if (selectedColumn) {
      const counts: Record<string, number> = {};
      csvData.forEach((row) => {
        const value = row[selectedColumn];
        if (value) {
          counts[value] = (counts[value] || 0) + 1;
        }
      });

      const sortedEntries = Object.entries(counts).sort(([keyA], [keyB]) => {
        if (!isNaN(Number(keyA)) && !isNaN(Number(keyB))) {
          return Number(keyA) - Number(keyB);
        }
        return keyA.localeCompare(keyB);
      });

      const labels = sortedEntries.map(([key]) => key);
      const data = sortedEntries.map(([, value]) => value);

      setChartData({
        labels,
        datasets: [
          {
            label: `Occurrences of ${selectedColumn}`,
            data,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      });
    }
  };

  return (
    <div className="statistics-and-chart">
      <h1>Statistics and Chart</h1>
      <input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} />
      <div className="statistics-section">
        <h2>General Statistics</h2>
        <table>
        <thead>
            <tr>
              <th>Category</th>
              <th>Percentage (%)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(statistics).map(([category, percent]) => (
              <tr key={category}>
                <td>{category}</td>
                <td>{percent.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Employment Statistics</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Percentage (%)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(employmentStats).map(([category, percent]) => (
              <tr key={category}>
                <td>{category}</td>
                <td>{percent.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Occupational Statistics</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Percentage (%)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(occupatiStats).map(([category, percent]) => (
              <tr key={category}>
                <td>{category}</td>
                <td>{percent.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <br />
      <button onClick={() => exportAllStatisticsAsJSON(selectedType)}>
        Export All Statistics as JSON
      </button>
      <br />
      <div className="chart-section">
        <h2>Chart Generator</h2>
        <select onChange={(e) => setSelectedColumn(e.target.value)}>
          <option value="" disabled>Select a column</option>
          {columns.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
        <button onClick={handleGenerateChart}>Generate Chart</button>
        {chartData && (
          <Bar data={chartData} />
        )}
      </div>
    </div>
  );
};

export default StatisticsAndChartPage;

