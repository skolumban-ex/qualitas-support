import React, { useEffect, useState } from 'react';
import './TemplateList.css';

function TemplateList() {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/templates/templateList.json');
        const fileList = await response.json();

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
                  {/*{template.encode.map((item, itemIndex) => (
                    <span key={itemIndex} className="ignore-item">
                      {item}
                    </span>
                  ))}*/}
                
                  
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
}

export default TemplateList;
