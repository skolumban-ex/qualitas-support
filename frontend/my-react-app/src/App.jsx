import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

function App() {
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
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>File Uploader</h1>
      <div {...getRootProps()} style={{
        border: '2px dashed #aaa',
        padding: '20px',
        cursor: 'pointer',
        marginBottom: '20px'
      }}>
        <input {...getInputProps()} />
        <p>Drag & drop a file here, or click to select a file</p>
      </div>
      {uploadedFilePath && (
        <div>
          <h3>File uploaded successfully!</h3>
          <p><strong>File Path:</strong> {uploadedFilePath}</p>
          {fileContent && (
            <div>
              <h3>File Content:</h3>
              <pre>{fileContent}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;