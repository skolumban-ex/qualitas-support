import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import './FileUploader.css';
import DynamicMultiHeaderTable from './DynamicTable';
import TemplateViewer from './TemplateViewer';
import TableEdit from './TableEdit';
import { saveTemplate } from '../api/templateAPI';
import { Template } from '../models/templates';


interface JSONOutput {
  ignore?: string[];
  encode?: Array<{ [key: string]: Array<{ original: string; encoded: string }> }>;
  merge?: Array<{ mergedColumns: string[]; mergedValues: Array<{ original: string; encoded: string }> }>;
}

function transformTemplate(frontendTemplate) {
  return frontendTemplate.map((itemm) => {
    const item = JSON.parse(itemm);
    const headers = item.encode.headers?.map((header) => header.keys) || [];
    const columns = transpose(headers);

    const valueMappings = {};
    item.encode.pairs.forEach((pair) => {
      if (!valueMappings[pair.value]) {
        valueMappings[pair.value] = [];
      }
      valueMappings[pair.value].push(...pair.keyvalues);
    });

    return {
      columns,
      valueMappings,
      resultColumnName: [item.encode.resultColumnName],
    };
  });
}

function transpose(matrix) {
  if (!matrix.length) return [];
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex] || ""));
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
  const [template, setTemplate] = useState<string[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [tableEditEnabled, setTableEditEnabled] = useState<boolean>(false);
  const [resultColumnName, setResultColumnName] = useState<string>("");

  const handleAddColumn = (column: string, index: number, columnIndex: number) => {
    console.log(column)  
    toggleColumnSelection(column, index, columnIndex)
  };

  const handleExportJSON = (json: any) => {
    console.log("Exportált JSON:", JSON.stringify(json, null, 2));
    
    setTemplate((prevTemplate) => {
      const updatedTemplate = [...prevTemplate];
      let isUpdated = false;

      for (let i = 0; i < updatedTemplate.length; i++) {
        const existingTemplate = JSON.parse(updatedTemplate[i]);
        if (JSON.stringify(existingTemplate.encode.headers) === JSON.stringify(json.encode.headers)) {
          updatedTemplate[i] = JSON.stringify(json, null, 2);
          isUpdated = true;
          break;
        }
      }

      if (!isUpdated) {
        updatedTemplate.push(JSON.stringify(json, null, 2));
      }

      return updatedTemplate;
    });

    console.log(template);
    const templateJson = template.map(item => JSON.parse(item));
    console.log("Exportált JSON:", JSON.stringify(templateJson, null, 2));
    setTableEditEnabled(false);

    setSelectedMultipleColumns([]);
    setUniqueValues([]);
    setSelectedColumns([]);
  };

  const handleTemplateClick = (template) => {
    console.log('Selected template:', template);
    // Add further processing logic here as needed
    const restoredHeaders = template.encode.headers.map((row) => row.keys);
    setSelectedMultipleColumns(restoredHeaders);
    console.log(restoredHeaders);
    const restoredData = template.encode.pairs.map((pair) => pair.keyvalues);
    setUniqueValues(restoredData);
    console.log(restoredData);
// Létrehozzuk a "value" értékek új változóját:
    const valueValues = template.encode.pairs.map((pair) => pair.value);
    setValues(valueValues);
    console.log(valueValues);
    const restoredResultColumnName = template.encode.resultColumnName;
    setResultColumnName(restoredResultColumnName);

    setTableEditEnabled(true);

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

  const handleCreateTemplate = async () => {
    const backendTemplate = transformTemplate(template);
    saveTemplate(backendTemplate).then(() => {
  
      setTemplate([]);
      setTableEditEnabled(false);

      setSelectedMultipleColumns([]);
      setUniqueValues([]);
      setSelectedColumns([]);
    });
  }

  const toggleColumnSelection = (columnName: string, index: number = 0, columnIndex: number=NaN) => {
    setSelectedMultipleColumns((prev) => {
      const updatedMultipleColumns = [...prev];
    
      if (!updatedMultipleColumns[index]) {
        updatedMultipleColumns[index] = [];
      }
    
      const row = updatedMultipleColumns[index];
    
      if (!row.includes(columnName) || columnName === "waiting") {
        if (!isNaN(columnIndex)) {
          updatedMultipleColumns[index][columnIndex] = columnName;
        } else {
          updatedMultipleColumns[index] = [...row, columnName];
        }
      } else {
        updatedMultipleColumns[index] = [...row];
      }

      console.log(updatedMultipleColumns);

      if (updatedMultipleColumns[0]?.length > 0 && fileData.length > 0) {
        let filteredRows: (string | number)[][] = []; 

        updatedMultipleColumns.forEach((columns) => {
          const selectedColumnIndices = columns.map((col) => columnNames.indexOf(col));
          const currentFilteredRows = fileData.map((row) =>
            selectedColumnIndices.map((index) => row[index] || "")
          );
          filteredRows = filteredRows.concat(currentFilteredRows);
        });

        const uniqueRows = Array.from(
          new Set(filteredRows.map((row) => JSON.stringify(row)))
        ).map((row) => JSON.parse(row));

        setUniqueValues(uniqueRows);
      } else {
        setUniqueValues([]);
      }
    
      return updatedMultipleColumns;
    });

    setSelectedColumns((prev) => {
      const updatedColumns = prev.includes(columnName)
        ? prev.filter((name) => name !== columnName)
        : [...prev, columnName];

      console.log(selectedMultipleColumns);
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
      <TemplateViewer 
        templates={template}
        onTemplateClick={handleTemplateClick}  />
      {tableEditEnabled &&(
      <TableEdit
        headers={selectedMultipleColumns}
        data={uniqueValues}
        values={values}
        resultColumnNames={resultColumnName}
        onExportJSON={handleExportJSON}
        onSetValues={setValues}
      />
      )}
      <button onClick={handleCreateTemplate} className="save-button">
        Save Template
      </button>
    </div>
  );
  
};

export default FileUploader;
