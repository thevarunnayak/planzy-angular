import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Board, BoardMember, Column, MemberRole } from '../models/board.model';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';
import { AppwriteService } from '../services/appwrite.service';
import { TaskStore } from './task.store';
import { ID, Query } from 'appwrite';

const INITIAL_BOARDS: Board[] = [];

@Injectable({
  providedIn: 'root'
})
export class BoardStore {
  private storageService = inject(StorageService);
  private notificationService = inject(NotificationService);
  private appwriteService = inject(AppwriteService);
  private taskStore = inject(TaskStore);

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

  // Computed Role Guards for Active Board
  currentUserRole = computed<MemberRole | null>(() => {
    const board = this.activeBoard();
    const user = this.appwriteService.currentUser();
    if (!board || !user) return 'owner';

    if (board.ownerId === user.id) return 'owner';

    const mem = (board.members || []).find(m => m.userId === user.id || (m.email && m.email.toLowerCase() === user.email?.toLowerCase()));
    if (mem) return mem.role;

    return 'owner';
  });

  isOwner = computed(() => this.currentUserRole() === 'owner');
  isAdmin = computed(() => this.currentUserRole() === 'admin');
  isMember = computed(() => this.currentUserRole() === 'member');

  // Can user create/edit tasks & columns?
  canCreateTask = computed(() => this.isOwner() || this.isAdmin());
  canEditBoard = computed(() => this.isOwner() || this.isAdmin());

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
        [Query.limit(100)]
      );

      if (res.documents.length > 0) {
        const myEmail = this.appwriteService.currentUser()?.email?.toLowerCase() || '';

        const cloudBoards: Board[] = res.documents
          .map(doc => {
            let members: BoardMember[] = [];
            const rawMembers = doc['members'] || doc['members[]'];
            if (Array.isArray(rawMembers)) {
              rawMembers.forEach((m: any) => {
                try {
                  const parsed = typeof m === 'string' ? JSON.parse(m) : m;
                  if (parsed && typeof parsed === 'object') {
                    members.push(parsed);
                  }
                } catch {}
              });
            } else if (typeof rawMembers === 'string' && rawMembers.trim()) {
              try {
                const parsed = JSON.parse(rawMembers);
                if (Array.isArray(parsed)) members = parsed;
              } catch {}
            }

            const isGroupVal = typeof doc['isGroup'] === 'boolean' ? doc['isGroup'] : false;

            return {
              id: doc.$id,
              name: doc['name'] || 'Untitled Board',
              description: doc['description'] || '',
              emoji: doc['emoji'] || 'folder',
              isGroup: isGroupVal,
              ownerId: doc['userId'] || userId,
              members,
              columns: [
                { id: 'todo', name: 'To Do', color: '#3A86FF', order: 1 },
                { id: 'in_progress', name: 'In Progress', color: '#8ECAE6', order: 2 },
                { id: 'done', name: 'Done', color: '#38B000', order: 3 }
              ],
              createdAt: doc.$createdAt,
              updatedAt: doc.$updatedAt
            };
          })
          .filter(board => {
            if (board.ownerId === userId) return true;
            if (board.members && board.members.some(m => m.userId === userId || (m.email && m.email.toLowerCase() === myEmail))) {
              return true;
            }
            return false;
          });

        // Preserve local shared group boards so accepting an invitation doesn't get wiped
        const cloudBoardIds = new Set(cloudBoards.map(b => b.id));
        const unsyncedSharedBoards = this.boards().filter(b => b.isGroup && !cloudBoardIds.has(b.id));
        const mergedBoards = [...cloudBoards, ...unsyncedSharedBoards];

        this.boards.set(mergedBoards);
        if (!this.activeBoardId() && mergedBoards.length > 0) {
          this.activeBoardId.set(mergedBoards[0].id);
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

  createBoard(
    name: string,
    description: string = '',
    emoji: string = 'folder',
    isGroup: boolean = false
  ): Board {
    const tempId = `board-${Date.now()}`;
    const user = this.appwriteService.currentUser();

    const initialMembers: BoardMember[] = user ? [
      {
        userId: user.id,
        name: user.name || user.email,
        email: user.email,
        role: 'owner',
        joinedAt: new Date().toISOString()
      }
    ] : [];

    const newBoard: Board = {
      id: tempId,
      name,
      description,
      emoji,
      isGroup,
      ownerId: user ? user.id : 'guest',
      members: initialMembers,
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
      const payload: any = {
        name,
        description,
        emoji,
        isGroup: Boolean(isGroup),
        userId: user.id
      };

      if (initialMembers.length > 0) {
        payload['members'] = [JSON.stringify(initialMembers[0])];
      }

      this.appwriteService.databases.createDocument(
        this.appwriteService.databaseId,
        'boards',
        ID.unique(),
        payload
      ).then(doc => {
        this.boards.update(list => list.map(b => b.id === tempId ? { ...b, id: doc.$id } : b));
        if (this.activeBoardId() === tempId) {
          this.activeBoardId.set(doc.$id);
        }
        this.notificationService.success('Cloud Synced!', `Board "${name}" saved to Appwrite Cloud.`);
      }).catch(err => {
        const fallbackPayload: any = {
          name,
          description,
          emoji,
          isGroup: Boolean(isGroup),
          members: JSON.stringify(initialMembers),
          userId: user.id
        };

        this.appwriteService.databases.createDocument(
          this.appwriteService.databaseId,
          'boards',
          ID.unique(),
          fallbackPayload
        ).then(doc => {
          this.boards.update(list => list.map(b => b.id === tempId ? { ...b, id: doc.$id } : b));
          if (this.activeBoardId() === tempId) {
            this.activeBoardId.set(doc.$id);
          }
          this.notificationService.success('Cloud Synced!', `Board "${name}" saved to Appwrite Cloud.`);
        }).catch(err2 => {
          this.notificationService.error(
            'Appwrite Board Notice',
            err2?.message || err?.message || 'Could not sync board attributes to Appwrite Cloud.'
          );
        });
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

    const user = this.appwriteService.currentUser();
    if (user && boardId && !boardId.startsWith('board-')) {
      const payload: any = {};
      if (updates.name) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.emoji) payload.emoji = updates.emoji;
      if (updates.isGroup !== undefined) payload.isGroup = updates.isGroup;
      if (updates.members) {
        payload.members = updates.members.map(m => JSON.stringify(m));
      }

      if (Object.keys(payload).length > 0) {
        this.appwriteService.databases.updateDocument(
          this.appwriteService.databaseId,
          'boards',
          boardId,
          payload
        ).catch(() => {
          if (updates.members) {
            payload.members = JSON.stringify(updates.members);
            this.appwriteService.databases.updateDocument(
              this.appwriteService.databaseId,
              'boards',
              boardId,
              payload
            ).catch(() => {});
          }
        });
      }
    }

    this.notificationService.info('Board Updated', 'Workspace changes saved');
  }

  updateMemberRole(userId: string, newRole: MemberRole): void {
    const active = this.activeBoard();
    if (!active) return;

    const updatedMembers = (active.members || []).map(m => m.userId === userId ? { ...m, role: newRole } : m);
    this.updateBoard(active.id, { members: updatedMembers });
  }

  removeMember(userId: string): void {
    const active = this.activeBoard();
    if (!active) return;

    const updatedMembers = (active.members || []).filter(m => m.userId !== userId);
    this.updateBoard(active.id, { members: updatedMembers });
  }

  async acceptBoardInvitation(boardId: string, memberData: BoardMember, boardNameFallback?: string): Promise<void> {
    try {
      const doc = await this.appwriteService.databases.getDocument(
        this.appwriteService.databaseId,
        'boards',
        boardId
      ).catch(() => null);

      let currentMembers: BoardMember[] = [];
      let realName = boardNameFallback || 'Shared Group Board';
      let realDesc = 'Shared group workspace';
      let realEmoji = '👥';
      let realOwnerId = 'shared';
      let createdAt = new Date().toISOString();
      let updatedAt = new Date().toISOString();

      if (doc) {
        realName = doc['name'] || realName;
        realDesc = doc['description'] || '';
        realEmoji = doc['emoji'] || '👥';
        realOwnerId = doc['userId'] || 'shared';
        createdAt = doc.$createdAt || createdAt;
        updatedAt = doc.$updatedAt || updatedAt;

        const rawMembers = doc['members'] || doc['members[]'];
        if (Array.isArray(rawMembers)) {
          rawMembers.forEach((m: any) => {
            try { currentMembers.push(typeof m === 'string' ? JSON.parse(m) : m); } catch {}
          });
        } else if (typeof rawMembers === 'string' && rawMembers.trim()) {
          try { currentMembers = JSON.parse(rawMembers); } catch {}
        }
      }

      const updatedMembers = [
        ...currentMembers.filter(m => m.userId !== memberData.userId && m.email?.toLowerCase() !== memberData.email?.toLowerCase()),
        memberData
      ];

      // Update Appwrite Cloud document if accessible
      if (doc) {
        await this.appwriteService.databases.updateDocument(
          this.appwriteService.databaseId,
          'boards',
          boardId,
          {
            members: updatedMembers.map(m => JSON.stringify(m))
          }
        ).catch(() => {
          this.appwriteService.databases.updateDocument(
            this.appwriteService.databaseId,
            'boards',
            boardId,
            { members: JSON.stringify(updatedMembers) }
          ).catch(() => {});
        });
      }

      const realBoard: Board = {
        id: boardId,
        name: realName,
        description: realDesc,
        emoji: realEmoji,
        isGroup: true,
        ownerId: realOwnerId,
        members: updatedMembers,
        columns: [
          { id: 'todo', name: 'To Do', color: '#3A86FF', order: 1 },
          { id: 'in_progress', name: 'In Progress', color: '#8ECAE6', order: 2 },
          { id: 'done', name: 'Done', color: '#38B000', order: 3 }
        ],
        createdAt,
        updatedAt
      };

      this.boards.update(list => {
        const filtered = list.filter(b => b.id !== boardId);
        return [...filtered, realBoard];
      });
      this.selectBoard(boardId);

      // Refresh tasks from Appwrite Cloud for newly joined group board
      const currentUser = this.appwriteService.currentUser();
      if (currentUser) {
        this.taskStore.fetchAppwriteTasks(currentUser.id);
      }
    } catch (err) {
      console.warn('Accept invitation board fetch error:', err);
    }
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

    this.createBoard(`${original.name} (Copy)`, original.description, original.emoji, original.isGroup || false);
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
