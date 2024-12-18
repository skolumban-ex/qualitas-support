export interface Template {
    id: string;
    mergeGroups: MergeGroup[];
  }
  
  export interface MergeGroup {
    columns: string[][];
    valueMappings: Record<string, string[]>;
    resultColumnName: string[];
  }