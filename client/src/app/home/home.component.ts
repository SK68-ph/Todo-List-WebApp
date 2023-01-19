import { TaskService } from '../service/task.service';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { Task } from '../Task';
import { LoadingService } from '../service/loading.service';
import { Subscription } from 'rxjs';
import { OnlineStatusService, OnlineStatusType } from 'ngx-online-status';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  loading$ = this.loader.loading$;
  isOnline: OnlineStatusType = this.onlineStatusService.getStatus(); // get initial status
  networkStatus$: Subscription = Subscription.EMPTY;

  constructor(
    private taskService: TaskService,
    private onlineStatusService: OnlineStatusService,
    public loader: LoadingService
  ) {
    this.onlineStatusService.status.subscribe((status: OnlineStatusType) => {
      this.isOnline = status;
      if (status == 1) {
        this.prepareSync();
      }
    });
  }

  ngOnInit(): void {
    if (!this.taskService.isLoggedIn()) {
      this.onLogout();
    }
    if (this.isOnline == 1) {
      this.prepareSync();
    }
    this.getTasks();
  }

  ngOnDestroy(): void {
    this.networkStatus$.unsubscribe();
  }

  public TASKS: Task[] = [];
  isSuccessful: boolean = true;

  syncLocalTasks() {
    console.log('Syncing');
    for (let index = 0; index < this.TASKS.length; index++) {
      const element = this.TASKS[index];
      if (element.isTaskSynced == false) {
        if (element.Id == 0) {
          console.log('Adding from db');
          this.AddTaskDb(index);
          continue;
        }
        if (element.isTaskDeleted == true) {
          console.log('Deleting from db');
          this.removeTaskDb(index);
          continue;
        }
        if (element.isTaskModified == true) {
          console.log('Updating to db');
          this.updateTaskDb(index);
          continue;
        }
      }
    }
  }

  async prepareSync() {
    this.loader.show();
    await this.taskService
      .getServerStatus()
      .then((response) => {
        if (response == 'ok') {
          this.syncLocalTasks();
        }
        this.loader.hide();
      })
      .catch((err) => {
        this.displayError();
        this.loader.hide();
      })
      .finally(() => {
        this.loader.hide();
      });
  }

  async getTasksDb() {
    this.loader.show();
    await this.taskService
      .getTasks()
      .then((task: Task[]) => {
        this.TASKS = [];
        task.forEach((element) => {
          this.TASKS.push({
            Id: element.Id,
            TaskText: element.TaskText,
            isTaskActive: element.isTaskActive,
            isTaskModified: false,
            isTaskDeleted: false,
            isTaskSynced: true,
          });
        });
        this.isSuccessful = true;
        this.setTasksLocal();
      })
      .catch((err) => {
        if (err.status == 401) {
          this.loader.hide();
          this.onLogout();
        } else {
          this.displayError();
          this.loader.hide();
        }
      })
      .finally(() => {
        this.loader.hide();
      });
  }

  getTasksLocal() {
    this.TASKS = JSON.parse(localStorage.getItem('tasks') || '[]');
  }

  setTasksLocal() {
    localStorage.setItem('tasks', JSON.stringify(this.TASKS));
  }

  getTasks() {
    if (this.isOnline == 1) {
      this.getTasksDb();
    } else {
      this.getTasksLocal();
    }
  }

  getTaskCount() {
    let taskCount = { activeTaskCount: 0, completedTaskCount: 0 };
    this.TASKS.forEach((element) => {
      if (element.isTaskActive === false) taskCount.completedTaskCount++;
      else taskCount.activeTaskCount++;
    });

    return taskCount;
  }

  isStringValid(s: string) {
    return /^[A-Za-z-Z0-9-\s]*$/.test(s);
  }

  // @ts-ignore
  @ViewChild('todotext', { static: true }) todotextElement: ElementRef;
  btnAddTaskActive: boolean = false;
  onInputKeyUp() {
    this.todotextElement.nativeElement.value.length > 2 &&
    this.isStringValid(this.todotextElement.nativeElement.value)
      ? (this.btnAddTaskActive = true)
      : (this.btnAddTaskActive = false);
  }

  displayError() {
    this.isSuccessful = false;
  }

  async AddTaskDb(index: number) {
    this.loader.show();
    await this.taskService
      .addTask(this.TASKS[index])
      .then((data) => {
        this.isSuccessful = true;
        this.TASKS[index].Id = Number(data);
        this.TASKS[index].isTaskSynced = true;
        this.setTasksLocal();
        this.loader.hide();
      })
      .catch((err) => {
        this.displayError();
        this.loader.hide();
      })
  }

  onAddTask() {
    let newTask: Task = {
      Id: 0,
      TaskText: this.todotextElement.nativeElement.value,
      isTaskActive: true,
      isTaskDeleted: false,
      isTaskModified: false,
      isTaskSynced: false,
    };
    this.TASKS.push(newTask);

    if (this.isOnline == 1) {
      this.AddTaskDb(this.TASKS.length - 1);
    }
    this.setTasksLocal();
    this.todotextElement.nativeElement.value = '';
    this.btnAddTaskActive = false;
  }

  async removeTaskDb(index: any) {
    const id = this.TASKS[index].Id;
    await this.taskService
      .deleteTask(id)
      .then(() => {
        this.TASKS.splice(index,1);
        this.isSuccessful = true;
        this.loader.hide();
        this.setTasksLocal();
      })
      .catch((err) => {
        this.displayError();
      })
  }

  onRemoveTask(index: any) {
    console.log(index);
    console.log(this.TASKS[index]);
    console.log(this.isOnline);
    if (this.isOnline == 1) {
      this.removeTaskDb(index);
    }
    if (this.isOnline == 0) {
      if (
        this.TASKS[index].isTaskSynced == true ||
        (this.TASKS[index].isTaskModified == true && this.TASKS[index].Id != 0)
      ) {
        this.TASKS[index].isTaskSynced = false;
        this.TASKS[index].isTaskDeleted = true;
        console.log('removing task from db');
      } else if (
        this.TASKS[index].isTaskSynced == false &&
        this.TASKS[index].isTaskModified == true &&
        this.TASKS[index].Id == 0
      ) {
        this.TASKS.splice(index, 1);
        console.log('removing local task');
      }
    }
    this.setTasksLocal();
  }

  async updateTaskDb(index: any) {
    this.TASKS[index].isTaskActive = false;
    await this.taskService
      .updateTask(this.TASKS[index])
      .then(() => {
        this.TASKS[index].isTaskSynced = true;
        this.isSuccessful = true;
        this.loader.hide();
        this.setTasksLocal();
      })
      .catch(() => {
        this.displayError();
      })
  }

  onCompleteTask(index: any) {
    if (this.isOnline == 1) {
      this.updateTaskDb(index);
    } else {
      this.TASKS[index].isTaskActive = false;
      this.TASKS[index].isTaskSynced = false;
      this.TASKS[index].isTaskModified = true;
    }

    this.setTasksLocal();
  }

  async clearAllTaskDb() {
    await this.taskService
      .removeAllTask()
      .then(() => {
        this.isSuccessful = true;
      })
      .catch(() => {
        this.displayError();
        this.loader.hide();
      })
      .finally(() => {
        this.loader.hide();
      });
  }

  clearAllTask() {
    if (this.isOnline == 1) {
      this.TASKS = [];
      this.clearAllTaskDb();
    } else {
      for (let index = 0; index < this.TASKS.length; index++) {
        const element = this.TASKS[index];
        if (element.isTaskSynced == true) {
          this.TASKS[index].isTaskDeleted = true;
        } else {
          this.TASKS.splice(index, 1);
          index--;
        }
      }
    }

    this.setTasksLocal();
  }

  onLogout() {
    this.taskService.logout();
  }
}
