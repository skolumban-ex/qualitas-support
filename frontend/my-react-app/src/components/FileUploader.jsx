// components/FileUploader.js
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import * as XLSX from 'xlsx';
import FileDisplay from './FileDisplay';

function FileUploader() {
  const [uploadedFilePath, setUploadedFilePath] = useState(null);
  const [columnNames, setColumnNames] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [jsonOutput, setJsonOutput] = useState({});

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload the file to the server
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedFilePath(response.data.filePath);

      // Handle .xlsx files
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Get the first row as column headers
        const firstRow = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
        setColumnNames(firstRow); // Store column names
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

  const handleAction = (action) => {
    setJsonOutput({
      [action]: selectedColumns,
    });
    console.log(jsonOutput); // You can see the JSON output in the console
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: '.xlsx' });

  return (
    <div>
      <div {...getRootProps()} style={{
        border: '2px dashed #aaa',
        padding: '20px',
        cursor: 'pointer',
        marginBottom: '20px'
      }}>
        <input {...getInputProps()} />
        <p>Drag & drop an .xlsx file here, or click to select a file</p>
      </div>

      {uploadedFilePath && (
        <div>
          <h3>Select Columns:</h3>
          <ul>
            {columnNames.map((columnName) => (
              <li key={columnName}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(columnName)}
                    onChange={() => toggleColumnSelection(columnName)}
                  />
                  {columnName}
                </label>
              </li>
            ))}
          </ul>

          <div>
            <button onClick={() => handleAction('merge')}>Merge</button>
            <button onClick={() => handleAction('delete')}>Delete</button>
            <button onClick={() => handleAction('Re-ID')}>Re-ID</button>
          </div>
        </div>
      )}

      {Object.keys(jsonOutput).length > 0 && (
        <div>
          <h3>JSON Output:</h3>
          <pre>{JSON.stringify(jsonOutput, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
