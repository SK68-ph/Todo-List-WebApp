import { TaskService } from '../service/task.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Task, TASKS } from '../Task';
import { Router } from '@angular/router';
import { LoadingService } from '../service/loading.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {

  loading$ = this.loader.loading$;
  constructor(private taskService: TaskService,public loader: LoadingService) {}

  ngOnInit(): void {
    this.getTasks();
  }

  // @ts-ignore
  @ViewChild('todotext', { static: true }) todotextElement: ElementRef;
  TASKS: Task[] = [];
  isSuccessful: boolean = true;

  getTasks() {
    this.loader.show();
    this.taskService.getTasks().subscribe(
      (task) => {
        task.forEach((element) => {
          this.TASKS.push({
            Id: element.Id,
            TaskText: element.TaskText,
            isTaskActive: element.isTaskActive,
          });
        });
        this.isSuccessful = true;
      },
      (error) => {
        if (error.status == 401) {
          this.taskService.logout();
        }else{
          this.displayError();
          this.loader.hide();
        }
      },
      () => this.loader.hide()
    );
  }

  getTaskCount() {
    let taskCount = { activeTaskCount: 0, completedTaskCount: 0 };
    this.TASKS.forEach((element) => {
      if (element.isTaskActive === false) taskCount.completedTaskCount++;
      else taskCount.activeTaskCount++;
    });

    return taskCount;
  }

  isStringValid(s:string) {
    return /^[A-Za-z-Z0-9-\s]*$/.test(s);
  }

  btnAddTaskActive: boolean = false;
  onInputKeyUp() {
    this.todotextElement.nativeElement.value.length > 2 && this.isStringValid(this.todotextElement.nativeElement.value)
      ? (this.btnAddTaskActive = true)
      : (this.btnAddTaskActive = false);
  }

  displayError() {
    this.isSuccessful = false;
  }

  onAddTask() {
    this.loader.show()
    let newTask: Task = {
      TaskText: this.todotextElement.nativeElement.value,
      isTaskActive: true,
    };
    this.taskService.addTask(newTask).subscribe(
      (data) => {
        newTask.Id = data;
        this.TASKS.push(newTask);
        this.isSuccessful = true;
      },
      (error) => {
        if (error.status != 204) {
          this.isSuccessful = false;
          this.displayError();
          this.loader.hide();
        }
      },
      () => this.loader.hide()
    );

    this.todotextElement.nativeElement.value = '';
    this.btnAddTaskActive = false
  }

  onRemoveTask(id: any) {
    this.TASKS = this.TASKS.filter((item) => item.Id !== id);
    this.taskService.deleteTask(id).subscribe(
      (data) => {
        this.isSuccessful = true;
      },
      (error) => {
        if (error.status != 204) {
          this.isSuccessful = false;
          this.displayError();
        }
      }
    );
  }

  onCompleteTask(id: any) {
    this.TASKS.forEach((element) => {
      if (element.Id === id) {
        element.isTaskActive = false;
        this.taskService.updateTask(element).subscribe(
          (data) => {this.isSuccessful = true;},
          (error) => {
            if (error.status != 204) {
              this.isSuccessful = false;
              this.displayError();
            }
          }
        );
      }
    });
  }

  clearAllTask() {
    this.loader.show();
    this.TASKS = [];
    this.taskService.removeAllTask().subscribe(
      (data) => {this.isSuccessful = true;},
      (error) => {
        if (error.status != 204) {
          this.isSuccessful = false;
          this.displayError();
          this.loader.hide();
        }
      },
      () => this.loader.hide()
    );
  }

  clearCompleteTask() {
    this.loader.show()
    for (let index = 0; index < this.TASKS.length; index++) {
      if (this.TASKS[index].isTaskActive === false) {
        this.taskService.deleteTask(this.TASKS[index].Id).subscribe(
          (data) => {this.isSuccessful = true;},
          (error) => {
            if (error.status != 204) {
              this.isSuccessful = false;
              this.displayError();
              this.loader.hide();
            }
          },
          () => this.loader.hide()
        );
        this.TASKS.splice(index, 1);
        index--;
      }
    }
  }
  onLogout() {
    this.loader.hide();
    this.taskService.logout();
  }
}
