import React from "react";
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
} from "@mui/material";
import './DynamicTable.css';

interface DynamicMultiHeaderTableProps {
  headers: string[][]; // Táblázat fejlécsorai
  data: string[][]; // Táblázat adatai
  onHeaderChange: (updatedHeaders: string[][]) => void; // Callback a fejléc változtatásához
  onDataChange: (updatedData: string[][]) => void; // Callback az adatok változtatásához
}

const DynamicMultiHeaderTable: React.FC<DynamicMultiHeaderTableProps> = ({
  headers,
  data,
  onHeaderChange,
  onDataChange,
}) => {
  const addHeaderRow = () => {
    const newHeaderRow =
      headers[0]?.map(() => `New Header ${headers.length + 1}`) || [];
    onHeaderChange([...headers, newHeaderRow]);
  };

  const removeHeaderRow = () => {
    if (headers.length > 1) {
      onHeaderChange(headers.slice(0, -1));
    }
  };

  const addColumn = () => {
    const newHeaders = headers.map((row) => [...row, `New Col ${row.length + 1}`]);
    const newData = data.map((row) => [...row, ""]);
    onHeaderChange(newHeaders);
    onDataChange(newData);
  };

  const removeColumn = () => {
    if (headers[0]?.length > 1) {
      const newHeaders = headers.map((row) => row.slice(0, -1));
      const newData = data.map((row) => row.slice(0, -1));
      onHeaderChange(newHeaders);
      onDataChange(newData);
    }
  };

  const updateHeaderCell = (rowIndex: number, colIndex: number, value: string) => {
    const updatedHeaders = [...headers];
    updatedHeaders[rowIndex][colIndex] = value;
    onHeaderChange(updatedHeaders);
  };

  const updateDataCell = (rowIndex: number, colIndex: number, value: string) => {
    const updatedData = [...data];
    updatedData[rowIndex][colIndex] = value;
    onDataChange(updatedData);
  };

  return (
    <TableContainer component={Paper}>
      {/* Fixed text above the result column */}
      <div style={{ textAlign: "right", padding: "8px", fontWeight: "bold",color:"white" ,background:"#9b2940"}}>
        Result column names
      </div>

      <Table>
        {/* Többszintű fejléc */}
        <TableHead>
          {headers.map((headerRow, rowIndex) => (
            <TableRow key={rowIndex}>
              {rowIndex === 0 ? (
                <TableCell>Column groups to encode</TableCell>
              ) : (
                <TableCell>
                  {rowIndex === headers.length - 1 ? (
                    <Button
                      onClick={() => addHeaderRow()}
                      variant="text"
                      color="primary"
                    >
                      +
                    </Button>
                  ) : null}
                </TableCell>
              )}

              {headerRow.map((col, colIndex) => (
                <TableCell key={`${rowIndex}-${colIndex}`}>
                    {col}    
                </TableCell>
              ))}
                <TableCell/>
              {/* '+' gomb minden fejlécsor végén */}
              <TableCell>
                <Button
                  onClick={() => addColumn()}
                  variant="text"
                  color="primary"
                >
                  +
                </Button>
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
                  //value={''} // Az utolsó oszlopba beírt érték
                  /*onChange={(e) =>
                    
                  }*/
                  variant="outlined"
                  fullWidth
                  size="small"
                />
              </TableCell>
              
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DynamicMultiHeaderTable;
