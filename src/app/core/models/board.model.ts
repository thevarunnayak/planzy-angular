export interface Column {
  id: string;
  name: string;
  color: string;
  order: number;
  limit?: number;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  emoji: string;
  columns: Column[];
  isFavorite?: boolean;
  isArchived?: boolean;
  themeColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  columns: { name: string; color: string }[];
  defaultTasks: { title: string; priority: 'urgent' | 'high' | 'medium' | 'low'; column: string }[];
}
