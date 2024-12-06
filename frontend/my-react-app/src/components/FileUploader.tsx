import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import './FileUploader.css';
import DynamicMultiHeaderTable from './DynamicTable';

interface JSONOutput {
  ignore?: string[];
  encode?: Array<{ [key: string]: Array<{ original: string; encoded: string }> }>;
  merge?: Array<{ mergedColumns: string[]; mergedValues: Array<{ original: string; encoded: string }> }>;
}

const FileUploader: React.FC = () => {
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [fileData, setFileData] = useState<string[][]>([]);
  const [jsonOutput, setJsonOutput] = useState<JSONOutput>({});
  const [selectedAction, setSelectedAction] = useState<string>('none');
  const [temporaryEncodedValues, setTemporaryEncodedValues] = useState<{ [key: string]: string }>({});
  const [uniqueValues, setUniqueValues] = useState<string[][]>([]);
  const [selectedMultipleColumns, setSelectedMultipleColumns] = useState<string[][]>([]);


  const handleAddColumn = (column: string, index: number) => {
    console.log(column)  
    toggleColumnSelection(column, index)
  };

  const handleExportJSON = (json: any) => {
    console.log("Exportált JSON:", JSON.stringify(json, null, 2));
    setJsonOutput(json);
  };

  const openTemplateList = () => {
    window.open('/templates-list', '_blank');
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setJsonOutput({});
      setUploadedFileName(file.name);

      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[sheetName], { header: 1 });
        setFileData(sheet.slice(1));
        setColumnNames(sheet[0] as string[]);
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        Papa.parse(file, {
          complete: (results) => {
            const sheet = results.data;
            setFileData(sheet.slice(1));
            setColumnNames(sheet[0] as string[]);
          },
          header: false,
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const toggleColumnSelection = (columnName: string, index: number = 0) => {
    setSelectedMultipleColumns((prev) => {
      // Másolat készítése a meglévő állapotról
      const updatedMultipleColumns = [...prev];
    
      // Ellenőrizzük, hogy az adott index már létezik-e
      if (!updatedMultipleColumns[index]) {
        updatedMultipleColumns[index] = []; // Ha nincs, inicializáljuk egy üres tömbbel
      }
    
      const row = updatedMultipleColumns[index];
    
      if (row.includes(columnName)) {
        // Ha a columnName már létezik, eltávolítjuk
        //updatedMultipleColumns[index] = row.filter((col) => col !== columnName);
        updatedMultipleColumns[index] = [...row];
      } else {
        // Ha nem létezik, hozzáadjuk a sor végéhez
        updatedMultipleColumns[index] = [...row, columnName];
      }
      console.log(updatedMultipleColumns)

      if (updatedMultipleColumns[0]?.length > 0 && fileData.length > 0) {
        // Meghatározzuk a kiválasztott oszlopok indexeit
        console.log(selectedMultipleColumns)
        let filteredRows: (string | number)[][] = []; 

    updatedMultipleColumns.forEach((columns) => {
      // Az aktuális sor oszlopainak indexei
      const selectedColumnIndices = columns.map((col) => columnNames.indexOf(col));

      // Az aktuális oszlopok alapján kiszűrjük a megfelelő adatokat
      const currentFilteredRows = fileData.map((row) =>
        selectedColumnIndices.map((index) => row[index] || "")
      );

      // Hozzáfűzzük az eredményeket a filteredRows-hoz
      filteredRows = filteredRows.concat(currentFilteredRows);
    });

  
        // Egyedi sorokat határozunk meg
        const uniqueRows = Array.from(
          new Set(filteredRows.map((row) => JSON.stringify(row)))
        ).map((row) => JSON.parse(row)); // Visszaalakítjuk az eredeti formátumba
  
        setUniqueValues(uniqueRows);
      } else {
        setUniqueValues([]); // Ha nincs kiválasztott oszlop, töröljük az értékeket
      }
    
      return updatedMultipleColumns; // Visszaadjuk a frissített állapotot
    });

    setSelectedColumns((prev) => {
      const updatedColumns = prev.includes(columnName)
        ? prev.filter((name) => name !== columnName)
        : [...prev, columnName];

      
      console.log(selectedMultipleColumns)
      return updatedColumns;
    });
  };
  
  
  

  const handleAction = () => {
    if (selectedAction === 'none' || selectedColumns.length === 0) return;
  
    setJsonOutput((prevOutput) => {
      const updatedOutput: JSONOutput = { ...prevOutput };
  
      if (selectedAction === 'ignore') {
        updatedOutput.ignore = [...(updatedOutput.ignore || []), ...selectedColumns];
      }
  
      if (selectedAction === 'encode') {
        if (!updatedOutput.encode) {
          updatedOutput.encode = [];
        }
  
        selectedColumns.forEach((columnName) => {
          let columnEntry = updatedOutput.encode!.find((entry) => entry[columnName]);
  
          if (!columnEntry) {
            columnEntry = { [columnName]: [] };
            updatedOutput.encode!.push(columnEntry);
          }
  
          const existingEncodes = columnEntry[columnName].map((entry) => entry.original);
  
          fileData.forEach((row, rowIndex) => {
            const originalValue = row[columnNames.indexOf(columnName)];
            const encodedValue = temporaryEncodedValues[`${columnName}-${rowIndex}`];
  
            if (encodedValue && !existingEncodes.includes(originalValue)) {
              columnEntry[columnName].push({ original: originalValue, encoded: encodedValue });
            }
          });
        });
      }
  
      if (selectedAction === 'merge') {
        if (!updatedOutput.merge) {
          updatedOutput.merge = [];
        }
  
        const mergedColumnsData: { mergedColumns: string[]; mergedValues: Array<{ original: string; encoded: string }> } = {
          mergedColumns: [...selectedColumns],
          mergedValues: [],
        };
  
        const uniqueMergedValues = new Set<string>();
  
        fileData.forEach((row, rowIndex) => {
          let rowHasEncodedValue = false;
          selectedColumns.forEach((columnName) => {
            const originalValue = row[columnNames.indexOf(columnName)];
            const encodedValue = temporaryEncodedValues[`${columnName}-${rowIndex}`];
  
            if (originalValue && encodedValue && encodedValue.trim() !== '') {
              rowHasEncodedValue = true;
              if (!uniqueMergedValues.has(originalValue)) {
                uniqueMergedValues.add(originalValue);
                mergedColumnsData.mergedValues.push({
                  original: originalValue,
                  encoded: encodedValue,
                });
              }
            }
          });
        });
  
        if (mergedColumnsData.mergedValues.length > 0) {
          updatedOutput.merge.push(mergedColumnsData);
        }
      }
  
      return updatedOutput;
    });
  
    setColumnNames((prev) => prev.filter((name) => !selectedColumns.includes(name)));
    setSelectedColumns([]);
  };
  
  const updateEncodedValue = (columnName: string, rowIndex: number, newValue: string) => {
    setTemporaryEncodedValues((prevValues) => ({
      ...prevValues,
      [`${columnName}-${rowIndex}`]: newValue,
    }));
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await axios.post('http://localhost:7191/api/conversion-templates', jsonOutput, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Template created:', response.data);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
  });

  return (
    <div className="file-uploader">
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        <p>Drag & drop an .xlsx or .csv file here, or click to select a file</p>
      </div>
  
      {uploadedFileName && (
        <div className="column-selection-container">
          <div className="column-selection">
            <h3>Select Columns:</h3>
            <div className="button-group">
              <button className="select-button" onClick={() => setSelectedColumns([...columnNames])}>
                Select All
              </button>
              <button className="select-button" onClick={() => setSelectedColumns([])}>
                Unselect All
              </button>
            </div>
            <div className="columns">
              {columnNames.map((columnName) => (
                <div className="column" key={columnName}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(columnName)}
                      onChange={() => toggleColumnSelection(columnName)}
                    ></input>
                    {columnName}
                  </label>
                </div>
              ))}
            </div>
          </div>
  
          {selectedColumns.length > 0 && (
            <div className="table-container">
              <DynamicMultiHeaderTable
                headers={selectedMultipleColumns}
                data={uniqueValues}
                selectedColumns={selectedColumns}
                columnNames={columnNames}
                onAddColumn={handleAddColumn}
                onExportJSON={handleExportJSON}
              />
            </div>
          )}
        </div>
      )}
  
      <div className="json-output-container">
        <h3>JSON Output:</h3>
        <pre className="formatted-json">{JSON.stringify(jsonOutput, null, 2)}</pre>
      </div>
    </div>
  );
  
};

export default FileUploader;
