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
