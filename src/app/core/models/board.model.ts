export type MemberRole = 'owner' | 'admin' | 'member';

export interface BoardMember {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: MemberRole;
  joinedAt: string;
}

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
  isGroup?: boolean; // false = Individual Private Board, true = Group Board
  ownerId?: string;
  members?: BoardMember[];
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
