import React, { useState } from 'react';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ChartPage: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [jsonData, setJsonData] = useState<any>(null);
  const [jsonCategory, setJsonCategory] = useState<string | null>(null);
  const formatCategoryName = (category: string): string => {
    return category
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase());
  };
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
        };
        reader.readAsArrayBuffer(file);
      } else if (file.name.endsWith('.json')) {
        reader.onload = () => {
          const data = JSON.parse(reader.result as string);
          setJsonData(data);
          
          // Filter categories: ignore "type" and "totalRows" and include only categories with more than one float value
          const filteredCategories = Object.keys(data).filter(category => {
            if (category === 'type' || category === 'totalRows') {
              return false;
            }
            const categoryData = data[category];
            const floatValues = Object.values(categoryData).filter(value => typeof value === 'number' && !isNaN(value));
            return floatValues.length > 1;  // Only keep categories with more than one float number
          });
          setJsonCategory(filteredCategories[0] || null);  // Default to the first valid category if available
        };
        reader.readAsText(file);
      }
    }
  };

  const handleGenerateChart = () => {
    let dataToUse = {};
    let labels: string[] = [];
    let data: number[] = [];

    if (csvData.length > 0 && selectedColumn) {
      // Processing CSV data
      const counts: { [key: string]: number } = {};
      csvData.forEach((row) => {
        const value = row[selectedColumn];
        if (value) {
          counts[value] = (counts[value] || 0) + 1;
        }
      });

      const sortedEntries = Object.entries(counts).sort((a, b) => {
        const aKey = isNaN(Number(a[0])) ? a[0] : Number(a[0]);
        const bKey = isNaN(Number(b[0])) ? b[0] : Number(b[0]);
        return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
      });

      labels = sortedEntries.map((entry) => entry[0]);
      data = sortedEntries.map((entry) => entry[1]);
    } else if (jsonData && jsonCategory) {
      // Processing JSON data based on selected category
      const categoryData = jsonData[jsonCategory] || {};

      labels = Object.keys(categoryData);
      data = Object.values(categoryData);
    }

    setChartData({
      labels,
      datasets: [
        {
          label: `Data from ${jsonCategory || 'CSV'}`,
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    });
  };

  const handleDownloadChart = () => {
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = (document.getElementById('chart') as HTMLCanvasElement).toDataURL();
    link.click();
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Chart Generator</h1>
      <input type="file" accept=".csv, .xlsx, .json" onChange={handleFileUpload} />
      {jsonData && (
        <div>
          <h2>Select Category</h2>
          <select
            onChange={(e) => setJsonCategory(e.target.value)}
            value={jsonCategory || ''}
            style={{ padding: '10px', margin: '10px' }}
          >
            {Object.keys(jsonData).filter(category => {
              if (category === 'type' || category === 'totalRows') {
                return false;
              }
              const categoryData = jsonData[category];
              const floatValues = Object.values(categoryData).filter(value => typeof value === 'number' && !isNaN(value));
              return floatValues.length > 1;  // Only show categories with more than one float value
            }).map((category) => (
              <option key={category} value={category}>
                {formatCategoryName(category)}
              </option>
            ))}
          </select>
        </div>
      )}
      {columns.length > 0 && !jsonData && (
        <div>
          <h2>Select Column</h2>
          <select
            onChange={(e) => setSelectedColumn(e.target.value)}
            value={selectedColumn || ''}
            style={{ padding: '10px', margin: '10px' }}
          >
            <option value="" disabled>
              Select a column
            </option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        onClick={handleGenerateChart}
        disabled={!selectedColumn && !jsonCategory}
        style={{
          padding: '10px 20px',
          margin: '10px',
          fontSize: '16px',
        }}
      >
        Generate Chart
      </button>
      {chartData && (
        <div style={{ width: '90%', height: '70%', overflow: 'auto' }}>
          <Bar
            id="chart"
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              plugins: {
                legend: { position: 'top' },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Percentage',
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: selectedColumn || jsonCategory || '',
                  },
                },
              },
            }}
          />
          <button
            onClick={handleDownloadChart}
            style={{
              padding: '10px 20px',
              margin: '20px',
              fontSize: '16px',
            }}
          >
            Download Chart
          </button>
        </div>
      )}
    </div>
  );
};

export default ChartPage;
