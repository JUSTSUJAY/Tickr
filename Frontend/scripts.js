function setupBackgroundChanger() {
    const changeBackgroundBtn = document.getElementById('change-background');
    const removeBackgroundBtn = document.getElementById('remove-background');

    changeBackgroundBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = event => {
                const img = new Image();
                img.onload = () => {
                    // Compress image if it's too large
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1080;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    document.body.style.backgroundImage = `url(${compressedDataUrl})`;
                    localStorage.setItem('backgroundImage', compressedDataUrl);
                    removeBackgroundBtn.style.display = 'block';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    });

    removeBackgroundBtn.addEventListener('click', () => {
        document.body.style.backgroundImage = 'none';
        localStorage.removeItem('backgroundImage');
        removeBackgroundBtn.style.display = 'none';
    });

    // Load saved background image on startup
    const savedBackground = localStorage.getItem('backgroundImage');
    if (savedBackground) {
        document.body.style.backgroundImage = `url(${savedBackground})`;
        removeBackgroundBtn.style.display = 'block';
    }
}


function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
    
    chrome.storage.sync.get(['userName'], function(result) {
        let userName = result.userName || 'User';
        let greeting;
        if (hours < 12) {
            greeting = `Good morning, ${userName}!`;
        } else if (hours < 18) {
            greeting = `Good afternoon, ${userName}!`;
        } else {
            greeting = `Good evening, ${userName}!`;
        }
        document.getElementById('greeting').textContent = greeting;
    });
}

function setupUserName() {
    chrome.storage.sync.get(['userName'], function(result) {
        if (!result.userName) {
            let userName = prompt("Please enter your name:");
            if (userName) {
                chrome.storage.sync.set({userName: userName}, function() {
                    console.log('User name saved');
                });
            }
        }
    });
}



// Quick Links Feature
// Quick Links Feature
function setupQuickLinks() {
    const addButton = document.getElementById('add-quick-link');
    const quickLinksList = document.getElementById('quick-links-list');
    let isRemoveMode = false;

    addButton.addEventListener('click', function() {
        if (quickLinksList.children.length < 10) {
            const url = prompt("Enter the URL for the quick link:");
            if (url && url.trim()) {
                const displayName = prompt("Enter a display name for this link:");
                if (displayName && displayName.trim()) {
                    addQuickLinkItem(url.trim(), displayName.trim());
                }
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
        updateAddButtonVisibility();
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

    function updateAddButtonVisibility() {
        addButton.style.display = quickLinksList.children.length < 10 ? 'block' : 'none';
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
            updateAddButtonVisibility();
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
    updateAddButtonVisibility();
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
        const aDone = a.classList.contains('done');
        const bDone = b.classList.contains('done');

        if (aDone && !bDone) return 1;
        if (!aDone && bDone) return -1;
        if (aDone && bDone) return 0;

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
            document.getElementById('todo-list').appendChild(li);
        });
        reorderTasks();
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
    setupBackgroundChanger();
    setupUserName();
    loadTasks();
    document.getElementById('add-button').addEventListener('click', addTodo);
    setupPomodoro();
    setupReminder();
    setupReadLater();
    setupQuickLinks();
    setInterval(updateClock, 1000);
    updateClock();
});
