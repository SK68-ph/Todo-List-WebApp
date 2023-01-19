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
import { delay, retry, Subscription } from 'rxjs';
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

  prepareSync() {
    this.loader.show();
    this.taskService
      .getServerStatus()
      .pipe(
        retry(3), // you retry 3 times
        delay(2000) // each retry will start after 1 second,
      )
      .subscribe(
        (response) => {
          if (response == 'ok') {
            this.syncLocalTasks();
          }
          this.loader.hide();
        },
        () => {
          this.displayError();
        },
        () => this.loader.hide()
      );
  }

  getTasksDb() {
    this.loader.show();
    this.taskService
      .getTasks()
      .pipe(
        retry(3), // you retry 3 times
        delay(1000) // each retry will start after 1 second,
      )
      .subscribe(
        (task) => {
          task.forEach((element) => {
            this.TASKS.push({
              Id: element.Id,
              TaskText: element.TaskText,
              isTaskActive: element.isTaskActive,
              isTaskModified: false,
              isTaskDeleted: false,
              isTaskSynced: true
            });
          });
          this.isSuccessful = true;
          this.setTasksLocal();
        },
        (error) => {
          if (error.status == 401) {
            this.loader.hide();
            this.onLogout();
          } else {
            this.displayError();
            this.loader.hide();
          }
        },
        () => this.loader.hide()
      );
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

  AddTaskDb(index: number) {
    this.loader.show();
    this.taskService
      .addTask(this.TASKS[index])
      .pipe(
        retry(3), // you retry 3 times
        delay(1000) // each retry will start after 1 second,
      )
      .subscribe(
        (data) => {
          this.isSuccessful = true;
          this.TASKS[index].Id = Number(data);
          this.TASKS[index].isTaskSynced = true;
          this.setTasksLocal();
        },
        (error) => {
          if (error.status != 204) {
            this.displayError();
            this.loader.hide();
          }
        },
        () => this.loader.hide()
      );
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

  removeTaskDb(index: any) {
    this.loader.show();
    const id = this.TASKS[index].Id;
    this.taskService
      .deleteTask(id)
      .pipe(
        retry(3), // you retry 3 times
        delay(1000) // each retry will start after 1 second,
      )
      .subscribe(
        () => {
          this.TASKS.splice(index,1);
          this.isSuccessful = true;
          this.loader.hide();
          this.setTasksLocal();
        },
        (error) => {
          if (error.status != 204) {
            this.displayError();
            this.loader.hide();
          }
        }
      );
  }

  onRemoveTask(index: any) {
    console.log(index)
    console.log(this.TASKS[index])
    console.log(this.isOnline)
    if (this.isOnline == 1) {
      this.removeTaskDb(index);
    } 
    if (this.isOnline == 0) {
      if (this.TASKS[index].isTaskSynced == true || this.TASKS[index].isTaskModified == true && this.TASKS[index].Id != 0) {
        this.TASKS[index].isTaskSynced = false;
        this.TASKS[index].isTaskDeleted = true;
        console.log('removing task from db');
      } 
      else if (this.TASKS[index].isTaskSynced == false && this.TASKS[index].isTaskModified == true && this.TASKS[index].Id == 0){
        this.TASKS.splice(index, 1);
        console.log('removing local task');
      }
    }
    this.setTasksLocal();
  }

  updateTaskDb(index: any) {
    this.loader.show();
    this.TASKS[index].isTaskActive = false;
    this.taskService
      .updateTask(this.TASKS[index])
      .pipe(
        retry(3), // you retry 3 times
        delay(1000) // each retry will start after 1 second,
      )
      .subscribe(
        (data) => {
          this.TASKS[index].isTaskSynced = true;
          this.isSuccessful = true;
          this.loader.hide();
          this.setTasksLocal();
        },
        (error) => {
          if (error.status != 204) {
            this.displayError();
            this.loader.hide();
          }
        }
      );
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

  clearAllTaskDb() {
    this.taskService
      .removeAllTask()
      .pipe(
        retry(3), // you retry 3 times
        delay(1000) // each retry will start after 1 second,
      )
      .subscribe(
        (data) => {
          this.isSuccessful = true;
        },
        (error) => {
          if (error.status != 204) {
            this.displayError();
          }
        }
      );
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
