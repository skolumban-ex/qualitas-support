// components/FileUploader.js
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import * as XLSX from 'xlsx';
import FileDisplay from './FileDisplay';

function FileUploader() {
  const [uploadedFilePath, setUploadedFilePath] = useState(null);
  const [fileContent, setFileContent] = useState(null);

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

      // Check if file is a .txt or .xlsx and read accordingly
      if (file.type === 'text/plain') {
        // Handle text files
        const fileReader = new FileReader();
        fileReader.onload = () => {
          setFileContent(fileReader.result);
        };
        fileReader.readAsText(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        // Handle .xlsx files
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Get the first row as column headers
        const firstRow = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
        setFileContent(JSON.stringify(firstRow, null, 2)); // Format JSON for display
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: '.txt, .xlsx' });

  return (
    <div>
      <div {...getRootProps()} style={{
        border: '2px dashed #aaa',
        padding: '20px',
        cursor: 'pointer',
        marginBottom: '20px'
      }}>
        <input {...getInputProps()} />
        <p>Drag & drop a file here, or click to select a file (.txt, .xlsx)</p>
      </div>
      {uploadedFilePath && <FileDisplay filePath={uploadedFilePath} fileContent={fileContent} />}
    </div>
  );
}

export default FileUploader;
