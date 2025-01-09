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
  headers: string[][]; // Táblázat fejlécsorai
  data: string[][]; // Táblázat adatai
  columnNames: string[]; // Elérhető oszlopnevek
  selectedColumns: string[]; // Kiválasztott oszlopok
  onAddColumn: (column: string, rowIndex: number, columnIndex: number) => void; // Callback az új oszlop hozzáadásához
  onExportJSON: (json: any) => void; // Callback a JSON exportálásához
}

const DynamicMultiHeaderTable: React.FC<DynamicMultiHeaderTableProps> = ({
  headers,
  data,
  columnNames,
  selectedColumns,
  onExportJSON,
  onAddColumn,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState<{[key: number]: boolean}>({});
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [resultColumnName, setResultColumnName] = useState<string>("");


  const handleColumnSelection = (column: string, rowIndex: number, n: number=1, columnIndex : number=NaN, columnAdd: boolean=false) => {
    if(columnAdd){
      for (let i = 0; i < n; i++){
        if (!selectedColumns.includes(column) || column === "waiting") {
          // Meghívja a szülő által átadott függvényt a kiválasztott oszlop és sor indexével
          onAddColumn(column, i, columnIndex);
         
        }
      }
    }
    else{
      for (let i = 0; i < n; i++){
        if (!selectedColumns.includes(column) || column === "waiting") {
          // Meghívja a szülő által átadott függvényt a kiválasztott oszlop és sor indexével
          onAddColumn(column, rowIndex, columnIndex);
        }
      }
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
    const tableData = {
      encode: {
        headers: headers.map((row) => ({
          keys: row,
        })),
        pairs: data.map((row, rowIndex) => {
          const result: any = {
            keyvalues: row,
            value: inputValues[`${rowIndex}`] || row[row.length - 1],
          };
          return result;
        }),
        resultColumnName: resultColumnName || "", // Hozzáadjuk a resultColumnName-t
      },
    };
    onExportJSON(tableData);
  };


  return (
    <TableContainer component={Paper}>
      {/* Fixed text above the result column */}
      <div
        style={{
          textAlign: "right",
          padding: "8px",
          fontWeight: "bold",
          color: "white",
          background: "#9b2940",
        }}
      >
        Result column names
        <TextField
          variant="outlined"
          size="small"
          value={resultColumnName}
          onChange={(e) => setResultColumnName(e.target.value)}
          placeholder="Enter result column name"
          style={{ marginLeft: "10px", background: "white" }}
        />
      </div>

      <Table>
        {/* Többszintű fejléc */}
        <TableHead>
          {headers.map((headerRow, rowIndex) => (
            <TableRow key={rowIndex}>
              {/* Az első cella: az első sorban megjelenik a szöveg, és minden sorban a "+" gomb */}
              <TableCell>
                {rowIndex === 0 && <div>Column groups to encode</div>}
                {headers.length === 1 ? (
                  <>
                    <Button
                      onClick={() => handleColumnSelection("waiting", rowIndex + 1, headers[0].length)}
                      variant="text"
                      color="primary"
                      key={`start-btn-${rowIndex}`}
                    >
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
                  <Button
                      onClick={() => handleColumnSelection("waiting", rowIndex + 1, headers[0].length)}
                      variant="text"
                      color="primary"
                      key={`start-btn-${rowIndex}`}
                    >
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
                <TableCell key={`${rowIndex}-${colIndex}`}>
                  {col === "waiting" ? (
                  <Select
                    value=""
                    onChange={(e) => handleColumnSelection(e.target.value as string, rowIndex, 1,colIndex)}
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
                  ) : (
                  col
                  )}
                </TableCell>
                ))}
              {/* '+' gomb az oszlopok bővítéséhez */}
                {rowIndex === 0 && (
                <TableCell>
                  <Button
                  onClick={() => handleColumnSelection("waiting", 0, headers.length, NaN, true)}
                  variant="text"
                  color="primary"
                  key={`end-btn-${rowIndex}`}
                  >
                  +
                  </Button>
                  {dropdownVisible[rowIndex] && (
                  <Select
                    value=""
                    onChange={(e) => handleColumnSelection("waiting", 0, headers.length, NaN, true)}
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
                )}
            </TableRow>
          ))}
        </TableHead>

        {/* Adatok */}
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {rowIndex === 0 ? (
                <TableCell>Values</TableCell>
              ) : (
                <TableCell />
              )}

              {row.map((cell, colIndex) => (
                <TableCell key={colIndex}>
                  {cell} {/* Nem szerkeszthető adatcellák */}
                </TableCell>
              ))}
              <TableCell>
              <TextField
                  variant="outlined"
                  fullWidth
                  size="small"
                  onChange={(e) =>
                    handleInputChange(rowIndex, e.target.value)
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={handleExportJSON} color="primary" variant="contained" style={{ marginTop: "20px" }}>
        Export to JSON
      </Button>
    </TableContainer>
  );
};

export default DynamicMultiHeaderTable;
