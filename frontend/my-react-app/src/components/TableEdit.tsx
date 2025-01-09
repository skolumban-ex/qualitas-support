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
  values: string[]; // Táblázat értékei
  resultColumnNames: string; // Az eredmény oszlopnevei
  onExportJSON: (json: any) => void; // Callback a JSON exportálásához
  onSetValues: (values: string[]) => void; // Callback az értékek beállításához
}

const DynamicMultiHeaderTable: React.FC<DynamicMultiHeaderTableProps> = ({
  headers,
  data,
  values,
  resultColumnNames,
  onExportJSON,
  onSetValues
}) => {
  const [dropdownVisible, setDropdownVisible] = useState<{[key: number]: boolean}>({});
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [valuess, setValues] = useState([...values]);
  const [resultColumnName, setResultColumnName] = useState<string>(resultColumnNames);


  
  const handleInputChange = (index, value) => {
    const updatedValues = [...values];
    updatedValues[index] = value;
    onSetValues(updatedValues);
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
          keys: row
        })),
        pairs: data.map((row, rowIndex) => {
          const result: any = {
            keyvalues: row,
            value: values[rowIndex] || row[row.length - 1]
          };
          return result;
        }),
        resultColumnName: resultColumnName
      }
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
              </TableCell>

                {headerRow.map((col, colIndex) => (
                <TableCell key={`${rowIndex}-${colIndex}`}>
                  {col === "waiting" ? (
                  col
                  ) : (
                  col
                  )}
                </TableCell>
                ))}
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
                  value={values[rowIndex]}
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
        Save
      </Button>
    </TableContainer>
  );
};

export default DynamicMultiHeaderTable;
