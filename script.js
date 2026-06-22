// Game Core State Model
let tasks = [];
let xp = 0;
let gold = 0;
let level = 1;
let streak = 0;

// Procedural Boss Engine State
let currentBossIndex = 0;
let bossTierLevel = 1;
let bossMaxHp = 100;
let bossHp = 100;

// Infinite Boss Database
const bossDatabase = [
    { name: "PROJECT VORTEX", avatar: "🐉" },
    { name: "CYBER GOLEM", avatar: "🤖" },
    { name: "DUE-DATE DEMON", avatar: "👹" },
    { name: "BUG MONSTER", avatar: "👾" },
    { name: "PROCRASTINATION KRAKEN", avatar: "🦑" }
];

// UI Component Connectors mapping
const themeToggle = document.getElementById('themeToggle');
const taskInput = document.getElementById('taskInput');
const priorityInput = document.getElementById('priorityInput');
const dateInput = document.getElementById('dateInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

const xpCount = document.getElementById('xpCount');
const goldCount = document.getElementById('goldCount');
const levelDisplay = document.getElementById('levelDisplay');
const rankDisplay = document.getElementById('rankDisplay');
const streakCount = document.getElementById('streakCount');
const totalTasksText = document.getElementById('totalTasks');
const completedTasksText = document.getElementById('completedTasks');
const overallProgressBar = document.getElementById('overallProgressBar');

// Boss Elements
const bossMainTitle = document.getElementById('bossMainTitle');
const bossLevelTier = document.getElementById('bossLevelTier');
const bossHpText = document.getElementById('bossHpText');
const bossMaxHpText = document.getElementById('bossMaxHpText');
const hpBarContainer = document.getElementById('hpBarContainer');
const bossEnemy = document.getElementById('bossEnemy');
const fireballEffect = document.getElementById('fireballEffect');

// Modal Elements
const victoryModal = document.getElementById('victoryModal');
const modalBossName = document.getElementById('modalBossName');
const modalNextBoss = document.getElementById('modalNextBoss');
const claimRewardsBtn = document.getElementById('claimRewardsBtn');

// Set default input date matching today
const today = new Date();
dateInput.value = today.toISOString().split('T')[0];

function initializeHpBar() {
    hpBarContainer.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const segment = document.createElement('div');
        segment.className = 'hp-segment';
        segment.id = `hp-seg-${i}`;
        hpBarContainer.appendChild(segment);
    }
}

themeToggle.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    if (activeTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '🌙 Dark Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '☀️ Light Mode';
    }
});

// App Core Controllers
function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const task = {
        id: Date.now(),
        text: text,
        priority: priorityInput.value,
        date: dateInput.value,
        completed: false
    };

    tasks.push(task);
    taskInput.value = '';
    updateUI();
}

window.toggleTask = function(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            const nextState = !task.completed;

            let damage = 10;
            let xpReward = 10;
            let goldReward = 5;

            if (task.priority === 'High') {
                damage = 30;
                xpReward = 30;
                goldReward = 20;
            } else if (task.priority === 'Medium') {
                damage = 20;
                xpReward = 20;
                goldReward = 10;
            }

            if (nextState) {
                xp += xpReward;
                gold += goldReward;
                bossHp = Math.max(0, bossHp - damage);
                streak = streak === 0 ? 1 : streak;
                triggerCombatAnimations();

                if (bossHp <= 0) {
                    setTimeout(triggerBossDefeatedSequence, 600);
                }
            } else {
                xp = Math.max(0, xp - xpReward);
                gold = Math.max(0, gold - goldReward);
                bossHp = Math.min(bossMaxHp, bossHp + damage);
            }

            return {...task, completed: nextState };
        }
        return task;
    });
    updateUI();
};

window.deleteTask = function(id) {
    tasks = tasks.filter(t => t.id !== id);
    updateUI();
};

function triggerCombatAnimations() {
    fireballEffect.classList.remove('cast');
    void fireballEffect.offsetWidth;
    fireballEffect.classList.add('cast');

    setTimeout(() => {
        bossEnemy.classList.add('damaged');
        setTimeout(() => bossEnemy.classList.remove('damaged'), 300);
    }, 200);
}

function triggerBossDefeatedSequence() {
    const currentBoss = bossDatabase[currentBossIndex];
    modalBossName.innerText = `${currentBoss.name} DEFEATED!`;

    const nextIndex = (currentBossIndex + 1) % bossDatabase.length;
    const nextBoss = bossDatabase[nextIndex];
    modalNextBoss.innerText = `Level ${bossTierLevel + 1} Unlocked: Preparing to battle ${nextBoss.name}...`;

    victoryModal.classList.add('active');
}

claimRewardsBtn.addEventListener('click', () => {
    xp += 100;
    gold += 50;

    bossTierLevel += 1;
    bossMaxHp = 100 + (bossTierLevel - 1) * 20;
    bossHp = bossMaxHp;

    currentBossIndex = (currentBossIndex + 1) % bossDatabase.length;
    victoryModal.classList.remove('active');

    updateUI();
});

// Calculate Time Remaining String & Status Tag Modifier classes
function getCountdownData(targetDateStr) {
    const now = new Date();
    // Sets deadline threshold at midnight of the targeted completion day
    const deadline = new Date(targetDateStr + "T23:59:59");
    const diffMs = deadline - now;

    if (diffMs < 0) {
        return { text: "🚨 Overdue!", class: "time-tag overdue" };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours < 24) {
        return { text: `⏳ ${diffHours}h ${diffMinutes}m left`, class: "time-tag urgent" };
    } else {
        const daysLeft = Math.floor(diffHours / 24);
        return { text: `📅 ${daysLeft} days left`, class: "time-tag" };
    }
}

// Integrated UI Sync Cycle Redraw
function updateUI() {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const timeData = getCountdownData(task.date);
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;

        li.innerHTML = `
            <div class="task-left">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask(${task.id})">
                <span class="task-text">${task.text}</span>
                <span class="${timeData.class}">${task.completed ? '✅ Done' : timeData.text}</span>
                <span class="priority-badge badge-${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
            <button class="btn-delete" onclick="deleteTask(${task.id})">✕</button>
        `;
        taskList.appendChild(li);
    });

    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    totalTasksText.innerText = total;
    completedTasksText.innerText = completed;

    const progressPercentage = total === 0 ? 0 : (completed / total) * 100;
    overallProgressBar.style.width = `${progressPercentage}%`;

    level = Math.floor(xp / 100) + 1;
    levelDisplay.innerText = `Level ${level}`;
    xpCount.innerText = xp;
    goldCount.innerText = gold;
    streakCount.innerText = streak;

    if (level >= 5) rankDisplay.innerText = "Task Master 👑";
    else if (level >= 3) rankDisplay.innerText = "Intermediate ⚡";
    else rankDisplay.innerText = "Beginner 🥚";

    const currentBoss = bossDatabase[currentBossIndex];
    bossMainTitle.innerText = `${currentBoss.name} (BOSS FIGHT)`;
    bossLevelTier.innerText = `BOSS BATTLE - TIER ${bossTierLevel}`;
    bossHpText.innerText = bossHp;
    bossMaxHpText.innerText = bossMaxHp;

    if (bossHp <= 0) {
        bossEnemy.innerText = "💀";
    } else {
        bossEnemy.innerText = currentBoss.avatar;
    }

    const activeSegmentsCount = Math.ceil((bossHp / bossMaxHp) * 10);
    for (let i = 0; i < 10; i++) {
        const targetSegment = document.getElementById(`hp-seg-${i}`);
        if (targetSegment) {
            if (i < activeSegmentsCount) {
                targetSegment.classList.remove('lost');
            } else {
                targetSegment.classList.add('lost');
            }
        }
    }
}

// Initial Wire Hook Linkers
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// Setup a 60-second background checker loop to keep the layout timestamps up to date
setInterval(updateUI, 60000);

initializeHpBar();
updateUI();