// components/FileUploader.js
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse'; // Import the PapaParse library
import './FileUploader.css'; // Import a CSS file for styles

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
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // Handle .csv files using PapaParse
        Papa.parse(file, {
          complete: (results) => {
            // Get the first row as column headers
            const firstRow = results.data[0];
            setColumnNames(firstRow); // Store column names
          },
          header: false, // Do not treat the first row as headers
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

  const handleAction = async (action) => {
    const jsonPayload = {
      [action]: selectedColumns,
    };
  
    try {
      const response = await axios.post('http://localhost:7191/api/conversion-templates', jsonPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Response from server:', response.data); // Log the response from the server
    } catch (error) {
      console.error('Error sending JSON to server:', error);
    }
  
    setJsonOutput(jsonPayload); // Store the JSON output for display
    console.log(jsonPayload); 
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: '.xlsx, .csv' });

  return (
    <div className="file-uploader">
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        <p>Drag & drop an .xlsx or .csv file here, or click to select a file</p>
      </div>
      
      <div className="action-buttons">
        <button onClick={() => handleAction('merge')}>Merge</button>
        <button onClick={() => handleAction('delete')}>Delete</button>
        <button onClick={() => handleAction('Re-ID')}>Re-ID</button>
      </div>

      {uploadedFilePath && (
        <div className="column-selection">
          <h3>Select Columns:</h3>
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
      )}

      {Object.keys(jsonOutput).length > 0 && (
        <div className="json-output">
          <h3>JSON Output:</h3>
          <pre>{JSON.stringify(jsonOutput, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
