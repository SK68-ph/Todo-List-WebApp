
export interface Task {
    Id: number;
    TaskText: string;
    isTaskActive?: boolean;
    isTaskSynced?: boolean; // client validation
    isTaskDeleted?: boolean;
    isTaskModified?:boolean;
}
