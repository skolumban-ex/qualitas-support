import React, { useEffect, useState } from 'react';
import './TemplateList.css';

interface Template {
  ignore: string[];
  encode: { [key: string]: { original: string; encoded: string }[] }[];
}

const TemplateList: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/templates/templateList.json');
        const fileList: string[] = await response.json();

        const templatesData = await Promise.all(
          fileList.map(async (filename) => {
            const templateResponse = await fetch(`/templates/${filename}`);
            return await templateResponse.json();
          })
        );

        setTemplates(templatesData);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Available Templates</h1>
      <div className="templates-container">
        {templates.length > 0 ? (
          templates.map((template, index) => (
            <div key={index} className="template">
              <h3>Template {index + 1}</h3>
              <div className="ignore-container">
                <h3>Ignore:</h3>
                <div className="ignore-list">
                  {template.ignore.map((item, itemIndex) => (
                    <span key={itemIndex} className="ignore-item">
                      {item}
                    </span>
                  ))}
                </div>
                <h3>Encode:</h3>
                <div className="ignore-list">
                  {/* If encode is structured like above, you can render it similarly */}
                  {/* {template.encode.map((encodedColumn, columnIndex) => (
                    <div key={columnIndex}>
                      <strong>Column:</strong> {encodedColumn.columnName}
                      {encodedColumn.rows.map((row, rowIndex) => (
                        <div key={rowIndex}>
                          <strong>Original:</strong> {row.original}, <strong>Encoded:</strong> {row.encoded}
                        </div>
                      ))}
                    </div>
                  ))} */}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No templates available.</p>
        )}
      </div>
    </div>
  );
};

export default TemplateList;
