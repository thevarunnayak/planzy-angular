import { ProgressPipe } from './progress.pipe';

describe('ProgressPipe', () => {
  const pipe = new ProgressPipe();

  it('should return 0 percentage for empty subtasks', () => {
    expect(pipe.transform([])).toEqual({ completed: 0, total: 0, percentage: 0 });
  });

  it('should calculate correct completion percentage', () => {
    const subtasks = [
      { id: '1', title: 'Task 1', completed: true },
      { id: '2', title: 'Task 2', completed: false }
    ];
    expect(pipe.transform(subtasks)).toEqual({ completed: 1, total: 2, percentage: 50 });
  });
});
