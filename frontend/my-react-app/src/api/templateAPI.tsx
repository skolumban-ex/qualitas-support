import axios from 'axios';
import { Template } from '../models/templates';
import { transformTemplates } from '../utils/transformTemplate';

const api = axios.create({
  baseURL: 'http://localhost:7144/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAllTemplates = async (): Promise<Template[]> => {
  const response = await api.get('/conversion-templates');
  return transformTemplates(response.data);
};

export const saveTemplate = async (template: Template): Promise<Template> => {
  const response = await api.post('/conversion-templates', template);
  return response.data;
};

export const processColumns = async (
  mergeGroups: {
    MergeGroups: {
      Columns: string[][];
      ValueMappings: Record<string, string[]>;
      ResultColumnName: string[];
    }[];
  },
  file: File
): Promise<any> => {
  const formData = new FormData();
  formData.append('mergeGroups', JSON.stringify(mergeGroups));
  formData.append('file', file);

  const response = await api.post('/process-columns', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};