import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import FileUploader from './components/FileUploader';
import TemplateList from './components/TemplateList';
import ChartPage from './components/ChartPage';
import Navbar from './components/Navbar';
import StatisticsPage from './components/StatisticsAndChart';

const App: React.FC = () => {
  return (
    <Router>
      <Navbar />
      <Main />
    </Router>
  );
};

const Main: React.FC = () => {
  const location = useLocation();

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      {location.pathname === '/' && <h1>File Uploader</h1>}
      <Routes>
        <Route path="/" element={<FileUploader />} />
        <Route path="/templates-list" element={<TemplateList />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/chart" element={<ChartPage/>}/>
      </Routes>
    </div>
  );
};

export default App;
