/* =========================
BASIC CONFIG
========================= */
const CONFIG = {
    pvt_duration_ms: 180000,  // 3 минуты
    pvt_min_isi: 0,           // минимальный интервал между стимулами (0 секунд)
    pvt_max_isi: 4000,        // максимальный интервал между стимулами (4 секунды)
    pvt_stimulus_duration: 1000,  // максимальное время показа стимула
    pvt_fixation_duration: 500,
    training_trials: 5,       // количество тренировочных проб
};

/* =========================
ИНИЦИАЛИЗАЦИЯ JSPSYCH С DATAPIPE
========================= */
const jsPsych = initJsPsych({
    display_element: "jspsych-target",
    extensions: [
        {
            type: jsPsychExtensionPipe,
            params: {
                experiment_id: "ktbMNGnc4ZoC",
            }
        }
    ],
    on_finish: function() {
        // Сохраняем данные с префиксом KSS_PVT_
        const data = jsPsych.data.get().csv();
        const filename = `KSS_PVT_${window.PARTICIPANT_ID || 'unknown'}_${Date.now()}.csv`;
        
        // Отправляем данные через DataPipe
        jsPsych.extensions.pipe.save({
            filename: filename,
            data: data
        });
        
        // Показываем данные в конце
        jsPsych.data.displayData();
    },
});

/* =========================
KSS ШКАЛА СОНЛИВОСТИ
========================= */
const KSS_OPTIONS = [
    { value: 1, text: "Крайне бодр" },
    { value: 2, text: "Очень бодр" },
    { value: 3, text: "Бодр" },
    { value: 4, text: "Довольно бодр" },
    { value: 5, text: "Ни бодр, ни сонный" },
    { value: 6, text: "Некоторые признаки сонливости" },
    { value: 7, text: "Сонный, но никаких усилий для поддержания бодрствования не требуется" },
    { value: 8, text: "Сонный, некоторое усилие требуется, чтобы оставаться в сознании" },
    { value: 9, text: "Очень сонный, требуется большое усилие, чтобы не уснуть, борьба со сном" }
];

/* =========================
ВВОД ID УЧАСТНИКА
========================= */
const idTrial = {
    type: jsPsychSurveyHtmlForm,
    html: `<div style="display:flex; flex-direction:column; align-items:center; gap:20px; padding:40px;">
        <h2>Введите ID, который вам сообщил экспериментатор</h2>
        <input type="text" name="participant_id" required placeholder="id_1" 
               style="font-size:24px; padding:10px 20px; border:2px solid #333; border-radius:8px; text-align:center; width:300px;">
    </div>`,
    button_label: "Начать",
    on_finish: function(data) {
        const rawId = data.response.participant_id;
        const match = rawId.match(/\d+/);
        
        if (!match) {
            alert("ID должен содержать число! Например: id_1");
            location.reload();
            return;
        }
        
        const seed = parseInt(match[0]);
        jsPsych.randomization.setSeed(seed);
        
        window.PARTICIPANT_ID = rawId;
        window.SEED = seed;
        
        jsPsych.data.addProperties({
            subject_id: rawId,
            experiment_name: "KSS_PVT"
        });
        
        console.log("Participant ID:", rawId);
        console.log("Seed:", seed);
    }
};

/* =========================
ИНСТРУКЦИЯ К KSS
========================= */
const kssInstructionTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="screen-wrap">
        <div class="instr">
            <h1>Шкала сонливости</h1>
            <p>Сейчас вам будет предложена шкала сонливости.</p>
            <p>Пожалуйста, оцените ваше текущее состояние от 1 до 9.</p>
            <p>1 — вы крайне бодры, 9 — вы очень сонны.</p>
            <div class="small-note">Нажмите любую клавишу, чтобы продолжить.</div>
        </div>
    </div>`,
    choices: "ALL_KEYS"
};

/* =========================
KSS ШКАЛА - ВЫБОР
========================= */
const kssTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        let html = `<div class="screen-wrap">
            <div class="kss-container">
                <h1 class="kss-title">Оцените вашу текущую сонливость</h1>
                <p class="kss-description">Выберите пункт, который лучше всего описывает ваше текущее состояние:</p>
                <div class="kss-options">`;
        
        KSS_OPTIONS.forEach(option => {
            html += `<div class="kss-option" data-value="${option.value}" onclick="selectKSSOption(this, ${option.value})">
                <div class="kss-number">${option.value}</div>
                <div class="kss-text">${option.text}</div>
            </div>`;
        });
        
        html += `</div>
            </div>
        </div>`;
        return html;
    },
    choices: "NO_KEYS",
    trial_duration: 300000,  // 5 минут максимум
    on_finish: function(data) {
        if (!window.kssResponse) {
            alert("Пожалуйста, выберите вариант!");
            jsPsych.finishTrial();
            return;
        }
        data.kss_score = window.kssResponse;
        console.log("KSS Score:", window.kssResponse);
    }
};

// Функция для выбора опции KSS
function selectKSSOption(element, value) {
    document.querySelectorAll('.kss-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    element.classList.add('selected');
    window.kssResponse = value;
    
    setTimeout(() => {
        jsPsych.finishTrial();
    }, 500);
}

/* =========================
ИНСТРУКЦИЯ К ТРЕНИРОВКЕ PVT
========================= */
const pvtTrainingInstructionTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="screen-wrap">
        <div class="instr">
            <h1>Тренировка: Тест на внимание</h1>
            <p>Сейчас будет тренировка теста на внимание.</p>
            <p>На черном экране будет появляться число.</p>
            <p>Как только вы увидите число, нажмите <strong>ПРОБЕЛ</strong> как можно быстрее.</p>
            <p>Тренировка состоит из <strong>5 проб</strong>.</p>
            <p>После каждого ответа вы увидите обратную связь.</p>
            <div class="small-note">Нажмите любую клавишу, чтобы начать тренировку.</div>
        </div>
    </div>`,
    choices: "ALL_KEYS"
};

/* =========================
ТРЕНИРОВОЧНЫЕ ПРОБЫ PVT
========================= */
function createTrainingTrial(trialNum) {
    return {
        timeline: [
            // Фиксация
            {
                type: jsPsychHtmlKeyboardResponse,
                stimulus: `<div class="pvt-screen"><div class="pvt-fixation">+</div></div>`,
                choices: "NO_KEYS",
                trial_duration: CONFIG.pvt_fixation_duration,
            },
            // Случайный интервал
            {
                type: jsPsychHtmlKeyboardResponse,
                stimulus: `<div class="pvt-screen"></div>`,
                choices: "NO_KEYS",
                trial_duration: function() {
                    return CONFIG.pvt_min_isi + Math.random() * (CONFIG.pvt_max_isi - CONFIG.pvt_min_isi);
                },
            },
            // Стимул и реакция
            {
                type: jsPsychHtmlKeyboardResponse,
                stimulus: `<div class="pvt-screen"><div class="pvt-stimulus">0</div></div>`,
                choices: [" "],
                trial_duration: CONFIG.pvt_stimulus_duration,
                data: {
                    trial_type: 'pvt_training',
                    training_trial_number: trialNum,
                    participant_id: window.PARTICIPANT_ID,
                    seed: window.SEED,
                },
                on_finish: function(data) {
                    if (data.response === null) {
                        data.reaction_time = null;
                        data.timeout = 1;
                    } else {
                        data.reaction_time = data.rt;
                        data.timeout = 0;
                    }
                },
            },
            // Обратная связь
            {
                type: jsPsychHtmlKeyboardResponse,
                stimulus: function() {
                    const last = jsPsych.data.get().last(1).values()[0];
                    if (last.timeout) {
                        return `<div class="screen-wrap"><div class="feedback-slow">Слишком медленно!</div></div>`;
                    } else {
                        return `<div class="screen-wrap"><div class="feedback-good">Время реакции: ${last.reaction_time} мс</div></div>`;
                    }
                },
                choices: "NO_KEYS",
                trial_duration: 1500,
            }
        ]
    };
}

// Создаем 5 тренировочных проб
const trainingTrials = [];
for (let i = 1; i <= CONFIG.training_trials; i++) {
    trainingTrials.push(createTrainingTrial(i));
}

/* =========================
ИНСТРУКЦИЯ К ОСНОВНОЙ ЗАДАЧЕ PVT
========================= */
const pvtMainInstructionTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="screen-wrap">
        <div class="instr">
            <h1>Основной тест на внимание</h1>
            <p>Тренировка завершена!</p>
            <p>Теперь начинается основной тест.</p>
            <p>На черном экране будут появляться числа.</p>
            <p>Как только вы увидите число, нажмите <strong>ПРОБЕЛ</strong> как можно быстрее.</p>
            <p>Тест продлится <strong>3 минуты</strong>.</p>
            <p>Обратной связи больше не будет.</p>
            <p>Старайтесь реагировать быстро и точно.</p>
            <div class="small-note">Нажмите любую клавишу, чтобы начать.</div>
        </div>
    </div>`,
    choices: "ALL_KEYS"
};

/* =========================
ОСНОВНАЯ PVT ЗАДАЧА
========================= */
const pvtMainTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="pvt-screen">
        <div class="pvt-fixation">+</div>
        <div class="pvt-timer" id="pvt-timer">3:00</div>
    </div>`,
    choices: "NO_KEYS",
    trial_duration: CONFIG.pvt_fixation_duration,
    on_finish: function() {
        startMainPVT();
    }
};

function startMainPVT() {
    const startTime = Date.now();
    const endTime = startTime + CONFIG.pvt_duration_ms;
    let trialCount = 0;
    
    function runPVTTrial() {
        const currentTime = Date.now();
        
        if (currentTime >= endTime) {
            jsPsych.finishTrial();
            return;
        }
        
        const isi = CONFIG.pvt_min_isi + Math.random() * (CONFIG.pvt_max_isi - CONFIG.pvt_min_isi);
        
        setTimeout(() => {
            const currentTime2 = Date.now();
            if (currentTime2 >= endTime) {
                jsPsych.finishTrial();
                return;
            }
            
            trialCount++;
            const stimStartTime = Date.now();
            
            const displayElement = document.getElementById('jspsych-target');
            displayElement.innerHTML = `<div class="pvt-screen">
                <div class="pvt-stimulus">0</div>
                <div class="pvt-timer" id="pvt-timer"></div>
            </div>`;
            
            updatePVTTimer(endTime);
            
            function onKeyPress(e) {
                if (e.code === 'Space') {
                    const reactionTime = Date.now() - stimStartTime;
                    
                    jsPsych.data.write({
                        trial_type: 'pvt_main',
                        participant_id: window.PARTICIPANT_ID,
                        seed: window.SEED,
                        trial_number: trialCount,
                        reaction_time: reactionTime,
                        timestamp: Date.now()
                    });
                    
                    console.log(`PVT Main Trial ${trialCount}: RT = ${reactionTime}ms`);
                    
                    document.removeEventListener('keydown', onKeyPress);
                    runPVTTrial();
                }
            }
            
            document.addEventListener('keydown', onKeyPress);
            
            setTimeout(() => {
                document.removeEventListener('keydown', onKeyPress);
                
                jsPsych.data.write({
                    trial_type: 'pvt_main_no_response',
                    participant_id: window.PARTICIPANT_ID,
                    seed: window.SEED,
                    trial_number: trialCount,
                    reaction_time: null,
                    timestamp: Date.now()
                });
                
                console.log(`PVT Main Trial ${trialCount}: No response`);
                
                runPVTTrial();
            }, CONFIG.pvt_stimulus_duration);
            
        }, isi);
    }
    
    runPVTTrial();
    
    const timerInterval = setInterval(() => {
        updatePVTTimer(endTime);
    }, 1000);
    
    setTimeout(() => {
        clearInterval(timerInterval);
    }, CONFIG.pvt_duration_ms);
}

function updatePVTTimer(endTime) {
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const timerElement = document.getElementById('pvt-timer');
    if (timerElement) {
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

/* =========================
ФИНАЛЬНЫЙ ЭКРАН
========================= */
const finishTrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="screen-wrap">
        <div class="finish-screen">
            <h1>Спасибо!</h1>
            <p>Эксперимент завершён.</p>
            <p>Ваши данные были сохранены.</p>
            <div class="data-info">
                <h3>Информация о данных:</h3>
                <p><strong>ID участника:</strong> ${window.PARTICIPANT_ID || 'N/A'}</p>
                <p><strong>Название эксперимента:</strong> KSS_PVT</p>
                <p><strong>Файл сохранен с префиксом:</strong> KSS_PVT_</p>
            </div>
            <div class="small-note">Нажмите любую клавишу, чтобы увидеть таблицу данных.</div>
        </div>
    </div>`,
    choices: "ALL_KEYS"
};

/* =========================
TIMELINE
========================= */
const timeline = [
    idTrial,
    kssInstructionTrial,
    kssTrial,
    pvtTrainingInstructionTrial,
    ...trainingTrials,
    pvtMainInstructionTrial,
    pvtMainTrial,
    finishTrial
];

/* =========================
СТАРТ ЭКСПЕРИМЕНТА
========================= */
function startExperiment() {
    document.getElementById('fullscreen-start').style.display = 'none';
    jsPsych.run(timeline);
}

function enterFullscreen() {
    const el = document.documentElement;
    const requestFullscreen = el.requestFullscreen || 
                              el.webkitRequestFullscreen || 
                              el.msRequestFullscreen;
    
    if (requestFullscreen) {
        requestFullscreen.call(el).then(() => {
            startExperiment();
        }).catch((err) => {
            console.warn("Fullscreen request failed:", err);
            startExperiment();
        });
    } else {
        startExperiment();
    }
}

document.getElementById('start-fullscreen-btn').addEventListener('click', enterFullscreen);

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const startScreen = document.getElementById('fullscreen-start');
        if (startScreen && startScreen.style.display !== 'none') {
            enterFullscreen();
        }
    }
});
