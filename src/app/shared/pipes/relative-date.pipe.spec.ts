import { RelativeDatePipe } from './relative-date.pipe';

describe('RelativeDatePipe', () => {
  let pipe: RelativeDatePipe;

  beforeEach(() => {
    pipe = new RelativeDatePipe();
  });

  it('should return "Today" for today\'s date', () => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(pipe.transform(today)).toBe('Today');
  });

  it('should return "No due date" if no date string provided', () => {
    expect(pipe.transform(undefined)).toBe('No due date');
  });
});
