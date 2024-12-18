import { Template, MergeGroup } from '../models/templates';

export const transformTemplates = (data: any[]): Template[] => {
  return data.map((templateArray: any[]) => {
    const templateObj: Record<string, any> = {};

    templateArray.forEach((item: any) => {
      templateObj[item.name] = item.value;
    });

    return {
      id: templateObj.Id,
      mergeGroups: (templateObj.MergeGroups || []).map((group: any[]) => {
        const groupObj: Record<string, any> = {};

        group.forEach((item: any) => {
          groupObj[item.name] = item.value;
        });

        return {
          columns: groupObj.Columns || [],
          valueMappings: (groupObj.ValueMappings || []).reduce(
            (acc: Record<string, string[]>, mapping: any) => {
              acc[mapping.name] = mapping.value;
              return acc;
            },
            {}
          ),
          resultColumnName: groupObj.ResultColumnName || [],
        };
      }),
    };
  });
};
