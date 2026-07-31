import { TestBed } from '@angular/core/testing';
import { TaskStore } from './task.store';
import { BoardStore } from './board.store';
import { StorageService } from '../services/storage.service';

describe('TaskStore', () => {
  let store: TaskStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskStore, BoardStore, StorageService]
    });
    store = TestBed.inject(TaskStore);
  });

  it('should create a task successfully', () => {
    const initialCount = store.tasks().length;
    const task = store.createTask({ title: 'Unit Test Task', priority: 'high' });

    expect(store.tasks().length).toBe(initialCount + 1);
    expect(task.title).toBe('Unit Test Task');
    expect(task.priority).toBe('high');
  });

  it('should toggle favorite status', () => {
    const task = store.createTask({ title: 'Fav Task' });
    expect(task.isFavorite).toBeFalse();

    store.toggleFavorite(task.id);
    const updated = store.tasks().find(t => t.id === task.id);
    expect(updated?.isFavorite).toBeTrue();
  });

  it('should move task between columns', () => {
    const task = store.createTask({ title: 'Moving Task', columnId: 'todo' });
    store.moveTaskColumn(task.id, 'done');

    const updated = store.tasks().find(t => t.id === task.id);
    expect(updated?.columnId).toBe('done');
  });

  it('should delete a task', () => {
    const task = store.createTask({ title: 'Delete Me' });
    const countBefore = store.tasks().length;

    store.deleteTask(task.id);
    expect(store.tasks().length).toBe(countBefore - 1);
  });
});
