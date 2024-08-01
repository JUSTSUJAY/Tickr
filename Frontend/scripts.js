function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
    
    let greeting;
    if (hours < 12) {
        greeting = "Good morning, Sujay!";
    } else if (hours < 18) {
        greeting = "Good afternoon, Sujay!";
    } else {
        greeting = "Good evening, Sujay!";
    }
    document.getElementById('greeting').textContent = greeting;
}

setInterval(updateClock, 1000);
updateClock();

// Quick Links Feature
function setupQuickLinks() {
    const addButton = document.getElementById('add-quick-link');
    const quickLinksList = document.getElementById('quick-links-list');
    let isRemoveMode = false;

    addButton.addEventListener('click', function() {
        const url = prompt("Enter the URL for the quick link:");
        if (url && url.trim()) {
            const displayName = prompt("Enter a display name for this link:");
            if (displayName && displayName.trim()) {
                addQuickLinkItem(url.trim(), displayName.trim());
            }
        }
    });

    function addQuickLinkItem(url, displayName) {
        const item = document.createElement('a');
        item.href = url;
        item.className = 'widget-link';
        item.textContent = displayName;
        item.target = '_blank';
        quickLinksList.appendChild(item);
        saveQuickLinkItems();
    }

    function saveQuickLinkItems() {
        const items = Array.from(quickLinksList.children).map(item => ({
            url: item.href,
            displayName: item.textContent
        }));
        localStorage.setItem('quickLinkItems', JSON.stringify(items));
    }

    function loadQuickLinkItems() {
        const items = JSON.parse(localStorage.getItem('quickLinkItems')) || [];
        items.forEach(item => addQuickLinkItem(item.url, item.displayName));
    }

    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'q') {
            isRemoveMode = true;
            Array.from(quickLinksList.children).forEach(item => {
                item.classList.add('remove-mode');
                item.addEventListener('click', removeQuickLink);
            });
        } else if (e.key === 'Escape' && isRemoveMode) {
            exitRemoveMode();
        }
    });

    function removeQuickLink(e) {
        e.preventDefault();
        if (isRemoveMode) {
            e.target.remove();
            saveQuickLinkItems();
        }
    }

    function exitRemoveMode() {
        isRemoveMode = false;
        Array.from(quickLinksList.children).forEach(item => {
            item.classList.remove('remove-mode');
            item.removeEventListener('click', removeQuickLink);
        });
    }

    loadQuickLinkItems();
}

function addTodo() {
    const input = document.getElementById('todo-input');
    const priority = document.getElementById('priority').value;
    const task = input.value.trim();
    if (task) {
        const li = createTodoItem(task, priority);
        insertSorted(li);
        input.value = '';
        saveTasks();
    }
}

function createTodoItem(task, priority) {
    const li = document.createElement('li');
    li.classList.add(priority);
    li.innerHTML = `
        <span class="priority ${priority}"></span>
        <span class="task-text">${task}</span>
        <div class="task-controls">
            <select class="change-priority" style="background-color: #2e2c2c; color: white;">
                <option value="low" ${priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${priority === 'high' ? 'selected' : ''}>High</option>
            </select>
            <button class="done-button" style="color: black;">Done</button>
            <button class="remove-button">Remove</button>
        </div>
    `;

    li.querySelector('.done-button').onclick = () => {
        li.classList.toggle('done');
        reorderTasks();
        saveTasks();
    };

    li.querySelector('.remove-button').onclick = () => {
        li.remove();
        saveTasks();
    };

    li.querySelector('.change-priority').onchange = (e) => {
        const newPriority = e.target.value;
        li.className = newPriority;
        li.querySelector('.priority').className = `priority ${newPriority}`;
        reorderTasks();
        saveTasks();
    };

    return li;
}

function insertSorted(li) {
    const ul = document.getElementById('todo-list');
    const items = Array.from(ul.children);
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    const insertIndex = items.findIndex(item =>
        priorityOrder[item.classList[0]] > priorityOrder[li.classList[0]] ||
        (priorityOrder[item.classList[0]] === priorityOrder[li.classList[0]] && !item.classList.contains('done'))
    );

    if (insertIndex === -1) {
        ul.appendChild(li);
    } else {
        ul.insertBefore(li, items[insertIndex]);
    }
}

function reorderTasks() {
    const ul = document.getElementById('todo-list');
    const items = Array.from(ul.children);
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    items.sort((a, b) => {
        if (a.classList.contains('done') && !b.classList.contains('done')) return 1;
        if (!a.classList.contains('done') && b.classList.contains('done')) return -1;
        return priorityOrder[a.classList[0]] - priorityOrder[b.classList[0]];
    });

    ul.innerHTML = '';
    items.forEach(item => ul.appendChild(item));
}

function saveTasks() {
    const tasks = [];
    document.querySelectorAll('#todo-list li').forEach(li => {
        tasks.push({
            text: li.querySelector('.task-text').textContent,
            priority: li.classList[0],
            done: li.classList.contains('done')
        });
    });
    const currentDate = new Date().toDateString();
    localStorage.setItem('tasks', JSON.stringify({ date: currentDate, tasks: tasks }));
}

function loadTasks() {
    const storedData = JSON.parse(localStorage.getItem('tasks'));
    const currentDate = new Date().toDateString();

    if (storedData && storedData.date === currentDate) {
        storedData.tasks.forEach(task => {
            const li = createTodoItem(task.text, task.priority);
            if (task.done) li.classList.add('done');
            insertSorted(li);
        });
    } else {
        localStorage.removeItem('tasks');
    }
}


// Pomodoro Timer
let pomodoroInterval;
let pomodoroTime = 25 * 60;
let alarmSound;

function setupPomodoro() {
    const startButton = document.getElementById('pomodoro-start');
    const resetButton = document.getElementById('pomodoro-reset');
    const timerDisplay = document.getElementById('pomodoro-timer');
    const customTimeButton = document.getElementById('pomodoro-time');

    startButton.addEventListener('click', startPomodoro);
    resetButton.addEventListener('click', resetPomodoro);
    customTimeButton.addEventListener('click', setCustomTime);

    // Request permission for notifications
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    // Setup alarm sound
    alarmSound = new Audio('https://audio-previews.elements.envatousercontent.com/files/181619625/preview.mp3');
    const customAlarmButton = document.getElementById('alarm-tune');
    customAlarmButton.addEventListener('click', setCustomAlarm);
}

function startPomodoro() {
    if (!pomodoroInterval) {
        pomodoroInterval = setInterval(updatePomodoro, 1000);
        document.getElementById('pomodoro-start').textContent = '||';
    } else {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
        document.getElementById('pomodoro-start').textContent = '▶';
    }
}

function updatePomodoro() {
    const minutes = Math.floor(pomodoroTime / 60).toString().padStart(2, '0');
    const seconds = (pomodoroTime % 60).toString().padStart(2, '0');
    document.getElementById('pomodoro-timer').textContent = `${minutes}:${seconds}`;
    
    if (pomodoroTime === 0) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
        playAlarm();
        showNotification('Pomodoro Timer', 'Time is up!');
        resetPomodoro();
    } else {
        pomodoroTime--;
    }
}

function resetPomodoro() {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    pomodoroTime = 25 * 60;
    document.getElementById('pomodoro-timer').textContent = '25:00';
    document.getElementById('pomodoro-start').textContent = '▶';
}

function setCustomTime() {
    const customTime = prompt('Enter the number of minutes for the timer:');
    if (customTime && !isNaN(customTime)) {
        pomodoroTime = parseInt(customTime) * 60;
        const minutes = Math.floor(pomodoroTime / 60).toString().padStart(2, '0');
        const seconds = (pomodoroTime % 60).toString().padStart(2, '0');
        document.getElementById('pomodoro-timer').textContent = `${minutes}:${seconds}`;
    }
}

function playAlarm() {
    alarmSound.play();
}

function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    }
}

function setCustomAlarm() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            alarmSound = new Audio(event.target.result);
        };
        reader.readAsDataURL(file);
    };
    input.click();
}


// Quote of the Day
function getQuote() {
    fetch('https://api.quotable.io/random')
        .then(response => response.json())
        .then(data => {
            document.getElementById('quote').textContent = `"${data.content}" - ${data.author}`;
        })
        .catch(error => {
            console.error('Error fetching quote:', error);
            document.getElementById('quote').textContent = 'Failed to load quote. Please try again later.';
        });
}



// Reset daily features
function resetDailyFeatures() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('lastReset');

    if (lastReset !== today) {
        localStorage.removeItem('goalComplete');
        document.getElementById('goal-progress-bar').style.width = '0%';
        document.getElementById('goal-complete').disabled = false;
        localStorage.setItem('lastReset', today);
    }
}


// Reminder Feature
function setupReminder() {
    const reminderDisplay = document.getElementById('reminder-display');
    const activeReminder = document.getElementById('active-reminder');

    reminderDisplay.addEventListener('click', function() {
        const reminderText = prompt("Enter your reminder:");
        if (reminderText && reminderText.trim()) {
            activeReminder.textContent = `Reminder: ${reminderText.trim()}`;
            localStorage.setItem('activeReminder', reminderText.trim());
        }
    });

    // Load saved reminder
    const savedReminder = localStorage.getItem('activeReminder');
    if (savedReminder) {
        activeReminder.textContent = `Reminder: ${savedReminder}`;
    }
}

// Read Later Feature
function setupReadLater() {
    const addButton = document.getElementById('add-read-later');
    const readLaterList = document.getElementById('read-later-list');

    addButton.addEventListener('click', function() {
        const url = prompt("Enter the URL of the article or video:");
        if (url && url.trim()) {
            addReadLaterItem(url.trim());
        }
    });

    function addReadLaterItem(url) {
        const item = document.createElement('div');
        item.className = 'read-later-item';
        item.innerHTML = `
            <a href="${url}" target="_blank">${truncateUrl(url)}</a>
            <button class="remove-read-later">Remove</button>
        `;
        readLaterList.appendChild(item);

        item.querySelector('.remove-read-later').addEventListener('click', function() {
            readLaterList.removeChild(item);
            saveReadLaterItems();
        });

        saveReadLaterItems();
    }

    function truncateUrl(url) {
        const maxLength = 30;
        return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
    }

    function saveReadLaterItems() {
        const items = Array.from(readLaterList.children).map(item => item.querySelector('a').href);
        localStorage.setItem('readLaterItems', JSON.stringify(items));
    }

    function loadReadLaterItems() {
        const items = JSON.parse(localStorage.getItem('readLaterItems')) || [];
        items.forEach(addReadLaterItem);
    }

    loadReadLaterItems();
}


document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    document.getElementById('add-button').addEventListener('click', addTodo);
    setupPomodoro();
    getQuote();
    setupReminder();
    setupReadLater();
    setupQuickLinks();
});
