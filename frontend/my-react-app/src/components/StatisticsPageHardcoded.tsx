import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './StatisticsPage.css';
const StatisticsPageHC: React.FC = () => {
  const [statistics, setStatistics] = useState<Record<string, number>>({});
  const [employmentStats, setEmploymentStats] = useState<Record<string, number>>({});
  const [occupatiStats, setOccupatiStats] = useState<Record<string, number>>({});
  const [totalRows, setTotalRows] = useState<number>(0);
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      if (file.name.endsWith('.xlsx')) {
        reader.onload = () => {
          const workbook = XLSX.read(reader.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
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
        "Continua studiile și nu au loc de muncă": ["B1.1.1", "B1.6.1","B1.7.1"],
        "Nu sunt inserați pe piața muncii și nu urmează programe de studiu": ["B1.6.1","B1.7.1"],
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
  const [selectedType, setSelectedType] = useState<string>("LICENTA");
const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  setSelectedType(event.target.value);
};
  return (
    <div className="statistics-page">
      <h1>Statistics Page</h1>
      {}
      <div className="uploader-container">
        <input 
          type="file" 
          accept=".xlsx" 
          onChange={handleFileUpload} 
          className="file-input" 
        />
      </div>
      {}
      <div className="table-container">
        <h2>General Statistics</h2>
        {totalRows > 0 ? (
          <table className="statistics-table">
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
        ) : (
          <p>No data available. Please upload a file to see the results.</p>
        )}
      </div>
      {}
      <div className="table-container">
        <h2>Employment Statistics</h2>
        {totalRows > 0 ? (
          <table className="statistics-table">
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
        ) : (
          <p>No data available. Please upload a file to see the results.</p>
        )}
      </div>
      {}
      <div className="table-container">
        <h2>Employed / Unemployed Statistics</h2>
        {totalRows > 0 ? (
          <table className="statistics-table">
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
        ) : (
          <p>No data available. Please upload a file to see the results.</p>
        )}
      </div>
      <div className="export-container">
    <label htmlFor="type-select">Select Graduate Type:</label>
    <select
      id="type-select"
      value={selectedType}
      onChange={handleTypeChange}
      className="type-select"
    >
      <option value="LICENTA">Licență</option>
      <option value="MASTERAT">Masterat</option>
      <option value="DOCTORAT">Doctorat</option>
    </select>
    <button
      onClick={() => exportAllStatisticsAsJSON(selectedType)}
      className="export-button"
    >
      Export Statistics
    </button>
  </div>
    </div>
  );
};
export default StatisticsPageHC;