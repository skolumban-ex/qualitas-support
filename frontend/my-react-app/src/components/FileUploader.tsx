// components/FileUploader.tsx
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import './FileUploader.css';

interface JSONOutput {
  ignore?: string[];
  encode?: Array<{ [key: string]: Array<{ original: string; encoded: string }> }>;
}

const FileUploader: React.FC = () => {
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [fileData, setFileData] = useState<string[][]>([]);
  const [jsonOutput, setJsonOutput] = useState<JSONOutput>({});
  const [selectedAction, setSelectedAction] = useState<string>('none');
  const [temporaryEncodedValues, setTemporaryEncodedValues] = useState<{ [key: string]: string }>({});

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
        Papa.parse<string[]>(file, {
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

  const toggleColumnSelection = (columnName: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(columnName)) {
        return prev.filter((name) => name !== columnName);
      } else {
        return [...prev, columnName];
      }
    });
  };

  const handleAction = () => {
    if (selectedAction === 'none') return;

    setJsonOutput((prevOutput) => {
      const updatedOutput = { ...prevOutput };

      if (selectedAction === 'ignore') {
        if (!updatedOutput.ignore) {
          updatedOutput.ignore = [];
        }
        updatedOutput.ignore = [...new Set([...updatedOutput.ignore, ...selectedColumns])];
      }

      if (selectedAction === 'encode') {
        if (!updatedOutput.encode) {
          updatedOutput.encode = [];
        }

        selectedColumns.forEach((columnName) => {
          const existingColumn = updatedOutput.encode?.find((col) => col[columnName]);

          if (!existingColumn) {
            const newColumn: { [key: string]: Array<{ original: string; encoded: string }> } = { [columnName]: [] };
            const uniqueOriginals = new Set();

            fileData.forEach((row, rowIndex) => {
              const originalValue = row[columnNames.indexOf(columnName)];
              const encodedValue = temporaryEncodedValues[`${columnName}-${rowIndex}`];

              if (encodedValue && !uniqueOriginals.has(originalValue)) {
                uniqueOriginals.add(originalValue);
                newColumn[columnName].push({
                  original: originalValue,
                  encoded: encodedValue,
                });
              }
            });
            if (!updatedOutput.encode) {
              updatedOutput.encode = [];
            }
            updatedOutput.encode.push(newColumn);
          } else {
            const uniqueOriginals = new Set(existingColumn[columnName].map((entry) => entry.original));

            fileData.forEach((row, rowIndex) => {
              const originalValue = row[columnNames.indexOf(columnName)];
              const encodedValue = temporaryEncodedValues[`${columnName}-${rowIndex}`];

              if (encodedValue && !uniqueOriginals.has(originalValue)) {
                uniqueOriginals.add(originalValue);
                existingColumn[columnName].push({
                  original: originalValue,
                  encoded: encodedValue,
                });
              }
            });
          }
        });
      }

      return updatedOutput;
    });

    console.log(jsonOutput);
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
                    />
                    {columnName}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="action-dropdown-container">
            <h3>Select an action:</h3>
            <select
              className="action-dropdown"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="none" disabled>Select</option>
              <option value="ignore">Ignore</option>
              <option value="encode">Encode</option>
            </select>
            <button className="action-button" onClick={handleAction}>Add</button>
          </div>

          {selectedAction === 'encode' && selectedColumns.length > 0 && (
            <div className="row-display-container">
              <h3>Rows for Encoded Action:</h3>
              {selectedColumns.map((columnName) => {
                const uniqueOriginals = new Set();
                return (
                  <div key={columnName} className="column-display">
                    <h4>{columnName}</h4>
                    {fileData
                      .filter((row) => {
                        const originalValue = row[columnNames.indexOf(columnName)];
                        if (uniqueOriginals.has(originalValue)) {
                          return false;
                        } else {
                          uniqueOriginals.add(originalValue);
                          return true;
                        }
                      })
                      .map((row, rowIndex) => (
                        <div key={rowIndex} className="row-item">
                          <span>{row[columnNames.indexOf(columnName)]}</span>
                          <input
                            type="text"
                            placeholder="Enter encoded value"
                            onChange={(e) => updateEncodedValue(columnName, rowIndex, e.target.value)}
                          />
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          )}

          <div className="json-output-container">
            <h3>Template Preview:</h3>
            <div className="json-output-content">
              {jsonOutput.ignore && jsonOutput.ignore.length > 0 && (
                <div className="output-block">
                  <div className="output-header"><strong>Ignored Columns:</strong></div>
                  <div className="output-rows">
                    {jsonOutput.ignore.map((columnName, index) => (
                      <div key={index} className="output-row">
                        {columnName}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {jsonOutput.encode && jsonOutput.encode.length > 0 && (
                <div className="output-block">
                  <div className="output-header"><strong>Encoded Columns:</strong></div>
                  {jsonOutput.encode.map((encodedColumn, columnIndex) => {
                    const [columnName, rows] = Object.entries(encodedColumn)[0];
                    return (
                      <div key={columnIndex} className="encoded-column">
                        <strong>{columnName}:</strong>
                        {rows.map((row, rowIndex) => (
                          <div key={rowIndex}>
                           {row.original} &gt; {row.encoded}

                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button onClick={handleCreateTemplate}>Create Template</button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
