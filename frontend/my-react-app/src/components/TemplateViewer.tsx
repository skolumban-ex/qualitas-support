import React from 'react';

interface TemplateProps {
  templates: string[]; // List of JSON strings
  onTemplateClick: (template: object) => void; // Callback for when a template is clicked
}

const TemplateViewer: React.FC<TemplateProps> = ({ templates, onTemplateClick }) => {
  if (!templates || templates.length === 0) {
    return <div>No templates available</div>;
  }

  return (
    <div className="template-viewer">
      <h3>Template Headers</h3>
      {templates.map((templateString, templateIndex) => {
        try {
          const template = JSON.parse(templateString);
          if (!template.encode || !template.encode.headers) {
            return null;
          }

          const allKeys = template.encode.headers
            .flatMap(headerGroup => headerGroup.keys)
            .join(', ');

          return (
            <div key={templateIndex} className="template-group">
              <a
                href={`#template-${templateIndex}`}
                className="header-link"
                style={{ display: 'block', marginBottom: '10px', color: 'blue', textDecoration: 'underline' }}
                onClick={(e) => {
                  e.preventDefault();
                  onTemplateClick(template);
                }}
              >
                {allKeys}
              </a>
              {templateIndex < templates.length - 1 && (
                <hr style={{ margin: '20px 0', border: '2px solid #ccc' }} />
              )}
            </div>
          );
        } catch (error) {
          console.error('Invalid template JSON:', templateString, error);
          return <div key={templateIndex} className="invalid-template">Invalid template</div>;
        }
      })}
    </div>
  );
};

export default TemplateViewer;