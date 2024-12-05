import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Paper,
  Select,
  MenuItem,
} from "@mui/material";
import './DynamicTable.css';

interface DynamicMultiHeaderTableProps {
  headers: string[][];
  data: string[][];
  columnNames: string[];
  selectedColumns: string[];
  onAddColumn: (column: string, rowIndex: number) => void;
  onExportJSON: (json: any) => void;
}

const DynamicMultiHeaderTable: React.FC<DynamicMultiHeaderTableProps> = ({
  headers,
  data,
  columnNames,
  selectedColumns,
  onExportJSON,
  onAddColumn,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState<{ [key: number]: boolean }>({});
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [templateName, setTemplateName] = useState<string>("");

  const handleColumnSelection = (column: string, rowIndex: number) => {
    if (!selectedColumns.includes(column)) {
      onAddColumn(column, rowIndex);
      setDropdownVisible((prev) => ({ ...prev, [rowIndex - 1]: !prev[rowIndex - 1] }));
    }
  };

  const handleInputChange = (rowIndex: number, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [`${rowIndex}`]: value,
    }));
  };

  const toggleDropdown = (rowIndex: number) => {
    setDropdownVisible((prev) => ({
      ...prev,
      [rowIndex]: !prev[rowIndex],
    }));
  };

  const handleExportJSON = () => {
    if (!templateName.trim()) {
      alert("Please enter a template name before exporting.");
      return;
    }

    const tableData = {
      encode: {
        headers: headers.map((row) =>
          row.reduce((acc, header, idx) => {
            acc[`key${idx + 1}`] = header;
            return acc;
          }, {})
        ),
        pairs: data.map((row, rowIndex) => {
          const result: any = {};
          row.forEach((cell, colIndex) => {
            const columnKey = `key${colIndex + 1}`;
            result[columnKey] = cell;
          });
          result.value = inputValues[`${rowIndex}`] || row[row.length - 1];
          return result;
        }),
      }
    };

    const blob = new Blob([JSON.stringify(tableData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${templateName}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <TableContainer component={Paper}>
      <div style={{ textAlign: "right", padding: "8px", fontWeight: "bold", color: "white", background: "#9b2940" }}>
        Result column names
      </div>

      <Table>
        <TableHead>
          {headers.map((headerRow, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell>
                {rowIndex === 0 && <div>Column groups to encode</div>}
                {headers.length === 1 ? (
                  <>
                    <Button onClick={() => toggleDropdown(rowIndex)} variant="text" color="primary" key={`start-btn-${rowIndex}`}>
                      +
                    </Button>
                    {dropdownVisible[rowIndex] && (
                      <Select
                        value=""
                        onChange={(e) => handleColumnSelection(e.target.value as string, rowIndex + 1)}
                        displayEmpty
                        style={{ marginLeft: "10px" }}
                      >
                        <MenuItem value="" disabled>
                          Select column
                        </MenuItem>
                        {columnNames.map((name) => (
                          <MenuItem key={name} value={name}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </>
                ) : rowIndex === headers.length - 1 ? (
                  <>
                    <Button onClick={() => toggleDropdown(rowIndex)} variant="text" color="primary" key={`start-btn-${rowIndex}`}>
                      +
                    </Button>
                    {dropdownVisible[rowIndex] && (
                      <Select
                        value=""
                        onChange={(e) => handleColumnSelection(e.target.value as string, rowIndex + 1)}
                        displayEmpty
                        style={{ marginLeft: "10px" }}
                      >
                        <MenuItem value="" disabled>
                          Select column
                        </MenuItem>
                        {columnNames.map((name) => (
                          <MenuItem key={name} value={name}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </>
                ) : null}
              </TableCell>

              {headerRow.map((col, colIndex) => (
                <TableCell key={`${rowIndex}-${colIndex}`}>{col}</TableCell>
              ))}

              <TableCell>
                <Button onClick={() => toggleDropdown(rowIndex)} variant="text" color="primary" key={`end-btn-${rowIndex}`}>
                  +
                </Button>
                {dropdownVisible[rowIndex] && (
                  <Select
                    value=""
                    onChange={(e) => handleColumnSelection(e.target.value as string, rowIndex)}
                    displayEmpty
                    style={{ marginLeft: "10px" }}
                  >
                    <MenuItem value="" disabled>
                      Select column
                    </MenuItem>
                    {columnNames.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableHead>

        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {rowIndex === 0 ? (
                <TableCell>Values</TableCell>
              ) : (
                <TableCell />
              )}
              {row.map((cell, colIndex) => (
                <TableCell key={colIndex}>{cell}</TableCell>
              ))}
              <TableCell>
                <TextField
                  variant="outlined"
                  fullWidth
                  size="small"
                  onChange={(e) => handleInputChange(rowIndex, e.target.value)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <TextField
        label="Template Name"
        variant="outlined"
        fullWidth
        value={templateName}
        onChange={(e) => setTemplateName(e.target.value)}
        style={{ marginTop: "20px" }}
      />
      <Button onClick={handleExportJSON} color="primary" variant="contained" style={{ marginTop: "20px" }}>
        Export to JSON
      </Button>
    </TableContainer>
  );
};

export default DynamicMultiHeaderTable;
