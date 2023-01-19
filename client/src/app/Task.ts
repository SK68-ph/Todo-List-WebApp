
export interface Task {
    Id: number;
    TaskText: string;
    isTaskActive?: boolean;
    isTaskSynced?: boolean; // client validation
    isTaskDeleted?: boolean;
    isTaskModified?:boolean;
}
export async function retryOperation<T>(
    operation: () => (Promise<T> | T), delay: number, times: number): Promise<T> {
      try {
        return await operation();
      } catch (ex) {
        if (times > 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return retryOperation(operation, delay, times - 1);
        } else {
          throw ex;
        }
      }
  }