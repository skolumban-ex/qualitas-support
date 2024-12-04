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
  onAddColumn: (column: string, rowIndex: number) => void; // Callback az új oszlop hozzáadásához
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

  const handleColumnSelection = (column: string, rowIndex: number) => {
    if (!selectedColumns.includes(column)) {
      // Meghívja a szülő által átadott függvényt a kiválasztott oszlop és sor indexével
      onAddColumn(column, rowIndex);
      setDropdownVisible((prev) => ({ ...prev, [rowIndex-1]: !prev[rowIndex-1] }));
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
    const tableData =  {
      encode: {
      headers: headers.map((row) =>
        row.reduce((acc, header, idx) => {
          acc[`key${idx + 1}`] = header;
          return acc;
        }, {})
      ),
      pairs: data.map((row, rowIndex) => {
        // Minden sor egy objektum, amely az oszlopok kulcsait és a hozzájuk tartozó adatokat tartalmazza
        const result: any = {};
  
        // Az oszlopok kulcsainak dinamikus generálása (key1, key2, key3, ...)
        row.forEach((cell, colIndex) => {
          const columnKey = `key${colIndex + 1}`; // key1, key2, key3, ...
          result[columnKey] = cell; // A kulcs az oszlop indexe alapján
        });
  
        // Az input mező értéke vagy az alap adat
        result.value = inputValues[`${rowIndex}`] || row[row.length - 1]; // Az utolsó cella adatát a value mezőbe
  
        return result;
      }),
    }};
    onExportJSON(tableData);
  };

  return (
    <TableContainer component={Paper}>
      {/* Fixed text above the result column */}
      <div style={{ textAlign: "right", padding: "8px", fontWeight: "bold", color: "white", background: "#9b2940" }}>
        Result column names
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
                      onClick={() => toggleDropdown(rowIndex)}
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
                      onClick={() => toggleDropdown(rowIndex)}
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
                <TableCell key={`${rowIndex}-${colIndex}`}>{col}</TableCell>
              ))}

              {/* '+' gomb az oszlopok bővítéséhez */}
              <TableCell>
                <Button
                  onClick={() => toggleDropdown(rowIndex)}
                  variant="text"
                  color="primary"
                  key={`end-btn-${rowIndex}`}
                >
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
