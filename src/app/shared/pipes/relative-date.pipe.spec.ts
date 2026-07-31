import { RelativeDatePipe } from './relative-date.pipe';

describe('RelativeDatePipe', () => {
  let pipe: RelativeDatePipe;

  beforeEach(() => {
    pipe = new RelativeDatePipe();
  });

  it('should return "Today" for today\'s date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(pipe.transform(today)).toBe('Today');
  });

  it('should return "No due date" if no date string provided', () => {
    expect(pipe.transform(undefined)).toBe('No due date');
  });
});
