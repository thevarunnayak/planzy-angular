import { Column } from './board.model';
import { CreateTaskDto } from './task.model';

export interface BoardTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  isGroup: boolean;
  columns: { name: string; color: string }[];
  starterTasks: CreateTaskDto[];
}

export const STARTER_BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'tpl-agile-sprint',
    name: 'Agile Sprint Board',
    category: 'Software & Engineering',
    description: 'Structure sprint workflows with backlog, active development, code reviews, and QA testing.',
    badge: 'Popular',
    isGroup: true,
    columns: [
      { name: 'Sprint Backlog', color: '#6C757D' },
      { name: 'In Development', color: '#3A86FF' },
      { name: 'Code Review', color: '#8338EC' },
      { name: 'QA Testing', color: '#FF006E' },
      { name: 'Done', color: '#38B000' }
    ],
    starterTasks: [
      {
        title: 'Design API Data Models & Schemas',
        description: 'Define TypeScript interfaces and DTOs for the backend endpoints.',
        priority: 'high',
        estimatedHours: 4,
        labels: ['Backend', 'Architecture']
      },
      {
        title: 'Implement User Auth & JWT Token Refresh',
        description: 'Set up login, registration, and persistent session storage.',
        priority: 'urgent',
        estimatedHours: 6,
        labels: ['Security', 'Auth']
      },
      {
        title: 'Unit Test Coverage for Core Services',
        description: 'Write Jasmine/Karma specs for state stores and API client services.',
        priority: 'medium',
        estimatedHours: 3,
        labels: ['Testing', 'QA']
      }
    ]
  },
  {
    id: 'tpl-goal-tracker',
    name: 'Personal Goal Tracker',
    category: 'Productivity & Growth',
    description: 'Track yearly aspirations, quarterly milestones, active habits, and milestone victories.',
    badge: 'Personal',
    isGroup: false,
    columns: [
      { name: 'Yearly Aspirations', color: '#8338EC' },
      { name: 'Quarterly Milestones', color: '#3A86FF' },
      { name: 'Active Focus', color: '#FF006E' },
      { name: 'Achieved Victories', color: '#38B000' }
    ],
    starterTasks: [
      {
        title: 'Complete Master Angular & Modern Web Architecture',
        description: 'Finish advanced courses on state signals, RxJS, and performance optimization.',
        priority: 'high',
        estimatedHours: 20,
        labels: ['Learning', 'Career']
      },
      {
        title: 'Run 10km Endurance Run',
        description: 'Train 3x a week with progressive distance targets.',
        priority: 'medium',
        estimatedHours: 10,
        labels: ['Health', 'Fitness']
      }
    ]
  },
  {
    id: 'tpl-content-calendar',
    name: 'Content & Marketing Calendar',
    category: 'Marketing & Media',
    description: 'Plan, draft, review, and schedule social media posts, blog articles, and video content.',
    badge: 'Marketing',
    isGroup: true,
    columns: [
      { name: 'Content Ideas', color: '#FFBE0B' },
      { name: 'Drafting & Copy', color: '#FB5607' },
      { name: 'Review & Assets', color: '#3A86FF' },
      { name: 'Scheduled', color: '#8338EC' },
      { name: 'Published', color: '#38B000' }
    ],
    starterTasks: [
      {
        title: 'Launch Product Feature Showcase Video',
        description: 'Record 2-minute video overview highlighting new Kanban workspace features.',
        priority: 'high',
        estimatedHours: 5,
        labels: ['Video', 'Showcase']
      },
      {
        title: 'Draft Monthly Product Newsletter',
        description: 'Summarize top release notes, tips, and user feedback highlights.',
        priority: 'medium',
        estimatedHours: 3,
        labels: ['Email', 'Newsletter']
      }
    ]
  },
  {
    id: 'tpl-product-roadmap',
    name: 'Product Launch Roadmap',
    category: 'Product Management',
    description: 'Execute multi-phase product launches from market research and UX design to public release.',
    badge: 'Strategy',
    isGroup: true,
    columns: [
      { name: 'Phase 1: Research', color: '#3A86FF' },
      { name: 'Phase 2: UX Design', color: '#8338EC' },
      { name: 'Phase 3: Development', color: '#FF006E' },
      { name: 'Phase 4: Launch & PR', color: '#38B000' }
    ],
    starterTasks: [
      {
        title: 'Conduct User Research & Competitor Analysis',
        description: 'Gather feedback from beta testers and benchmark key productivity metrics.',
        priority: 'high',
        estimatedHours: 8,
        labels: ['Research', 'Strategy']
      },
      {
        title: 'Figma Wireframes & Interactive Prototypes',
        description: 'Design dark/light mode responsive component layouts and navigation design.',
        priority: 'urgent',
        estimatedHours: 12,
        labels: ['Design', 'UI/UX']
      }
    ]
  }
];
