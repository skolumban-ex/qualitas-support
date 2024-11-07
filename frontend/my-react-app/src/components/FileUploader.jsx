// components/FileUploader.js
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import './FileUploader.css';

function FileUploader() {
  const [uploadedFilePath, setUploadedFilePath] = useState(null);
  const [columnNames, setColumnNames] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [fileData, setFileData] = useState([]);
  const [jsonOutput, setJsonOutput] = useState({});
  const [selectedAction, setSelectedAction] = useState('none');
  const [temporaryEncodedValues, setTemporaryEncodedValues] = useState({});

  const openTemplateList = () => {
    window.open('/templates-list', '_blank');
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setJsonOutput({});
      setUploadedFilePath(file.path);

      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        setFileData(sheet.slice(1));
        setColumnNames(sheet[0]);
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        Papa.parse(file, {
          complete: (results) => {
            const sheet = results.data;
            setFileData(sheet.slice(1));
            setColumnNames(sheet[0]);
          },
          header: false,
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const toggleColumnSelection = (columnName) => {
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
        if (!updatedOutput['ignore']) {
          updatedOutput['ignore'] = [];
        }
        updatedOutput['ignore'] = [...new Set([...updatedOutput['ignore'], ...selectedColumns])];
      }

      if (selectedAction === 'encode') {
        if (!updatedOutput['encode']) {
          updatedOutput['encode'] = [];
        }

        selectedColumns.forEach((columnName) => {
          const existingColumn = updatedOutput['encode'].find((col) => col[columnName]);

          if (!existingColumn) {
            const newColumn = {
              [columnName]: []
            };

            fileData.forEach((row, rowIndex) => {
              const originalValue = row[columnNames.indexOf(columnName)];
              const encodedValue = temporaryEncodedValues[`${columnName}-${rowIndex}`];

              if (encodedValue) {
                newColumn[columnName].push({
                  original: originalValue,
                  encoded: encodedValue,
                });
              }
            });

            updatedOutput['encode'].push(newColumn);
          } else {
            fileData.forEach((row, rowIndex) => {
              const originalValue = row[columnNames.indexOf(columnName)];
              const encodedValue = temporaryEncodedValues[`${columnName}-${rowIndex}`];

              if (encodedValue) {
                const existingEntry = existingColumn[columnName].find((entry) => entry.original === originalValue);

                if (!existingEntry) {
                  existingColumn[columnName].push({
                    original: originalValue,
                    encoded: encodedValue,
                  });
                } else {
                  existingEntry.encoded = encodedValue;
                }
              }
            });
          }
        });
      }

      return updatedOutput;
    });

    console.log(jsonOutput);
  };

  const updateEncodedValue = (columnName, rowIndex, newValue) => {
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

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: '.xlsx, .csv' });

  return (
    
    <div className="file-uploader">
       <button onClick={openTemplateList}>List Templates</button>

      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        <p>Drag & drop an .xlsx or .csv file here, or click to select a file</p>
      </div>

      {uploadedFilePath && (
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
              {selectedColumns.map((columnName) => (
                <div key={columnName} className="column-display">
                  <h4>{columnName}</h4>
                  {fileData.map((row, rowIndex) => (
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
              ))}
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
                        <div className="column-header"><strong>Column:</strong> {columnName}</div>
                        <div className="output-rows">
                          {rows.map((row, rowIndex) => (
                            <div key={rowIndex} className="output-row">
                              <strong>Original:</strong> {row.original}, <strong>Encoded:</strong> {row.encoded}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button className="create-template-button" onClick={handleCreateTemplate}>
              Create Template
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default FileUploader;