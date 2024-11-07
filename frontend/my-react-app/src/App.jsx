// App.jsx
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import FileUploader from './components/FileUploader';
import TemplateList from './components/TemplateList';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <Navbar/>
      <Main />
    </Router>
  );
}

function Main() {
  const location = useLocation();

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>

      {location.pathname === '/' && <h1>File Uploader</h1>}
      <Routes>
        <Route path="/" element={<FileUploader />} />
        <Route path="/templates-list" element={<TemplateList />} />
      </Routes>
    </div>
  );
}

export default App;
