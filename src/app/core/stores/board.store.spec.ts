import { TestBed } from '@angular/core/testing';
import { BoardStore } from './board.store';
import { StorageService } from '../services/storage.service';

describe('BoardStore', () => {
  let store: BoardStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [BoardStore, StorageService]
    });
    store = TestBed.inject(BoardStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialize empty when no boards are saved', () => {
    expect(store.boards().length).toBe(0);
  });

  it('should create a new board and select it', () => {
    const board = store.createBoard('Project Board', 'Testing board');
    expect(board).toBeTruthy();
    expect(store.boards().length).toBe(1);
    expect(store.activeBoardId()).toBe(board.id);
  });

  it('should duplicate a board', () => {
    const original = store.createBoard('Original', 'Desc');
    store.duplicateBoard(original.id);
    expect(store.boards().length).toBe(2);
    expect(store.boards()[1].name).toBe('Original (Copy)');
  });

  it('should add column to board', () => {
    const board = store.createBoard('Test', 'Desc');
    store.addColumn(board.id, 'Testing Column', '#3A86FF');
    const updated = store.boards().find(b => b.id === board.id);
    expect(updated?.columns.length).toBe(4);
  });
});
