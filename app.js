const STORAGE_KEY = "today-tasks";

const dateLine = document.querySelector("#date-line");
const remain = document.querySelector("#remain");
const empty = document.querySelector("#empty");
const list = document.querySelector("#list");
const form = document.querySelector("#add-form");
const input = document.querySelector("#task-input");
const addButton = document.querySelector("#add-button");
const hint = document.querySelector("#hint");
const clearDone = document.querySelector("#clear-done");
const filterButtons = document.querySelectorAll("[data-filter]");

let tasks = loadTasks();
let filter = "all";

const today = new Date();
const monthDay = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
}).format(today);
const weekday = new Intl.DateTimeFormat("zh-CN", {
  weekday: "long",
}).format(today);
dateLine.textContent = `${monthDay}，${weekday}`;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTask);
  } catch {
    return [];
  }
}

function isTask(value) {
  return Boolean(
    value &&
      typeof value.id === "string" &&
      typeof value.text === "string" &&
      typeof value.done === "boolean"
  );
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function visibleTasks() {
  if (filter === "active") return tasks.filter((task) => !task.done);
  if (filter === "done") return tasks.filter((task) => task.done);
  return tasks;
}

function remainText() {
  const openCount = tasks.filter((task) => !task.done).length;
  if (openCount === 0) return "今天的都做完了";
  return `还有 ${openCount} 件没做`;
}

function setFilter(nextFilter) {
  filter = nextFilter;
  filterButtons.forEach((item) => {
    item.setAttribute("aria-pressed", String(item.dataset.filter === filter));
  });
}

function emptyText() {
  if (tasks.length === 0) return "还没有要做的事。写在下面这一行。";
  if (filter === "active") return "还没做的都做完了。";
  if (filter === "done") return "还没有做完的事。";
  return "";
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = task.done ? "task is-done" : "task";
  item.dataset.id = task.id;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "check";
  toggle.dataset.action = "toggle";
  toggle.setAttribute("aria-pressed", String(task.done));
  toggle.setAttribute(
    "aria-label",
    task.done ? `标成还没做：${task.text}` : `标成做完：${task.text}`
  );

  const text = document.createElement("p");
  text.className = "task-text";
  text.textContent = task.text;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete";
  remove.dataset.action = "delete";
  remove.textContent = "删掉";
  remove.setAttribute("aria-label", `删掉：${task.text}`);

  item.append(toggle, text, remove);
  return item;
}

function render(focusSelector) {
  const shown = visibleTasks();
  const fragment = document.createDocumentFragment();
  shown.forEach((task) => fragment.append(createTaskElement(task)));
  list.replaceChildren(fragment);

  remain.hidden = tasks.length === 0;
  remain.textContent = tasks.length === 0 ? "" : remainText();

  const message = shown.length === 0 ? emptyText() : "";
  empty.hidden = message.length === 0;
  empty.textContent = message;

  const doneCount = tasks.filter((task) => task.done).length;
  clearDone.hidden = doneCount === 0;

  if (focusSelector) {
    const target = document.querySelector(focusSelector);
    if (target) target.focus();
  }
}

function showHint(message) {
  hint.hidden = message.length === 0;
  hint.textContent = message;
}

function syncAddButton() {
  addButton.disabled = input.value.trim().length === 0;
}

function addTask(text) {
  tasks.push({
    id: createId(),
    text,
    done: false,
  });
  saveTasks();
  if (filter === "done") setFilter("all");
  render();
}

function toggleTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTasks();
  const selector = `[data-id="${CSS.escape(id)}"] [data-action="toggle"]`;
  render(selector);
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
  input.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    showHint("先写下一件要做的事。");
    input.focus();
    return;
  }
  showHint("");
  addTask(text);
  input.value = "";
  syncAddButton();
  input.focus();
});

input.addEventListener("input", () => {
  showHint("");
  syncAddButton();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const item = button.closest(".task");
  if (!item) return;
  const id = item.dataset.id;
  if (button.dataset.action === "toggle") toggleTask(id);
  if (button.dataset.action === "delete") deleteTask(id);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setFilter(button.dataset.filter);
    render();
  });
});

clearDone.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  render();
});

render();
syncAddButton();
