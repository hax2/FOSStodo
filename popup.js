document.addEventListener('DOMContentLoaded', function() {
  const todoList = document.getElementById('todo-list');
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let selectedTaskIndex = 0;
  let selectedSubtaskIndex = -1; // -1 means no subtask is selected
  let isCreatingNewTask = false;
  let isCreatingNewSubtask = false;

  const renderInstructions = () => {
    todoList.innerHTML = '';
    const instructions = document.createElement('div');
    instructions.id = 'instructions';
    instructions.innerHTML = `
      <p>Instructions:</p>
      <ul>
        <li>Press <strong>I</strong> to show these instructions</li>
        <li>Press <strong>Q</strong> to create a new task</li>
        <li>Use <strong>W</strong> and <strong>S</strong> to scroll between tasks</li>
        <li>Press <strong>R</strong> to rewrite a task</li>
        <li>Press <strong>Spacebar</strong> to mark a task as complete</li>
        <li>Press <strong>E</strong> to add a subtask</li>
        <li>Press <strong>X</strong> to delete a task or subtask</li>
        <li>Press <strong>Ctrl+W</strong> to close and <strong>Ctrl+Q</strong> to reopen</li>
        <li>Press <strong>D</strong> to unfold/fold subtasks</li>
        <li>Use <strong>A</strong> and <strong>D</strong> to navigate through subtasks</li>
      </ul>
    `;
    todoList.appendChild(instructions);
  };

  const renderTasks = () => {
    todoList.innerHTML = '';
    if (tasks.length === 0 && !isCreatingNewTask) {
      renderInstructions();
      return;
    }

    const sortedTasks = tasks.map((task, index) => ({ ...task, originalIndex: index })).sort((a, b) => a.completed - b.completed);
    sortedTasks.forEach((task, index) => {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task' + (task.completed ? ' completed' : '');
      taskDiv.dataset.index = task.originalIndex;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => {
        tasks[task.originalIndex].completed = checkbox.checked;
        // Mark subtasks as completed if the main task is marked as completed
        tasks[task.originalIndex].subtasks.forEach(subtask => {
          subtask.completed = checkbox.checked;
        });
        saveTasks();
        renderTasks();
      });

      taskDiv.appendChild(checkbox);
      const taskText = document.createElement('span');
      taskText.textContent = task.text;
      taskDiv.appendChild(taskText);

      if (index === selectedTaskIndex && selectedSubtaskIndex === -1) {
        taskDiv.style.border = '2px solid #000';
      }
      todoList.appendChild(taskDiv);

      if (task.subtasks && task.subtasks.length > 0 && !task.collapsed) {
        task.subtasks.forEach((subtask, subIndex) => {
          const subtaskDiv = document.createElement('div');
          subtaskDiv.className = 'subtask' + (subtask.completed ? ' completed' : '');
          subtaskDiv.dataset.index = subIndex;

          const subCheckbox = document.createElement('input');
          subCheckbox.type = 'checkbox';
          subCheckbox.className = 'checkbox';
          subCheckbox.checked = subtask.completed;
          subCheckbox.addEventListener('change', () => {
            tasks[task.originalIndex].subtasks[subIndex].completed = subCheckbox.checked;
            saveTasks();
            renderTasks();
          });

          subtaskDiv.appendChild(subCheckbox);
          const subtaskText = document.createElement('span');
          subtaskText.textContent = subtask.text;
          subtaskDiv.appendChild(subtaskText);

          if (index === selectedTaskIndex && subIndex === selectedSubtaskIndex) {
            subtaskDiv.style.border = '2px solid #000';
          }
          todoList.appendChild(subtaskDiv);
        });
      }
    });

    if (isCreatingNewTask) {
      const newTaskDiv = document.createElement('div');
      newTaskDiv.className = 'task';
      const newTaskInput = document.createElement('input');
      newTaskInput.type = 'text';
      newTaskInput.className = 'task-input';
      newTaskInput.placeholder = 'Enter new task';
      newTaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          addTask(newTaskInput.value.trim());
          isCreatingNewTask = false;
          renderTasks(); // Re-render tasks to remove the input box
          document.removeEventListener('keydown', handleShortcuts);
          document.addEventListener('keydown', handleShortcuts);
        }
      });
      newTaskDiv.appendChild(newTaskInput);
      todoList.appendChild(newTaskDiv);
      newTaskInput.focus();
    }

    if (isCreatingNewSubtask) {
      const newSubtaskDiv = document.createElement('div');
      newSubtaskDiv.className = 'subtask';
      const newSubtaskInput = document.createElement('input');
      newSubtaskInput.type = 'text';
      newSubtaskInput.className = 'task-input';
      newSubtaskInput.placeholder = 'Enter new subtask';
      newSubtaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          addSubtask(newSubtaskInput.value.trim());
          isCreatingNewSubtask = false;
          renderTasks(); // Re-render tasks to remove the input box
          document.removeEventListener('keydown', handleShortcuts);
          document.addEventListener('keydown', handleShortcuts);
        }
      });
      newSubtaskDiv.appendChild(newSubtaskInput);
      todoList.appendChild(newSubtaskDiv);
      newSubtaskInput.focus();
    }
  };

  const saveTasks = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  };

  const addTask = (text) => {
    if (text !== '') {
      tasks.push({ text, completed: false, subtasks: [], collapsed: false }); // subtasks unfolded by default
      saveTasks();
      selectedTaskIndex = tasks.length - 1; // Highlight the first task
      renderTasks();
    }
  };

  const addSubtask = (text) => {
    if (text !== '') {
      tasks[selectedTaskIndex].subtasks.push({ text, completed: false });
      saveTasks();
      selectedSubtaskIndex = tasks[selectedTaskIndex].subtasks.length - 1;
      renderTasks();
    }
  };

  const deleteTask = () => {
    if (tasks.length > 0) {
      if (selectedSubtaskIndex === -1) {
        tasks.splice(tasks.map((task, index) => ({ ...task, originalIndex: index })).sort((a, b) => a.completed - b.completed)[selectedTaskIndex].originalIndex, 1);
        selectedTaskIndex = Math.min(selectedTaskIndex, tasks.length - 1);
      } else {
        tasks[selectedTaskIndex].subtasks.splice(selectedSubtaskIndex, 1);
        selectedSubtaskIndex = Math.min(selectedSubtaskIndex, tasks[selectedTaskIndex].subtasks.length - 1);
      }
      saveTasks();
      renderTasks();
    }
  };

  const rewriteTask = (text) => {
    if (tasks.length > 0) {
      if (selectedSubtaskIndex === -1) {
        tasks[selectedTaskIndex].text = text;
      } else {
        tasks[selectedTaskIndex].subtasks[selectedSubtaskIndex].text = text;
      }
      saveTasks();
      renderTasks();
    }
  };

  const toggleTaskComplete = () => {
    if (tasks.length > 0) {
      if (selectedSubtaskIndex === -1) {
        const sortedTasks = tasks.map((task, index) => ({ ...task, originalIndex: index })).sort((a, b) => a.completed - b.completed);
        const mainTask = tasks[sortedTasks[selectedTaskIndex].originalIndex];
        mainTask.completed = !mainTask.completed;
        mainTask.subtasks.forEach(subtask => {
          subtask.completed = mainTask.completed;
        });
      } else {
        tasks[selectedTaskIndex].subtasks[selectedSubtaskIndex].completed = !tasks[selectedTaskIndex].subtasks[selectedSubtaskIndex].completed;
      }
      saveTasks();
      renderTasks();
    }
  };

  const handleShortcuts = (e) => {
    if (isCreatingNewTask || isCreatingNewSubtask) return;
    switch (e.key) {
      case 'i':
        renderInstructions();
        break;
      case 'q':
        if (!isCreatingNewTask) {
          isCreatingNewTask = true;
          renderTasks();
        }
        e.preventDefault();  // Prevent the 'q' character from being entered into the input box
        break;
      case 'w':
        if (selectedSubtaskIndex === -1) {
          selectedTaskIndex = (selectedTaskIndex > 0) ? selectedTaskIndex - 1 : tasks.length - 1;
          if (tasks[selectedTaskIndex].subtasks.length > 0 && !tasks[selectedTaskIndex].collapsed) {
            selectedSubtaskIndex = tasks[selectedTaskIndex].subtasks.length - 1;
          }
        } else {
          selectedSubtaskIndex = (selectedSubtaskIndex > 0) ? selectedSubtaskIndex - 1 : -1;
        }
        renderTasks();
        break;
      case 's':
        if (selectedSubtaskIndex === -1) {
          if (tasks[selectedTaskIndex].subtasks.length > 0 && !tasks[selectedTaskIndex].collapsed) {
            selectedSubtaskIndex = 0;
          } else {
            selectedTaskIndex = (selectedTaskIndex < tasks.length - 1) ? selectedTaskIndex + 1 : 0;
          }
        } else {
          if (selectedSubtaskIndex < tasks[selectedTaskIndex].subtasks.length - 1) {
            selectedSubtaskIndex++;
          } else {
            selectedSubtaskIndex = -1;
            selectedTaskIndex = (selectedTaskIndex < tasks.length - 1) ? selectedTaskIndex + 1 : 0;
          }
        }
        renderTasks();
        break;
      case 'r':
        if (selectedSubtaskIndex === -1) {
          const taskToEdit = tasks.map((task, index) => ({ ...task, originalIndex: index })).sort((a, b) => a.completed - b.completed)[selectedTaskIndex];
          const editedText = prompt('Edit task:', taskToEdit.text);
          if (editedText !== null && editedText.trim() !== "") {
            tasks[taskToEdit.originalIndex].text = editedText.trim();
            saveTasks();
            renderTasks();
          }
        } else {
          const subtaskToEdit = tasks[selectedTaskIndex].subtasks[selectedSubtaskIndex];
          const editedSubtaskText = prompt('Edit subtask:', subtaskToEdit.text);
          if (editedSubtaskText !== null && editedSubtaskText.trim() !== "") {
            tasks[selectedTaskIndex].subtasks[selectedSubtaskIndex].text = editedSubtaskText.trim();
            saveTasks();
            renderTasks();
          }
        }
        break;
      case 'e':
        if (selectedTaskIndex !== -1 && selectedSubtaskIndex === -1 && !isCreatingNewSubtask) {
          e.preventDefault();  // Prevent the 'e' character from being entered into the input box
          isCreatingNewSubtask = true;
          renderTasks();
        }
        break;
      case 'x':
        deleteTask();
        break;
      case ' ':
        toggleTaskComplete();
        break;
      case 'a':
        if (selectedSubtaskIndex !== -1) {
          selectedSubtaskIndex = -1;
        } else if (tasks[selectedTaskIndex].subtasks.length > 0 && !tasks[selectedTaskIndex].collapsed) {
          tasks[selectedTaskIndex].collapsed = true;
          selectedSubtaskIndex = -1;
        }
        renderTasks();
        break;
      case 'd':
        if (selectedSubtaskIndex === -1) {
          tasks[selectedTaskIndex].collapsed = !tasks[selectedTaskIndex].collapsed;
          if (!tasks[selectedTaskIndex].collapsed && tasks[selectedTaskIndex].subtasks.length > 0) {
            selectedSubtaskIndex = 0;
          }
        }
        renderTasks();
        break;
      default:
        break;
    }
  };

  document.addEventListener('keydown', handleShortcuts);

  renderTasks();
});
