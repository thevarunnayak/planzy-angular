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
  text?: string;
  createdAt: string;
}

export interface TaskHistoryItem {
  id: string;
  action: string;
  timestamp: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  fileId?: string;
  createdAt: string;
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
  attachments?: TaskAttachment[];
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
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
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
  attachments?: TaskAttachment[];
  isFavorite?: boolean;
  sticker?: string;
}
