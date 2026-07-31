import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Task, TaskFilter, TaskSortOption, CreateTaskDto, UpdateTaskDto } from '../models/task.model';
import { StorageService } from '../services/storage.service';
import { SoundService } from '../services/sound.service';
import { NotificationService } from '../services/notification.service';
import { AppwriteService } from '../services/appwrite.service';
import { ID, Query } from 'appwrite';

const INITIAL_TASKS: Task[] = [];

@Injectable({
  providedIn: 'root'
})
export class TaskStore {
  private storageService = inject(StorageService);
  private soundService = inject(SoundService);
  private notificationService = inject(NotificationService);
  private appwriteService = inject(AppwriteService);

  tasks = signal<Task[]>([]);
  filter = signal<TaskFilter>({ searchQuery: '' });
  sortBy = signal<TaskSortOption>('order');
  createModalOpen = signal<boolean>(false);

  allFavoriteTasks = computed(() => {
    return this.tasks().filter(t => t.isFavorite);
  });

  favoriteTasksCount = computed(() => {
    return this.allFavoriteTasks().length;
  });

  filteredTasks = computed(() => {
    let list = this.tasks();
    const f = this.filter();
    const sort = this.sortBy();

    if (f.boardId) {
      list = list.filter(t => t.boardId === f.boardId);
    }
    if (f.searchQuery) {
      const q = f.searchQuery.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.labels.some(l => l.toLowerCase().includes(q))
      );
    }
    if (f.priority && f.priority !== 'all') {
      list = list.filter(t => t.priority === f.priority);
    }
    if (f.favoriteOnly) {
      list = list.filter(t => t.isFavorite);
    }

    return [...list].sort((a, b) => {
      if (sort === 'priority') {
        const weights: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (weights[b.priority] || 0) - (weights[a.priority] || 0);
      }
      if (sort === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sort === 'title') {
        return a.title.localeCompare(b.title);
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
        [Query.equal('userId', userId)]
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
            subtasks: [],
            comments: [],
            history: [],
            order: idx + 1,
            sticker: 'bookmark',
            isFavorite: Boolean(doc['isFavorite']),
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt
          };
        });

        this.tasks.set(cloudTasks);
      }
    } catch {
      // Fallback to local tasks if collection doesn't exist yet or offline
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
      const payload: any = {
        boardId: dto.boardId || 'default-board',
        columnId: targetColumnId,
        title: dto.title,
        description: dto.description || '',
        priority: dto.priority || 'medium',
        dueDate: dto.dueDate || '',
        estimatedHours: dto.estimatedHours || 0,
        labels: taskLabels,
        isFavorite: false,
        userId: user.id
      };

      this.appwriteService.databases.createDocument(
        this.appwriteService.databaseId,
        'tasks',
        ID.unique(),
        payload
      ).then(doc => {
        // Swap tempId with real Appwrite document ID
        this.tasks.update(list => list.map(t => t.id === tempId ? { ...t, id: doc.$id } : t));
        this.notificationService.success('Cloud Synced!', `Task "${dto.title}" saved to Appwrite.`);
      }).catch(err => {
        this.notificationService.error(
          'Appwrite Task Sync Failed',
          err?.message || 'Check your Appwrite tasks collection permissions or attributes.'
        );
      });
    } else {
      this.notificationService.info('Saved Locally', `Sign in to sync "${dto.title}" to Appwrite Cloud.`);
    }

    return newTask;
  }

  updateTask(taskId: string, dto: UpdateTaskDto): void {
    const user = this.appwriteService.currentUser();
    if (user && taskId && !taskId.startsWith('task-')) {
      const payload: any = {};
      if (dto.title) payload.title = dto.title;
      if (dto.description !== undefined) payload.description = dto.description;
      if (dto.priority) payload.priority = dto.priority;
      if (dto.dueDate) payload.dueDate = dto.dueDate;
      if (dto.estimatedHours !== undefined) payload.estimatedHours = dto.estimatedHours;
      if (dto.columnId) payload.columnId = dto.columnId;
      if (dto.labels) payload.labels = dto.labels;
      if (dto.isFavorite !== undefined) payload.isFavorite = dto.isFavorite;

      if (Object.keys(payload).length > 0) {
        this.appwriteService.databases.updateDocument(
          this.appwriteService.databaseId,
          'tasks',
          taskId,
          payload
        ).catch(err => console.warn('Appwrite task update error:', err));
      }
    }

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
    this.notificationService.info('Task Updated', 'Changes saved');
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

  moveTaskColumn(taskId: string, newColumnId: string, newIndex: number = 0): void {
    const user = this.appwriteService.currentUser();
    if (user && taskId && !taskId.startsWith('task-')) {
      this.appwriteService.databases.updateDocument(
        this.appwriteService.databaseId,
        'tasks',
        taskId,
        { columnId: newColumnId }
      ).catch(err => console.warn('Appwrite task move error:', err));
    }

    this.tasks.update(list => {
      const task = list.find(t => t.id === taskId);
      if (!task) return list;

      const updated = list.map(t => {
        if (t.id === taskId) {
          const wasCompleted = t.columnId === 'done';
          const isCompletedNow = newColumnId === 'done';

          if (!wasCompleted && isCompletedNow) {
            this.soundService.playSuccessChime();
            this.notificationService.success('Task Completed! 🎉', `"${t.title}" is finished!`);
          } else {
            this.soundService.playPop();
          }

          return {
            ...t,
            columnId: newColumnId,
            order: newIndex,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });

      return updated;
    });
  }

  toggleFavorite(taskId: string): void {
    const target = this.tasks().find(t => t.id === taskId);
    if (!target) return;

    const newFav = !target.isFavorite;
    const user = this.appwriteService.currentUser();

    if (user && taskId && !taskId.startsWith('task-')) {
      this.appwriteService.databases.updateDocument(
        this.appwriteService.databaseId,
        'tasks',
        taskId,
        { isFavorite: newFav }
      ).catch(err => console.warn('Appwrite favorite update error:', err));
    }

    this.tasks.update(list => list.map(t => {
      if (t.id === taskId) {
        return { ...t, isFavorite: newFav };
      }
      return t;
    }));

    if (newFav) {
      this.notificationService.success('Starred Task ⭐', `Added "${target.title}" to Starred Tasks`);
    } else {
      this.notificationService.info('Unstarred Task', `Removed "${target.title}" from Starred Tasks`);
    }
  }

  updateFilter(partial: Partial<TaskFilter>): void {
    this.filter.update(f => ({ ...f, ...partial }));
  }

  setSortBy(sort: TaskSortOption): void {
    this.sortBy.set(sort);
  }
}
