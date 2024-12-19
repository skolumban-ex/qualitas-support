import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './StatisticsPage.css';

interface DataRow {
  status: string;
  percentage: string;
}

interface Filter {
  column: string;
  value: string;
  logic: string;
}

interface FilterGroup {
  filters: Filter[];
  logic: string;
}

const StatisticsPage: React.FC = () => {
  const [data, setData] = useState<DataRow[]>([
    { status: 'Angajați', percentage: '' },
    { status: 'Au propria afacere / sunt liber profesioniști', percentage: '' },
    { status: 'Continuă studiile', percentage: '' },
    { status: 'Continuă studiile și nu au loc de muncă', percentage: '' },
    { status: 'Nu sunt inserați pe piața muncii și nu urmează programe de studiu', percentage: '' },
  ]);

  const [rawData, setRawData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const workbook = XLSX.read(reader.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const sheetData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        setRawData(sheetData);
        setColumns(Object.keys(sheetData[0] || {}));
        setTotalRows(sheetData.length);
      };
      reader.readAsBinaryString(file);
    }
  };

  const calculatePercentage = () => {
    let filteredRows = rawData;

    filterGroups.forEach((group, groupIndex) => {
      let groupFilteredRows = rawData;

      group.filters.forEach((filter, filterIndex) => {
        const { column, value, logic } = filter;

        const currentFilteredRows = groupFilteredRows.filter((row) => {
          const cellValue = row[column];
          return typeof cellValue === 'number' ? cellValue === Number(value) : cellValue === value;
        });

        if (filterIndex === 0) {
          groupFilteredRows = currentFilteredRows;
        } else {
          if (logic === 'AND') {
            groupFilteredRows = groupFilteredRows.filter((row) => currentFilteredRows.includes(row));
          } else if (logic === 'OR') {
            groupFilteredRows = [...new Set([...groupFilteredRows, ...currentFilteredRows])];
          }
        }
      });

      if (groupIndex === 0) {
        filteredRows = groupFilteredRows;
      } else {
        const groupLogic = filterGroups[groupIndex - 1].logic;
        if (groupLogic === 'AND') {
          filteredRows = filteredRows.filter((row) => groupFilteredRows.includes(row));
        } else if (groupLogic === 'OR') {
          filteredRows = [...new Set([...filteredRows, ...groupFilteredRows])];
        }
      }
    });

    return ((filteredRows.length / totalRows) * 100).toFixed(2);
  };

  const handleCellClick = (index: number) => {
    if (rawData.length === 0 || columns.length === 0) {
      alert('Please upload a file first to enable percentage calculation.');
      return;
    }

    if (selectedCell === index) {
      setSelectedCell(null);
    } else {
      setSelectedCell(index);
      setFilterGroups([]);
    }
  };

  const addFilterGroup = () => {
    setFilterGroups((prev) => [
      ...prev,
      { filters: [{ column: columns[0] || '', value: '', logic: 'AND' }], logic: 'AND' },
    ]);
  };

  const handleFilterChange = (
    groupIndex: number,
    filterIndex: number,
    field: 'column' | 'value' | 'logic',
    value: string
  ) => {
    const updatedGroups = [...filterGroups];
    updatedGroups[groupIndex].filters[filterIndex] = {
      ...updatedGroups[groupIndex].filters[filterIndex],
      [field]: value,
    };
    setFilterGroups(updatedGroups);
  };

  const handleGroupLogicChange = (groupIndex: number, value: string) => {
    const updatedGroups = [...filterGroups];
    updatedGroups[groupIndex].logic = value;
    setFilterGroups(updatedGroups);
  };

  const removeFilterFromGroup = (groupIndex: number, filterIndex: number) => {
    const updatedGroups = [...filterGroups];
    updatedGroups[groupIndex].filters = updatedGroups[groupIndex].filters.filter(
      (_, i) => i !== filterIndex
    );
    
    if (updatedGroups[groupIndex].filters.length === 0) {
      updatedGroups.splice(groupIndex, 1);
    }
    
    setFilterGroups(updatedGroups);
  };

  const removeFilterGroup = (groupIndex: number) => {
    setFilterGroups((prev) => prev.filter((_, i) => i !== groupIndex));
  };

  const getFilterDisplay = () => {
    return filterGroups
      .map((group, groupIndex) => {
        const groupFilters = group.filters
          .map((filter, index) => {
            if (index === 0) return `${filter.column} ${filter.value}`;
            return `${filter.logic} ${filter.column} ${filter.value}`;
          })
          .join(' ');
        
        if (groupIndex < filterGroups.length - 1) {
          return `(${groupFilters}) ${group.logic}`;
        }
        return `(${groupFilters})`;
      })
      .join(' ');
  };

  const confirmCalculation = () => {
    if (selectedCell === null) return;

    const calculatedPercentage = calculatePercentage();
    setData((prev) =>
      prev.map((row, i) =>
        i === selectedCell ? { ...row, percentage: `${calculatedPercentage}%` } : row
      )
    );
    setSelectedCell(null);
  };

  const addFilterToGroup = (groupIndex: number) => {
    const updatedGroups = [...filterGroups];
    updatedGroups[groupIndex].filters.push({
      column: columns[0] || '',
      value: '',
      logic: 'AND',
    });
    setFilterGroups(updatedGroups);
  };

  return (
    <div className="statistics-page">
      <h1>Statistics Page</h1>

      <div className="upload-section">
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileUpload}
          className="file-input"
        />
        {rawData.length > 0 && (
          <p className="file-info">
            Loaded {totalRows} rows with {columns.length} columns
          </p>
        )}
      </div>

      {rawData.length > 0 && (
        <div className="table-container">
          <table className="statistics-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className={selectedCell === index ? 'selected' : ''}>
                  <td>{row.status}</td>
                  <td 
                    onClick={() => handleCellClick(index)}
                    className="clickable"
                  >
                    {row.percentage || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCell !== null && (
        <div className="calculation-section">
          <h2>Calculate Percentage for: {data[selectedCell].status}</h2>

          <div className="filters-container">
            {filterGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="filter-group">
                <div className="group-header">
                  <h3>Filter Group {groupIndex + 1}</h3>
                  <button
                    onClick={() => removeFilterGroup(groupIndex)}
                    className="remove-button"
                  >
                    Remove Group
                  </button>
                </div>

                {group.filters.map((filter, filterIndex) => (
                  <div key={filterIndex} className="filter-row">
                    {filterIndex > 0 && (
                      <select
                        value={filter.logic}
                        onChange={(e) =>
                          handleFilterChange(groupIndex, filterIndex, 'logic', e.target.value)
                        }
                        className="logic-select"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    <select
                      value={filter.column}
                      onChange={(e) =>
                        handleFilterChange(groupIndex, filterIndex, 'column', e.target.value)
                      }
                      className="column-select"
                    >
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) =>
                        handleFilterChange(groupIndex, filterIndex, 'value', e.target.value)
                      }
                      placeholder="Enter value"
                      className="value-input"
                    />
                    {filterIndex > 0 && (
                      <button
                        onClick={() => removeFilterFromGroup(groupIndex, filterIndex)}
                        className="remove-button"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <div className="group-footer">
                  <button
                    onClick={() => addFilterToGroup(groupIndex)}
                    className="add-button"
                  >
                    Add Filter
                  </button>
                  {groupIndex < filterGroups.length - 1 && (
                    <div className="group-logic">
                      <label>Group Logic:</label>
                      <select
                        value={group.logic}
                        onChange={(e) => handleGroupLogicChange(groupIndex, e.target.value)}
                        className="logic-select"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button onClick={addFilterGroup} className="add-group-button">
              Add Filter Group
            </button>
          </div>

          {filterGroups.length > 0 && (
            <div className="filter-display">
              <strong>Current Filters:</strong>
              <p>{getFilterDisplay()}</p>
            </div>
          )}

          <button onClick={confirmCalculation} className="confirm-button">
            Calculate and Update
          </button>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;