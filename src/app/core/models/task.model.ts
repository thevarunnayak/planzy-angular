export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = string;

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAssignee {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface TaskHistoryItem {
  id: string;
  action: string;
  timestamp: string;
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  labels: string[];
  subtasks: Subtask[];
  comments: TaskComment[];
  assignee?: TaskAssignee;
  history?: TaskHistoryItem[];
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  isFavorite?: boolean;
  isArchived?: boolean;
  sticker?: string;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface TaskFilter {
  searchQuery: string;
  boardId?: string;
  priority?: TaskPriority | 'all';
  label?: string | 'all';
  favoriteOnly?: boolean;
  hasSubtasksOnly?: boolean;
  dueSoonOnly?: boolean;
}

export type TaskSortOption = 'priority' | 'dueDate' | 'title' | 'createdAt' | 'order';

export interface CreateTaskDto {
  boardId?: string;
  columnId?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  labels?: string[];
  assignee?: TaskAssignee;
  sticker?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  columnId?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  labels?: string[];
  assignee?: TaskAssignee;
  comments?: TaskComment[];
  isFavorite?: boolean;
  sticker?: string;
}
