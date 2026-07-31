import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Board, Column } from '../models/board.model';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';
import { AppwriteService } from '../services/appwrite.service';
import { ID, Query } from 'appwrite';

const INITIAL_BOARDS: Board[] = [];

@Injectable({
  providedIn: 'root'
})
export class BoardStore {
  private storageService = inject(StorageService);
  private notificationService = inject(NotificationService);
  private appwriteService = inject(AppwriteService);

  boards = signal<Board[]>([]);
  activeBoardId = signal<string | null>(null);
  createModalOpen = signal<boolean>(false);

  activeBoard = computed<Board | null>(() => {
    const list = this.boards();
    const id = this.activeBoardId();
    if (!id && list.length > 0) return list[0];
    return list.find(b => b.id === id) || (list.length > 0 ? list[0] : null);
  });

  activeColumns = computed<Column[]>(() => {
    const board = this.activeBoard();
    return board ? board.columns : [];
  });

  constructor() {
    const saved = this.storageService.getBoards();
    if (saved && saved.length > 0) {
      this.boards.set(saved);
      this.activeBoardId.set(saved[0].id);
    } else {
      this.boards.set(INITIAL_BOARDS);
      this.storageService.saveBoards(INITIAL_BOARDS);
    }

    effect(() => {
      this.storageService.saveBoards(this.boards());
    });

    // Auto load Appwrite Cloud boards when user logs in
    effect(() => {
      const user = this.appwriteService.currentUser();
      if (user) {
        this.fetchAppwriteBoards(user.id);
      }
    });
  }

  async fetchAppwriteBoards(userId: string): Promise<void> {
    try {
      const res = await this.appwriteService.databases.listDocuments(
        this.appwriteService.databaseId,
        'boards',
        [Query.equal('userId', userId)]
      );

      if (res.documents.length > 0) {
        const cloudBoards: Board[] = res.documents.map(doc => ({
          id: doc.$id,
          name: doc['name'] || 'Untitled Board',
          description: doc['description'] || '',
          emoji: doc['emoji'] || 'folder',
          columns: [
            { id: 'todo', name: 'To Do', color: '#3A86FF', order: 1 },
            { id: 'in_progress', name: 'In Progress', color: '#8ECAE6', order: 2 },
            { id: 'done', name: 'Done', color: '#38B000', order: 3 }
          ],
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt
        }));

        this.boards.set(cloudBoards);
        if (!this.activeBoardId() && cloudBoards.length > 0) {
          this.activeBoardId.set(cloudBoards[0].id);
        }
      }
    } catch (err: any) {
      console.warn('Appwrite list boards fallback:', err);
    }
  }

  openCreateModal(): void {
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  selectBoard(boardId: string): void {
    this.activeBoardId.set(boardId);
  }

  createBoard(name: string, description: string = '', emoji: string = 'folder'): Board {
    const tempId = `board-${Date.now()}`;
    const user = this.appwriteService.currentUser();

    const newBoard: Board = {
      id: tempId,
      name,
      description,
      emoji,
      columns: [
        { id: 'todo', name: 'To Do', color: '#3A86FF', order: 1 },
        { id: 'in_progress', name: 'In Progress', color: '#8ECAE6', order: 2 },
        { id: 'done', name: 'Done', color: '#38B000', order: 3 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.boards.update(list => [...list, newBoard]);
    this.activeBoardId.set(newBoard.id);
    this.closeCreateModal();

    // Async sync to Appwrite Cloud if logged in
    if (user) {
      this.appwriteService.databases.createDocument(
        this.appwriteService.databaseId,
        'boards',
        ID.unique(),
        {
          name,
          description,
          emoji,
          userId: user.id
        }
      ).then(doc => {
        // Swap tempId with real Appwrite document ID
        this.boards.update(list => list.map(b => b.id === tempId ? { ...b, id: doc.$id } : b));
        if (this.activeBoardId() === tempId) {
          this.activeBoardId.set(doc.$id);
        }
        this.notificationService.success('Cloud Synced!', `Board "${name}" saved to Appwrite.`);
      }).catch(err => {
        this.notificationService.error(
          'Appwrite Sync Failed',
          err?.message || 'Check your Appwrite boards collection permissions or attributes.'
        );
      });
    } else {
      this.notificationService.info('Saved Locally', `Sign in to sync "${name}" to Appwrite Cloud.`);
    }

    return newBoard;
  }

  updateBoard(boardId: string, updates: Partial<Board>): void {
    this.boards.update(list => list.map(b => {
      if (b.id === boardId) {
        return { ...b, ...updates, updatedAt: new Date().toISOString() };
      }
      return b;
    }));
    this.notificationService.info('Board Updated', 'Workspace changes saved');
  }

  deleteBoard(boardId: string): void {
    const target = this.boards().find(b => b.id === boardId);
    const user = this.appwriteService.currentUser();

    if (user && boardId && !boardId.startsWith('board-')) {
      this.appwriteService.databases.deleteDocument(
        this.appwriteService.databaseId,
        'boards',
        boardId
      ).catch(err => {
        console.warn('Appwrite board delete error:', err);
      });
    }

    this.boards.update(list => list.filter(b => b.id !== boardId));
    const remaining = this.boards();
    if (remaining.length > 0) {
      this.activeBoardId.set(remaining[0].id);
    } else {
      this.activeBoardId.set(null);
    }
    if (target) {
      this.notificationService.info('Board Deleted', `Removed "${target.name}"`);
    }
  }

  duplicateBoard(boardId: string): void {
    const original = this.boards().find(b => b.id === boardId);
    if (!original) return;

    this.createBoard(`${original.name} (Copy)`, original.description, original.emoji);
  }

  addColumn(boardId: string, name: string, color: string = '#3A86FF'): void {
    this.boards.update(list => list.map(b => {
      if (b.id === boardId) {
        const newCol: Column = {
          id: `col-${Date.now()}`,
          name,
          color,
          order: b.columns.length + 1
        };
        return { ...b, columns: [...b.columns, newCol], updatedAt: new Date().toISOString() };
      }
      return b;
    }));
    this.notificationService.success('Column Added', `Column "${name}" created.`);
  }

  deleteColumn(boardId: string, columnId: string): void {
    this.boards.update(list => list.map(b => {
      if (b.id === boardId) {
        return {
          ...b,
          columns: b.columns.filter(c => c.id !== columnId),
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    }));
    this.notificationService.info('Column Deleted', 'Column removed from board');
  }
}
