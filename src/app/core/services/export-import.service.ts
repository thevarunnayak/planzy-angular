import { Injectable, inject } from '@angular/core';
import { BoardStore } from '../stores/board.store';
import { TaskStore } from '../stores/task.store';
import { NotificationService } from './notification.service';
import { Board } from '../models/board.model';
import { Task } from '../models/task.model';

export interface BoardExportPackage {
  version: string;
  exportedAt: string;
  board: Board;
  tasks: Task[];
}

@Injectable({
  providedIn: 'root'
})
export class ExportImportService {
  private boardStore = inject(BoardStore);
  private taskStore = inject(TaskStore);
  private notificationService = inject(NotificationService);

  exportBoardToJson(boardId?: string): void {
    const targetBoard = boardId 
      ? this.boardStore.boards().find(b => b.id === boardId)
      : this.boardStore.activeBoard();

    if (!targetBoard) {
      this.notificationService.error('Export Failed', 'No valid board selected for export.');
      return;
    }

    const boardTasks = this.taskStore.tasks().filter(t => t.boardId === targetBoard.id);

    const exportData: BoardExportPackage = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      board: targetBoard,
      tasks: boardTasks
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const filename = `planzy-board-${targetBoard.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.json`;

    this.triggerDownload(blob, filename);
    this.notificationService.success('Export Successful', `Exported "${targetBoard.name}" JSON backup.`);
  }

  exportBoardToCsv(boardId?: string): void {
    const targetBoard = boardId 
      ? this.boardStore.boards().find(b => b.id === boardId)
      : this.boardStore.activeBoard();

    if (!targetBoard) {
      this.notificationService.error('Export Failed', 'No valid board selected for export.');
      return;
    }

    const boardTasks = this.taskStore.tasks().filter(t => t.boardId === targetBoard.id);
    const colMap = new Map(targetBoard.columns.map(c => [c.id, c.name]));

    const headers = [
      'Task ID',
      'Title',
      'Column',
      'Priority',
      'Description',
      'Due Date',
      'Est Hours',
      'Assignee Name',
      'Assignee Email',
      'Labels',
      'Comments Count',
      'Created At'
    ];

    const csvRows = [headers.join(',')];

    boardTasks.forEach(task => {
      const row = [
        this.escapeCsvField(task.id),
        this.escapeCsvField(task.title),
        this.escapeCsvField(colMap.get(task.columnId) || task.columnId),
        this.escapeCsvField(task.priority),
        this.escapeCsvField(task.description || ''),
        this.escapeCsvField(task.dueDate || ''),
        task.estimatedHours || 0,
        this.escapeCsvField(task.assignee?.name || ''),
        this.escapeCsvField(task.assignee?.email || ''),
        this.escapeCsvField(task.labels.join('; ')),
        task.comments?.length || 0,
        this.escapeCsvField(task.createdAt)
      ];
      csvRows.push(row.join(','));
    });

    const csvStr = csvRows.join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const filename = `planzy-board-${targetBoard.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.csv`;

    this.triggerDownload(blob, filename);
    this.notificationService.success('CSV Exported', `Exported "${targetBoard.name}" CSV spreadsheet.`);
  }

  importBoardFromJson(jsonContent: string): boolean {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed || !parsed.board || !parsed.board.name) {
        throw new Error('Invalid Planzy board backup file structure.');
      }

      const rawBoard: Board = parsed.board;
      const rawTasks: Task[] = Array.isArray(parsed.tasks) ? parsed.tasks : [];

      const newBoardId = `board-${Date.now()}`;
      const colIdMap = new Map<string, string>();

      const newColumns = (rawBoard.columns || []).map((col, idx) => {
        const newColId = `col-${Date.now()}-${idx}`;
        colIdMap.set(col.id, newColId);
        return {
          ...col,
          id: newColId
        };
      });

      const newBoard: Board = {
        ...rawBoard,
        id: newBoardId,
        name: `${rawBoard.name} (Imported)`,
        columns: newColumns.length > 0 ? newColumns : [
          { id: `col-${Date.now()}-0`, name: 'To Do', color: '#3A86FF', order: 1 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.boardStore.boards.update(list => [newBoard, ...list]);
      this.boardStore.selectBoard(newBoardId);

      const defaultColId = newBoard.columns[0].id;
      const newTasks: Task[] = rawTasks.map((t, idx) => ({
        ...t,
        id: `task-${Date.now()}-${idx}`,
        boardId: newBoardId,
        columnId: colIdMap.get(t.columnId) || defaultColId
      }));

      if (newTasks.length > 0) {
        this.taskStore.tasks.update(list => [...newTasks, ...list]);
      }

      this.notificationService.success('Board Imported!', `Successfully imported "${newBoard.name}" with ${newTasks.length} tasks.`);
      return true;
    } catch (err: any) {
      this.notificationService.error('Import Error', err?.message || 'Could not parse JSON backup file.');
      return false;
    }
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private escapeCsvField(field: string): string {
    if (!field) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  }
}
