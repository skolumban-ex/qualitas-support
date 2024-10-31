// components/FileUploader.js
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
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

      // Read the file content (assuming it's a text file for simplicity)
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setFileContent(fileReader.result);
      };
      fileReader.readAsText(file);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div {...getRootProps()} style={{
        border: '2px dashed #aaa',
        padding: '20px',
        cursor: 'pointer',
        marginBottom: '20px'
      }}>
        <input {...getInputProps()} />
        <p>Drag & drop a file here, or click to select a file</p>
      </div>
      {uploadedFilePath && <FileDisplay filePath={uploadedFilePath} fileContent={fileContent} />}
    </div>
  );
}

export default FileUploader;
