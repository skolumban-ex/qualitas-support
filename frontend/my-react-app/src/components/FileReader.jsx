// src/components/FileReader.jsx
import React, { useState } from 'react';

function FileReader() {
  const [fileContent, setFileContent] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Kezeli a fájl kiválasztását
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    console.log("Kiválasztott fájl:", file); // Ellenőrzéshez
  };

  // Kezeli a fájl feltöltését és beolvasását
  const handleFileUpload = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        setFileContent(lines);
        console.log("Beolvasott tartalom:", lines); // Ellenőrzéshez
      };
      reader.readAsText(selectedFile);
    } else {
      console.log("Nincs kiválasztott fájl"); // Ha nincs fájl kiválasztva
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".txt, .csv" 
        onChange={handleFileSelect} 
      />
      <button onClick={handleFileUpload}>Feltöltés</button>

      <h3>Fájl tartalma:</h3>
      <ul>
        {fileContent.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export default FileReader;
