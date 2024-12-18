import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import './TemplateList.css';
import { getAllTemplates } from '../api/templateAPI';
import { Template } from '../models/templates';

const TemplateList: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesData = await getAllTemplates();
        setTemplates(templatesData);
      } catch (error) {
        setError('Failed to fetch templates. Please try again later.');
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return (
    <Box sx={{ textAlign: 'center', padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Available Templates
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : templates.length > 0 ? (
        <Grid container spacing={3} justifyContent="center">
          {templates.map((template) => (
            <Grid item xs={12} sm={6} md={6} key={template.id}>
              <Card sx={{ maxWidth: 600, margin: '0 auto', boxShadow: 3, borderRadius: 2 }}>
                <CardHeader
                  title={`Template ID: ${template.id}`}
                  sx={{ backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 'bold' }}
                />
                <CardContent>
                  {template.mergeGroups.map((group, groupIndex) => (
                    <Paper elevation={2} sx={{ padding: 2, marginBottom: 2 }} key={groupIndex}>
                      <Typography variant="h6" gutterBottom>
                        Merge Group {groupIndex + 1}
                      </Typography>
                      <Typography variant="subtitle1" gutterBottom>
                        Columns:
                      </Typography>
                      <List dense>
                        {group.columns.map((column, columnIndex) => (
                          <ListItem key={columnIndex}>
                            <ListItemText primary={column.join(', ')} sx={{ color: 'gray' }} />
                          </ListItem>
                        ))}
                      </List>
                      <Divider sx={{ my: 1 }} />
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 'bold', marginBottom: 1 }}
                      >
                        Result Column Name:
                      </Typography>
                      <Typography
                        sx={{ color: '#333', fontSize: '14px', fontStyle: 'italic' }}
                      >
                        {group.resultColumnName.join(', ')}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 'bold', marginBottom: 1 }}
                      >
                        Value Mappings:
                      </Typography>
                      <List dense>
                        {Object.entries(group.valueMappings).map(([key, values], valueIndex) => (
                          <ListItem key={valueIndex}>
                            <ListItemText
                              primary={`${key}: ${values.join(', ')}`}
                              sx={{ color: '#555' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>No templates available.</Typography>
      )}
    </Box>
  );
};

export default TemplateList;
