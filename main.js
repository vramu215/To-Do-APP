// Abstract class for TodoItemFormatter
class TodoItemFormatter {
  formatTask(task) {
    return task.length > 14 ? task.slice(0, 14) + "..." : task;
  }

  formatDueDate(dueDate) {
    return dueDate || "No due date";
  }
  formatDueTime(dueTime) {
    return dueTime || "No due Time";
  }

  formatStatus(completed) {
    return completed ? "Completed" : "Pending";
  }
}

// Class responsible for managing Todo items
class TodoManager {
  constructor(todoItemFormatter, notificationManager) {
    this.todos = JSON.parse(localStorage.getItem("todos")) || [];
    this.todoItemFormatter = todoItemFormatter;
    this.notificationManager = notificationManager;
  }

  addTodo(task, dueDate, dueTime) {
    const newTodo = {
      id: this.getRandomId(),
      task: this.todoItemFormatter.formatTask(task),
      dueDate: this.todoItemFormatter.formatDueDate(dueDate),
      dueTime: this.todoItemFormatter.formatDueTime(dueTime),
      completed: false,
      status: "pending",
    };
    this.todos.push(newTodo);
    this.saveToLocalStorage();
    // const notificationManager = new NotificationManager([newTodo])
    // notificationManager.scheduleNotifications();
    return newTodo;
  }

  editTodo(id, updatedTask) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.task = updatedTask;
      this.saveToLocalStorage();
    }
    return todo;
  }

  deleteTodo(id) {
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.saveToLocalStorage();
  }

  toggleTodoStatus(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveToLocalStorage();
    }
  }

  clearAllTodos() {
    if (this.todos.length > 0) {
      this.todos = [];
      this.saveToLocalStorage();

      //also clearing notifications
      this.notificationManager.updateTodoList([]);
      this.notificationManager.clearNotifications();
    }
  }

  filterTodos(status) {
    switch (status) {
      case "all":
        return this.todos;
      case "pending":
        return this.todos.filter((todo) => !todo.completed);
      case "completed":
        return this.todos.filter((todo) => todo.completed);
      default:
        return [];
    }
  }

  getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  saveToLocalStorage() {
    localStorage.setItem("todos", JSON.stringify(this.todos));

    this.notificationManager.updateTodoList(this.todos);
  }
}

// Class responsible for managing the UI and handling events
class UIManager {
  constructor(todoManager, todoItemFormatter) {
    this.todoManager = todoManager;
    this.todoItemFormatter = todoItemFormatter;
    this.taskInput = document.querySelector("input");
    this.dateInput = document.querySelector(".schedule-date");
    this.timeInput = document.querySelector(".schedule-time");
    this.addBtn = document.querySelector(".add-task-button");
    this.todosListBody = document.querySelector(".todos-list-body");
    this.alertMessage = document.querySelector(".alert-message");
    this.deleteAllBtn = document.querySelector(".delete-all-btn");

    // this.todoList = []
    // Create an instance of NotificationManager with the ToDo list
    // this.notificationManager = new NotificationManager(todoList);

    this.addEventListeners();
    this.showAllTodos();
  }

  addEventListeners() {
    // Event listener for adding a new todo
    this.addBtn.addEventListener("click", () => {
      this.handleAddTodo();
    });

    // Event listener for pressing Enter key in the task input
    this.taskInput.addEventListener("keyup", (e) => {
      if (e.keyCode === 13 && this.taskInput.value.length > 0) {
        this.handleAddTodo();
      }
    });

    // Event listener for deleting all todos
    this.deleteAllBtn.addEventListener("click", () => {
      this.handleClearAllTodos();
    });

    // Event listeners for filter buttons
    const filterButtons = document.querySelectorAll(".todos-filter li");
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const status = button.textContent.toLowerCase();
        this.handleFilterTodos(status);
      });
    });
  }

  handleAddTodo() {
    const task = this.taskInput.value;
    const dueDate = this.dateInput.value;
    const dueTime = this.timeInput.value;
    if (task === "") {
      this.showAlertMessage("Please enter a task", "error");
    } else {
      const newTodo = this.todoManager.addTodo(task, dueDate, dueTime);
      this.showAllTodos();
      this.taskInput.value = "";
      this.dateInput.value = "";
      this.showAlertMessage("Task added successfully", "success");
    }
  }

  handleClearAllTodos() {
    this.todoManager.clearAllTodos();
    this.showAllTodos();
    this.showAlertMessage("All todos cleared successfully", "success");
  }

  showAllTodos() {
    const todos = this.todoManager.filterTodos("all");
    this.displayTodos(todos);
  }

  displayTodos(todos) {
    this.todosListBody.innerHTML = "";

    if (todos.length === 0) {
      this.todosListBody.innerHTML = `<tr><td colspan="5" class="text-center">No task found</td></tr>`;
      return;
    }

    todos.forEach((todo) => {
      this.todosListBody.innerHTML += `
          <tr class="todo-item" data-id="${todo.id}">
            <td>${this.todoItemFormatter.formatTask(todo.task)}</td>
            <td>${this.todoItemFormatter.formatDueDate(todo.dueDate)}</td>
            <td>${this.todoItemFormatter.formatDueTime(todo.dueTime)}</td>
            <td>${this.todoItemFormatter.formatStatus(todo.completed)}</td>
            <td>
              <button class="btn btn-warning btn-sm" onclick="uiManager.handleEditTodo('${
                todo.id
              }')">
                <i class="bx bx-edit-alt bx-bx-xs"></i>    
              </button>
              <button class="btn btn-success btn-sm" onclick="uiManager.handleToggleStatus('${
                todo.id
              }')">
                <i class="bx bx-check bx-xs"></i>
              </button>
              <button class="btn btn-error btn-sm" onclick="uiManager.handleDeleteTodo('${
                todo.id
              }')">
                <i class="bx bx-trash bx-xs"></i>
              </button>
            </td>
          </tr>
        `;
    });
  }

  handleEditTodo(id) {
    const todo = this.todoManager.todos.find((t) => t.id === id);
    if (todo) {
      this.taskInput.value = todo.task;
      this.todoManager.deleteTodo(id);

      const handleUpdate = () => {
        this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";
        this.showAlertMessage("Todo updated successfully", "success");
        this.showAllTodos();
        this.addBtn.removeEventListener("click", handleUpdate);
      };

      this.addBtn.innerHTML = "<i class='bx bx-check bx-sm'></i>";
      this.addBtn.addEventListener("click", handleUpdate);
    }
  }

  handleToggleStatus(id) {
    this.todoManager.toggleTodoStatus(id);
    this.showAllTodos();
  }

  handleDeleteTodo(id) {
    this.todoManager.deleteTodo(id);
    this.showAlertMessage("Todo deleted successfully", "success");
    this.showAllTodos();
  }

  handleFilterTodos(status) {
    const filteredTodos = this.todoManager.filterTodos(status);
    this.displayTodos(filteredTodos);
  }

  showAlertMessage(message, type) {
    const alertBox = `
  <div class="alert alert-${type} shadow-lg mb-5 w-full">
    <div>
      <span>${message}</span>
    </div>
  </div>
`;
    this.alertMessage.innerHTML = alertBox;
    this.alertMessage.classList.remove("hide");
    this.alertMessage.classList.add("show");
    setTimeout(() => {
      this.alertMessage.classList.remove("show");
      this.alertMessage.classList.add("hide");
    }, 3000);
  }
}

// Class responsible for managing the theme switcher
class ThemeSwitcher {
  constructor(themes, html) {
    this.themes = themes;
    this.html = html;
    this.init();
  }

  init() {
    const theme = this.getThemeFromLocalStorage();
    if (theme) {
      this.setTheme(theme);
    }

    this.addThemeEventListeners();
  }

  addThemeEventListeners() {
    this.themes.forEach((theme) => {
      theme.addEventListener("click", () => {
        const themeName = theme.getAttribute("theme");
        this.setTheme(themeName);
        this.saveThemeToLocalStorage(themeName);
      });
    });
  }

  setTheme(themeName) {
    this.html.setAttribute("data-theme", themeName);
  }

  saveThemeToLocalStorage(themeName) {
    localStorage.setItem("theme", themeName);
  }

  getThemeFromLocalStorage() {
    return localStorage.getItem("theme");
  }
}

// class NotificationManager {
//   constructor(todoList) {
//     this.todoList = todoList;
//     this.notifications = [];

//     // Restore notifications from localStorage if available
//     this.restoreNotifications();
//   }

//   // Method to show a single notification
//   showNotification(notificationObj) {
//     if (!("Notification" in window)) {
//       alert("This browser does not support desktop notification");
//     } else if (Notification.permission === "granted") {
//       const notification = new Notification(notificationObj.title, {
//         body: notificationObj.body
//       });

//       notification.onclick = function() {
//         console.log("Notification clicked");
//         // Add your custom logic here
//       };

//       setTimeout(notification.close.bind(notification), 5000);
//     } else if (Notification.permission !== 'denied') {
//       Notification.requestPermission().then(function(permission) {
//         if (permission === "granted") {
//           const notification = new Notification(notificationObj.title, {
//             body: notificationObj.body
//           });

//           notification.onclick = function() {
//             console.log("Notification clicked");
//             // Add your custom logic here
//           };

//           setTimeout(notification.close.bind(notification), 5000);
//         }
//       });
//     }
//   }

//   // Method to schedule notifications for all ToDo items
//   scheduleNotifications() {
//     this.todoList.forEach(todo => {
//       const dueDateTime = new Date(todo.dueDate + ' ' + todo.dueTime);
//       console.log("dueTime: ", dueDateTime);
//       const now = new Date();

//       // Check if dueDateTime is in the future
//       if (dueDateTime > now) {
//         const timeDiff = dueDateTime.getTime() - now.getTime();

//         const notificationObj = {
//           title: `Reminder: ${todo.task}`,
//           body: `Task due on ${todo.dueDate} at ${todo.dueTime}`
//         };

//         const notificationTimeout = setTimeout(() => {
//           this.showNotification(notificationObj);
//           // Remove notification from list after displaying
//           this.notifications = this.notifications.filter(n => n !== notificationTimeout);
//         }, timeDiff);

//         // Save the timeout reference for potential future use
//         this.notifications.push(notificationTimeout);
//       }
//     });

//     // Store notifications in localStorage for persistence
//     localStorage.setItem('notifications', JSON.stringify(this.notifications));
//   }

//   // Method to restore notifications from localStorage
//   restoreNotifications() {
//     const storedNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
//     storedNotifications.forEach(timeout => {
//       clearTimeout(timeout); // Clear any existing timeouts
//       this.notifications.push(timeout); // Restore timeout references
//     });

//     // Reschedule notifications on restore
//     this.scheduleNotifications();
//   }
// }

// Instantiating the classes

class NotificationManager {
  constructor(todoList) {
    this.todoList = todoList;
    this.notifications = [];
    this.notificationDuration = 10; //seconds

    // Restore notifications from localStorage if available
    this.restoreNotifications();
  }

  // Method to show a single notification
  showNotification(notificationObj) {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
      const notification = new Notification(notificationObj.title, {
        body: notificationObj.body,
      });

      notification.onclick = function () {
        console.log("Notification clicked");
        // Add your custom logic here
      };

      setTimeout(
        notification.close.bind(notification),
        this.notificationDuration * 1000
      );
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
          const notification = new Notification(notificationObj.title, {
            body: notificationObj.body,
          });

          notification.onclick = function () {
            console.log("Notification clicked");
            // Add your custom logic here
          };

          setTimeout(
            notification.close.bind(notification),
            this.notificationDuration * 1000
          );
        }
      });
    }
  }

  // Method to schedule notifications for all ToDo items
  scheduleNotifications() {
    // Clear existing notifications
    this.clearNotifications();

    // Schedule new notifications
    this.todoList.forEach((todo) => {
      if (!todo.completed) {
        const now = new Date();
        const dueDateTime = new Date(todo.dueDate + " " + todo.dueTime);

        // Check if dueDateTime is in the future
        if (dueDateTime > now) {
          const timeDiff = dueDateTime.getTime() - now.getTime();

          const notificationObj = {
            title: `Reminder: ${todo.task}`,
            body: `Task due on ${todo.dueDate} at ${todo.dueTime}`,
          };

          const notificationTimeout = setTimeout(() => {
            this.showNotification(notificationObj);
            // Remove notification from list after displaying
            this.notifications = this.notifications.filter(
              (n) => n !== notificationTimeout
            );
            localStorage.setItem(
              "notifications",
              JSON.stringify(this.notifications)
            );
          }, timeDiff);

          // Save the timeout reference for potential future use
          this.notifications.push(notificationTimeout);
        }
      }
    });

    // Store notifications in localStorage for persistence
    localStorage.setItem("notifications", JSON.stringify(this.notifications));
  }

  // Method to clear all scheduled notifications
  clearNotifications() {
    this.notifications.forEach((timeout) => clearTimeout(timeout));
    this.notifications = [];
    localStorage.removeItem("notifications"); // Clear from localStorage
  }

  // Method to restore notifications from localStorage
  restoreNotifications() {
    const storedNotifications =
      JSON.parse(localStorage.getItem("notifications")) || [];
    storedNotifications.forEach((timeout) => {
      clearTimeout(timeout); // Clear any existing timeouts
      this.notifications.push(timeout); // Restore timeout references
    });

    // Reschedule notifications on restore
    this.scheduleNotifications();
  }

  // Method to update ToDo list and reschedule notifications
  updateTodoList(newTodoList) {
    this.todoList = newTodoList;
    this.scheduleNotifications();
  }
}

const todoItemFormatter = new TodoItemFormatter();
const notificationManager = new NotificationManager([]);
const todoManager = new TodoManager(todoItemFormatter, notificationManager);
const uiManager = new UIManager(todoManager, todoItemFormatter);
const themes = document.querySelectorAll(".theme-item");
const html = document.querySelector("html");
const themeSwitcher = new ThemeSwitcher(themes, html);
