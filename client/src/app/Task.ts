
export interface Task {
    Id?: number;
    TaskText: string;
    isTaskActive?: boolean;
}

export const TASKS: Task[] = [
    {
      Id: 1,
      TaskText: 'Do the dishes',
      isTaskActive: true
    },
    {
      Id: 2,
      TaskText: 'Unload Dog shit',
      isTaskActive: false
    },
    {
      Id: 3,
      TaskText: 'Food Shopping',
      isTaskActive: true
    }
];