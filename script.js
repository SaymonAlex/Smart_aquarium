// ---------- Настройка Firebase ----------
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCWjbq5aPJ_QGE_lwiCEvcHe42GOVV_ICM",
  authDomain: "aquarium-va.firebaseapp.com",
  databaseURL: "https://aquarium-va-default-rtdb.firebaseio.com",
  projectId: "aquarium-va",
  storageBucket: "aquarium-va.firebasestorage.app",
  messagingSenderId: "101030598385",
  appId: "1:101030598385:web:7c75c25fe85fc536527b50",
  measurementId: "G-DV9HNHVHM1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();


// Авторизация
firebase.auth().signInWithEmailAndPassword("nikitryok@gmail.com", "123Nikita#321")
  .then(user => {
    console.log("Вход выполнен:", user.user.email);
    initApp(); // запуск приложения
  })
  .catch(err => console.error("Ошибка авторизации:", err.message));



// ---------- DB Paths ----------
const PATH = {
  WIFISTAT: "/aquarium/HeardBeat",
  LIGHT: "/aquarium/light",
  LIGHTSTAT: "/aquarium/light/status",
  PUMP: "/aquarium/pump/on",
  PUMPSTAT: "/aquarium/pump/status",
  WIFIVAL: "/aquarium/Sensors/WifiAquarium",
  TEMP: "/aquarium/Sensors/WaterTemp",
  LEVEL: "/aquarium/Sensors/waterLevel"
};

// ---------- UI ----------
const wifiValue = document.getElementById("signal_wifi");
const wifistat = document.getElementById("status_wifi");
const lightToggle = document.getElementById("light-toggle");
const pumpToggle = document.getElementById("pump-toggle");
const hueSlider = document.getElementById("hue-slider");
const brightnessSlider = document.getElementById("brightness-slider");
const hueText = document.getElementById("hue-value");
const brightnessText = document.getElementById("brightness-value");
const ledStrip = document.getElementById("led-strip");
const tempValue = document.getElementById("temp-value");
const field_temp = document.getElementById("field_temp");
const levelFill = document.getElementById("level-fill");
const field_level = document.getElementById("field_level");
const levelPercent = document.getElementById("level-percent");
const bubblesContainer = document.getElementById("bubbles");
const logEl = document.getElementById("log");

let localLight = { on: 0, hue: 200, brightness: 100 };
let localPump = 0;
let PumpStatus = 0;

let sound_voice = false;
let utterance = null;
let temp_val = 0; 
let water_val = 0;

// ================ Light UI Update ===============
function updateStrip() {
  ledStrip.style.setProperty("--hue", localLight.hue);
  ledStrip.style.setProperty("--brightness", localLight.on ? localLight.brightness : 0);

  hueText.textContent = `${localLight.hue}°`;
  brightnessText.textContent = `${localLight.brightness}%`;

  document.querySelectorAll(".fish").forEach(f => {
    f.classList.toggle("paused", !localLight.on);
  });
}

// ---------------------Sound assistant Speak-------------------
setTimeout(() => {
  sound_voice = true;
}, 6000);

function speak(text) {
  if (!sound_voice) return;
  speechSynthesis.cancel();
  utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}
// ---------------------- Инициализация ------------------------
function initApp() {
// ✅ Запросы в Firebase

  lightToggle.addEventListener("click", () => {
    const next = localLight.on ? 0 : 1;
    lightToggle.classList.toggle("btn-pressed", next);
    db.ref(PATH.LIGHT).update({ on: next });
    log(`Запрос: Свет → ${next ? "ВКЛ" : "ВЫКЛ"}`);
  });

hueSlider.addEventListener("input", () => {
  localLight.hue = Number(hueSlider.value);
  updateStrip();
});

hueSlider.addEventListener("change", () => {
  db.ref(PATH.LIGHT).update({ hue: localLight.hue });
  log(`Hue → ${localLight.hue}`);
});

brightnessSlider.addEventListener("input", () => {
  localLight.brightness = Number(brightnessSlider.value);
  updateStrip();
});

brightnessSlider.addEventListener("change", () => {
  db.ref(PATH.LIGHT).update({ brightness: localLight.brightness });
  log(`Brightness → ${localLight.brightness}`);
});

// ================= Pump ==================
  function updatePump() {
    pumpToggle.classList.toggle("btn-pressed", PumpStatus);
    if (PumpStatus) startBubbles(); else stopBubbles();
  }

  pumpToggle.addEventListener("click", () => {
    const next = PumpStatus ? 0 : 1;
    localPump = next;
    pumpToggle.classList.toggle("btn-pressed", localPump);
    db.ref(PATH.PUMP).set(next); // ✅ только число
    log(`Запрос: Помпа → ${next ? "вкл" : "выкл"}`);
  });

// ================= Firebase Listeners ==================
db.ref(PATH.WIFIVAL).on("value", snap => {
  const wifisig = snap.val();
  if (!wifisig) return;
  wifiValue.innerHTML = wifisig ?? "---";
});

  db.ref(PATH.WIFISTAT).on("value", snap => {
    const val = snap.val();
    if (!val) return;
    stat_wifi = val ?? 0;
  });
  
  // -----------Проверка статуса Wi-Fi -----------
  let prev_statwifi;

  setInterval(() => {
    const isSame = stat_wifi === prev_statwifi;
    wifistat.classList.toggle('wifi_on', !isSame);
    wifistat.classList.toggle('wifi_off', isSame);
    wifiValue.classList.toggle('wifi_strike', isSame);
    prev_statwifi = stat_wifi;
  }, 15000);

  // ------Реальное состояние света с ESP---------
  db.ref(PATH.LIGHTSTAT).on("value", snap => {
    const status = Number(snap.val()) || 0;
    localLight.on = status; // управление по фидбеку!
    lightToggle.classList.toggle("btn-pressed", status);
    updateStrip();
    log(`Свет: ${status ? "ВКЛ" : "ВЫКЛ"}`);
    speak(status ? "Подсветка аквариума включена" : "Подсветка аквариума выключена");
  });

  // ---------Только hue и brightness-----------
  db.ref(PATH.LIGHT).on("value", snap => {
    const val = snap.val();
    if (!val) return;

    localLight.hue = Number(val.hue ?? localLight.hue);
    localLight.brightness = Number(val.brightness ?? localLight.brightness);

    hueSlider.value = localLight.hue;
    brightnessSlider.value = localLight.brightness;

    updateStrip();
    log(`Свет UI: H=${localLight.hue}, B=${localLight.brightness}`);
  });
// ------------Состояние насоса-------------
  db.ref(PATH.PUMPSTAT).on("value", snap => {
    const v = snap.val();
    PumpStatus = (v == 1);
    updatePump();
    log(`Помпа ${PumpStatus ? "вкл" : "выкл"}`);
    speak(v ? "Аквариум воздух включен" : "Аквариум воздух выключен");
  });

// --------------Температура----------------
db.ref(PATH.TEMP).on("value", snap => {
  const t = snap.val();
  temp_val = t;
  tempValue.textContent = (t != null) ? `${Number(t).toFixed(1)} °C` : "--°C";
});

// --------------Уровень воды----------------
db.ref(PATH.LEVEL).on("value", snap => {
  const lvl = Number(snap.val());
  const perc = Math.max(0, Math.min(100, lvl));
  levelFill.style.height = `${perc}%`;
  levelPercent.textContent = `${perc}%`;
  water_val = perc;
  if (perc > 70) {
    speak("В аквариуме уровень воды, в норме");
  } else {
    speak("В аквариуме, низкий уровень воды");
  }
});

}
// -------------- END of initApp--------------

// ------------Озвучка температуры и воды-----------
// Температура
function formatTemperature(temp) {
  // Превращаем строку "5,5" → 5.5
  const t = parseFloat(temp.toString().replace(',', '.'));

  const whole = Math.floor(t);
  const frac = Math.round((t - whole) * 10); // одна цифра после запятой

  let degreeWord =
    (whole % 10 === 1 && whole % 100 !== 11) ? "градус" :
      ([2, 3, 4].includes(whole % 10) && ![12, 13, 14].includes(whole % 100)) ? "градуса" :
        "градусов";

  if (frac > 0) {
    return `${whole} целых ${frac} десятых ${degreeWord}`;
  } else {
    return `${whole} ${degreeWord}`;
  }
}

field_temp.addEventListener("click", () => {
  speak(`Температура воды в аквариуме ${formatTemperature(temp_val)}`);
});

//Вода
function formatPercent(value) {
  const t = parseFloat(value.toString().replace(',', '.'));
  const whole = Math.floor(t);
  const frac = Math.round((t - whole) * 10); // одна цифра после запятой
  let percentWord =
    (whole % 10 === 1 && whole % 100 !== 11) ? "процент" :
      ([2, 3, 4].includes(whole % 10) && ![12, 13, 14].includes(whole % 100)) ? "процента" :
        "процентов";

  if (frac > 0) {
    return `${whole} целых ${frac} десятых ${percentWord}`;
  } else {
    return `${whole} ${percentWord}`;
  }
}

field_level.addEventListener("click", () => {
  if (water_val > 70) {
    speak(`В аквариуме уровень воды, в норме, ${formatPercent(water_val)}`);
  } else {
    speak(`В аквариуме, низкий уровень воды, ${formatPercent(water_val)}`);
  }
});



// ---------- Bubbles ----------
function spawnBubble() {
  const b = document.createElement('div');
  b.className = 'bubble';
  const size = Math.random() * 8 + 3; // 6-20px
  b.style.width = `${size}px`;
  b.style.height = `${size}px`;
  b.style.left = `${Math.random() * 90 + 5}%`;
  b.style.animationDuration = `${2 + Math.random() * 2}s`;
  bubblesContainer.appendChild(b);
  // удалить после анимации
  setTimeout(() => b.remove(), 4200);
}
let bubbleInterval = null;
function startBubbles() {
  if (!bubbleInterval) bubbleInterval = setInterval(spawnBubble, 300);
}
function stopBubbles() {
  clearInterval(bubbleInterval);
  bubbleInterval = null;
  bubblesContainer.innerHTML = "";
}

// ---------- Logs ----------
function log(msg) {
  const li = document.createElement("li");
  li.textContent =
    `${new Date().toLocaleTimeString()} — ${msg}`;
  logEl.prepend(li);
}

// -----------Full Screen--------------
const full_screen = document.querySelector('body');
full_screen.addEventListener('dblclick', () => {
  if (document.documentElement.requestFullscreen) {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Errror ${err}`);
      });
    } else {
      document.exitFullscreen();
    }
  }
});