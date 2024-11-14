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
    if (selectedAction === 'none' || selectedColumns.length === 0) return;

    setJsonOutput((prevOutput) => {
      const updatedOutput: JSONOutput = { ...prevOutput };

      if (selectedAction === 'ignore') {
        updatedOutput.ignore = [...(updatedOutput.ignore || []), ...selectedColumns];
      }

      if (selectedAction === 'encode') {
        // Ensure updatedOutput.encode is initialized
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

      console.log(updatedOutput);
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
              <option value="merge">Merge</option>
            </select>
            <button className="action-button" onClick={handleAction}>Add</button>
          </div>

          {(selectedAction === 'encode' || selectedAction === 'merge') && selectedColumns.length > 0 && (
            <div className="row-display-container">
              <h3>Rows for {selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)} Action:</h3>
              {selectedAction === 'encode' &&
                selectedColumns.map((columnName) => {
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

              {selectedAction === 'merge' && (
                <div className="column-display">
                  <h4>Combined Columns: {selectedColumns.join(', ')}</h4>
                  {(() => {
                    const combinedUniqueValues = new Set<string>();

                    fileData.forEach((row) => {
                      selectedColumns.forEach((columnName) => {
                        const originalValue = row[columnNames.indexOf(columnName)];
                        if (originalValue) {
                          combinedUniqueValues.add(originalValue);
                        }
                      });
                    });

                    return Array.from(combinedUniqueValues).map((value, valueIndex) => (
                      <div key={valueIndex} className="row-item">
                        <span>{value}</span>
                        <input
                          type="text"
                          placeholder="Enter encoded value"
                          onChange={(e) => updateEncodedValue('merged', valueIndex, e.target.value)}
                        />
                      </div>
                    ));
                  })()}
                </div>
              )}
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
                    const [columnName] = Object.keys(encodedColumn);
                    const encodedValues = encodedColumn[columnName];
                    return (
                      <div key={columnIndex} className="output-column">
                        <strong>{columnName}</strong>
                        {encodedValues.map((value, valueIndex) => (
                          <div key={valueIndex} className="output-row">
                            {value.original}: {value.encoded}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {jsonOutput.merge && jsonOutput.merge.length > 0 && (
                <div className="output-block">
                  <div className="output-header"><strong>Merged Columns:</strong></div>
                  {jsonOutput.merge.map((mergedData, mergeIndex) => {
                    const filteredRows = mergedData.mergedValues.filter(row => row.encoded.trim() !== '');

                    if (filteredRows.length > 0) {
                      return (
                        <div key={mergeIndex} className="merged-column">
                          <strong>{mergedData.mergedColumns.join(', ')}:</strong>
                          {filteredRows.map((value, valueIndex) => (
                            <div key={valueIndex}>
                              {value.original} &gt; {value.encoded}
                            </div>
                          ))}
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })}
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button className="template-button" onClick={openTemplateList}>Templates List</button>
              <button className="template-button" onClick={handleCreateTemplate}>Create Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
