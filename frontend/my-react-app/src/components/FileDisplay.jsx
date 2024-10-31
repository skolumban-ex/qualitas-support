// components/FileDisplay.js
import React from 'react';

function FileDisplay({ filePath, fileContent }) {
  return (
    <div>
      <h3>File uploaded successfully!</h3>
      <p><strong>File Path:</strong> {filePath}</p>
      {fileContent && (
        <div>
          <h3>File Content:</h3>
          <pre>{fileContent}</pre>
        </div>
      )}
    </div>
  );
}

export default FileDisplay;
