import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Task, CreateTaskDto, UpdateTaskDto, TaskAssignee, TaskComment } from '../models/task.model';
import { StorageService } from '../services/storage.service';
import { SoundService } from '../services/sound.service';
import { AppwriteService } from '../services/appwrite.service';
import { NotificationService } from '../services/notification.service';
import { ID, Query } from 'appwrite';

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    boardId: 'default-board',
    columnId: 'todo',
    title: '🚀 Setup Project Architecture',
    description: 'Initialize Angular standalone project with signals and modern glassmorphic design system',
    priority: 'high',
    labels: ['Architecture', 'Setup'],
    subtasks: [
      { id: 'sub-1', title: 'Setup Appwrite SDK', completed: true },
      { id: 'sub-2', title: 'Configure SCSS theme tokens', completed: true }
    ],
    comments: [],
    order: 1,
    sticker: 'zap',
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    boardId: 'default-board',
    columnId: 'in_progress',
    title: '🎨 Build Kanban Board Components',
    description: 'Implement drag and drop, custom single select dropdowns, and task dialogs',
    priority: 'urgent',
    labels: ['Frontend', 'UI/UX'],
    subtasks: [
      { id: 'sub-3', title: 'Create Custom Single Select', completed: true }
    ],
    comments: [],
    order: 1,
    sticker: 'star',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

@Injectable({
  providedIn: 'root'
})
export class TaskStore {
  private storageService = inject(StorageService);
  private soundService = inject(SoundService);
  private appwriteService = inject(AppwriteService);
  private notificationService = inject(NotificationService);

  readonly tasks = signal<Task[]>([]);
  readonly searchQuery = signal<string>('');
  readonly filterPriority = signal<string>('all');
  readonly sortBy = signal<'order' | 'dueDate' | 'title' | 'createdAt'>('order');
  readonly createModalOpen = signal<boolean>(false);

  readonly allFavoriteTasks = computed(() => this.tasks().filter(t => t.isFavorite));
  readonly favoriteTasksCount = computed(() => this.allFavoriteTasks().length);

  readonly filteredTasks = computed(() => {
    let list = this.tasks();
    const query = this.searchQuery().toLowerCase().trim();
    const priority = this.filterPriority();
    const sort = this.sortBy();

    if (query) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.labels.some(l => l.toLowerCase().includes(query))
      );
    }

    if (priority !== 'all') {
      list = list.filter(t => t.priority === priority);
    }

    return [...list].sort((a, b) => {
      if (sort === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sort === 'title') {
        return a.title.localeCompare(a.title);
      }
      if (sort === 'createdAt') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return a.order - b.order;
    });
  });

  constructor() {
    const saved = this.storageService.getTasks();
    if (saved && saved.length > 0) {
      this.tasks.set(saved);
    } else {
      this.tasks.set(INITIAL_TASKS);
      this.storageService.saveTasks(INITIAL_TASKS);
    }

    effect(() => {
      this.storageService.saveTasks(this.tasks());
    });

    // Auto load Appwrite Cloud tasks when user logs in
    effect(() => {
      const user = this.appwriteService.currentUser();
      if (user) {
        this.fetchAppwriteTasks(user.id);
      }
    });
  }

  async fetchAppwriteTasks(userId: string): Promise<void> {
    try {
      const res = await this.appwriteService.databases.listDocuments(
        this.appwriteService.databaseId,
        'tasks',
        [Query.limit(200)]
      );

      if (res.documents.length > 0) {
        const cloudTasks: Task[] = res.documents.map((doc, idx) => {
          const rawLabels = doc['labels'];
          let parsedLabels: string[] = [];
          if (Array.isArray(rawLabels)) {
            parsedLabels = rawLabels;
          } else if (typeof rawLabels === 'string' && rawLabels.trim()) {
            parsedLabels = rawLabels.split(',').map(l => l.trim()).filter(Boolean);
          }

          let assignee: TaskAssignee | undefined = undefined;
          try {
            if (doc['assignee']) {
              assignee = typeof doc['assignee'] === 'string' ? JSON.parse(doc['assignee']) : doc['assignee'];
            }
          } catch {}

          let comments: TaskComment[] = [];
          try {
            const rawComm = doc['comments'] || doc['comments[]'];
            if (Array.isArray(rawComm)) {
              rawComm.forEach((c: any) => {
                try {
                  const parsed = typeof c === 'string' ? JSON.parse(c) : c;
                  if (parsed && typeof parsed === 'object') {
                    comments.push(parsed);
                  }
                } catch {}
              });
            } else if (typeof rawComm === 'string' && rawComm.trim()) {
              comments = JSON.parse(rawComm);
            }
          } catch {}

          return {
            id: doc.$id,
            boardId: doc['boardId'] || '',
            columnId: doc['columnId'] || 'todo',
            title: doc['title'] || 'Untitled Task',
            description: doc['description'] || '',
            priority: (doc['priority'] as any) || 'medium',
            dueDate: doc['dueDate'] || undefined,
            estimatedHours: doc['estimatedHours'] ? Number(doc['estimatedHours']) : undefined,
            actualHours: doc['actualHours'] ? Number(doc['actualHours']) : 0,
            labels: parsedLabels,
            assignee,
            comments,
            subtasks: [],
            history: [],
            order: idx + 1,
            sticker: 'bookmark',
            isFavorite: Boolean(doc['isFavorite']),
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt
          };
        });

        // Merge cloud tasks with unsynced local tasks so local creations aren't lost
        const cloudTaskIds = new Set(cloudTasks.map(ct => ct.id));
        const unsyncedLocalTasks = this.tasks().filter(t => t.id.startsWith('task-') && !cloudTaskIds.has(t.id));
        this.tasks.set([...cloudTasks, ...unsyncedLocalTasks]);
      }
    } catch (err) {
      console.warn('Appwrite fetchAppwriteTasks error:', err);
    }
  }

  openCreateModal(): void {
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  createTask(dto: CreateTaskDto): Task {
    const targetColumnId = dto.columnId || 'todo';
    const activeTasks = this.tasks().filter(t => t.columnId === targetColumnId);
    const tempId = `task-${Date.now()}`;
    const user = this.appwriteService.currentUser();

    const taskLabels = dto.labels || [];

    const newTask: Task = {
      id: tempId,
      boardId: dto.boardId || 'default-board',
      columnId: targetColumnId,
      title: dto.title,
      description: dto.description || '',
      priority: dto.priority || 'medium',
      dueDate: dto.dueDate,
      estimatedHours: dto.estimatedHours,
      actualHours: 0,
      labels: taskLabels,
      assignee: dto.assignee,
      subtasks: [],
      comments: [],
      history: [],
      order: activeTasks.length + 1,
      sticker: dto.sticker || 'bookmark',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tasks.update(list => [...list, newTask]);
    this.soundService.playPop();

    // Async sync to Appwrite Cloud if logged in
    if (user) {
      const serializedComments = dto.comments ? JSON.stringify(dto.comments) : '[]';

      const fullPayload: any = {
        boardId: dto.boardId || 'default-board',
        columnId: targetColumnId,
        title: dto.title,
        description: dto.description || '',
        priority: dto.priority || 'medium',
        dueDate: dto.dueDate || '',
        estimatedHours: dto.estimatedHours || 0,
        labels: taskLabels,
        assignee: dto.assignee ? JSON.stringify(dto.assignee) : '',
        comments: serializedComments,
        isFavorite: false,
        userId: user.id
      };

      const tryCreateDoc = (payloadData: any) => {
        return this.appwriteService.databases.createDocument(
          this.appwriteService.databaseId,
          'tasks',
          ID.unique(),
          payloadData
        );
      };

      tryCreateDoc(fullPayload).then(doc => {
        this.tasks.update(list => list.map(t => t.id === tempId ? { ...t, id: doc.$id } : t));
        this.notificationService.success('Cloud Synced!', `Task "${dto.title}" saved to Appwrite.`);
      }).catch(err => {
        console.warn('Appwrite full task creation failed, trying fallback with assignee & comments:', err);
        const fallbackAssigneePayload: any = {
          boardId: dto.boardId || 'default-board',
          columnId: targetColumnId,
          title: dto.title,
          priority: dto.priority || 'medium',
          assignee: dto.assignee ? JSON.stringify(dto.assignee) : '',
          comments: serializedComments,
          userId: user.id
        };

        tryCreateDoc(fallbackAssigneePayload).then(doc => {
          this.tasks.update(list => list.map(t => t.id === tempId ? { ...t, id: doc.$id } : t));
          this.notificationService.success('Cloud Synced!', `Task "${dto.title}" saved to Appwrite.`);
        }).catch(err2 => {
          console.warn('Appwrite assignee/comments fallback failed, trying minimal core payload:', err2);
          const barePayload: any = {
            boardId: dto.boardId || 'default-board',
            columnId: targetColumnId,
            title: dto.title,
            userId: user.id
          };

          tryCreateDoc(barePayload).then(doc => {
            this.tasks.update(list => list.map(t => t.id === tempId ? { ...t, id: doc.$id } : t));
            this.notificationService.success('Cloud Synced!', `Task "${dto.title}" saved to Appwrite.`);
          }).catch(err3 => {
            console.error('Appwrite task creation failed completely:', err3);
            this.notificationService.info(
              'Saved Locally',
              `Task "${dto.title}" preserved locally. (Appwrite error: ${err3?.message || 'Check Appwrite attributes'}).`
            );
          });
        });
      });
    } else {
      this.notificationService.info('Saved Locally', `Sign in to sync "${dto.title}" to Appwrite Cloud.`);
    }

    return newTask;
  }

  updateTask(taskId: string, dto: UpdateTaskDto): void {
    // 1. Immediately update local state so UI reflects edits instantly
    this.tasks.update(list => list.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          ...dto,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    // 2. Sync to Appwrite Cloud
    const user = this.appwriteService.currentUser();
    if (user && taskId && !taskId.startsWith('task-')) {
      const serializedComments = dto.comments !== undefined
        ? (typeof dto.comments === 'string' ? dto.comments : JSON.stringify(dto.comments))
        : undefined;

      const fullPayload: any = {};
      if (dto.title !== undefined) fullPayload.title = dto.title;
      if (dto.description !== undefined) fullPayload.description = dto.description;
      if (dto.priority !== undefined) fullPayload.priority = dto.priority;
      if (dto.dueDate !== undefined) fullPayload.dueDate = dto.dueDate || '';
      if (dto.estimatedHours !== undefined) fullPayload.estimatedHours = dto.estimatedHours || 0;
      if (dto.columnId !== undefined) fullPayload.columnId = dto.columnId;
      if (dto.labels !== undefined) fullPayload.labels = dto.labels;
      if (dto.isFavorite !== undefined) fullPayload.isFavorite = dto.isFavorite;
      if (dto.assignee !== undefined) fullPayload.assignee = dto.assignee ? JSON.stringify(dto.assignee) : '';
      if (serializedComments !== undefined) fullPayload.comments = serializedComments;

      if (Object.keys(fullPayload).length > 0) {
        this.appwriteService.databases.updateDocument(
          this.appwriteService.databaseId,
          'tasks',
          taskId,
          fullPayload
        ).then(() => {
          console.log('Appwrite task updated with full payload');
        }).catch(err => {
          console.warn('Appwrite full updateTask failed, trying fallback with assignee & comments:', err);

          // Fallback 1: Include core fields + assignee + comments
          const fallbackAssigneePayload: any = {};
          if (dto.title !== undefined) fallbackAssigneePayload.title = dto.title;
          if (dto.columnId !== undefined) fallbackAssigneePayload.columnId = dto.columnId;
          if (dto.priority !== undefined) fallbackAssigneePayload.priority = dto.priority;
          if (dto.isFavorite !== undefined) fallbackAssigneePayload.isFavorite = dto.isFavorite;
          if (dto.assignee !== undefined) fallbackAssigneePayload.assignee = dto.assignee ? JSON.stringify(dto.assignee) : '';
          if (serializedComments !== undefined) fallbackAssigneePayload.comments = serializedComments;

          this.appwriteService.databases.updateDocument(
            this.appwriteService.databaseId,
            'tasks',
            taskId,
            fallbackAssigneePayload
          ).then(() => {
            console.log('Appwrite task updated with assignee & comments fallback payload');
          }).catch(err2 => {
            console.warn('Appwrite assignee/comments fallback update failed, trying array comments fallback:', err2);

            // Fallback 2: Try string array comments format if comments attribute in console is string array
            if (Array.isArray(dto.comments)) {
              fallbackAssigneePayload.comments = dto.comments.map(c => JSON.stringify(c));
              this.appwriteService.databases.updateDocument(
                this.appwriteService.databaseId,
                'tasks',
                taskId,
                fallbackAssigneePayload
              ).catch(() => {});
            }
          });
        });
      }
    }
  }

  toggleFavorite(taskId: string): void {
    const target = this.tasks().find(t => t.id === taskId);
    if (!target) return;

    this.updateTask(taskId, { isFavorite: !target.isFavorite });
  }

  deleteTask(taskId: string): void {
    const target = this.tasks().find(t => t.id === taskId);
    const user = this.appwriteService.currentUser();

    if (user && taskId && !taskId.startsWith('task-')) {
      this.appwriteService.databases.deleteDocument(
        this.appwriteService.databaseId,
        'tasks',
        taskId
      ).catch(err => console.warn('Appwrite task delete error:', err));
    }

    this.tasks.update(list => list.filter(t => t.id !== taskId));
    if (target) {
      this.notificationService.info('Task Deleted', `Removed "${target.title}"`);
    }
  }

  moveTask(taskId: string, targetColumnId: string, newIndex?: number): void {
    const target = this.tasks().find(t => t.id === taskId);
    if (!target) return;

    this.updateTask(taskId, { columnId: targetColumnId });
  }

  moveTaskColumn(taskId: string, targetColumnId: string, newIndex?: number): void {
    this.moveTask(taskId, targetColumnId, newIndex);
  }
}
