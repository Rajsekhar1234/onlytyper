let timer, countdown, startTime, mode = '', passageText = '', currentWords = [], stats = [];

async function startInfiniteMode() {
  mode = 'infinite';
  const response = await fetch('data/sentences.json');
  const data = await response.json();
  currentWords = generateSentenceStream(data);
  showControls('timer');
  renderTestBox(currentWords.join(' '));
}

async function startPassageMode() {
  mode = 'passage';
  const response = await fetch('data/passages.json');
  const data = await response.json();
  passageText = getRandomPassage(data);
  currentWords = passageText.split(' ');
  showControls('passage');
  renderTestBox(passageText);
  startTypingTest(900);
}

function showControls(type) {
  document.getElementById('controls').innerHTML = type === 'timer'
    ? `<label>Duration (minutes): <input id="duration" type="number" min="1" value="1" /></label>
       <button onclick="startTypingTestFromInput()">Start</button>
       <button onclick="viewHistory()">🏆 View History</button>
       <button onclick="clearHistory()">🗑 Clear History</button>
       <button onclick="toggleDarkMode()">🌓 Toggle Dark Mode</button>`
    : `<button onclick="viewHistory()">🏆 View History</button>
       <button onclick="clearHistory()">🗑 Clear History</button>
       <button onclick="toggleDarkMode()">🌓 Toggle Dark Mode</button>`;
}

function renderTestBox(text) {
  document.getElementById('testBox').innerText = text;
  document.getElementById('inputArea').value = '';
  document.getElementById('inputArea').disabled = false;
  document.getElementById('stats').innerHTML = '';
  document.getElementById('showGraphBtn').style.display = 'none';
  document.getElementById('timerDisplay').innerText = '';
  stats = [];
}

function startTypingTestFromInput() {
  const mins = parseInt(document.getElementById('duration').value || '1');
  startTypingTest(mins * 60);
}

function startTypingTest(duration) {
  startTime = Date.now();
  let inputArea = document.getElementById('inputArea');
  inputArea.focus();
  inputArea.oninput = trackTyping;

  clearInterval(timer);
  clearInterval(countdown);
  timer = setTimeout(endTypingTest, duration * 1000);

  let timeLeft = duration;
  document.getElementById('timerDisplay').innerText = `Time Left: ${formatTime(timeLeft)}`;
  countdown = setInterval(() => {
    timeLeft--;
    document.getElementById('timerDisplay').innerText = `Time Left: ${formatTime(timeLeft)}`;
    if (timeLeft <= 0) clearInterval(countdown);
  }, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function trackTyping() {
  let typed = document.getElementById('inputArea').value.trim();
  let typedWords = typed.split(/\s+/);
  stats = typedWords.map((word, i) => {
    return {
      word: word,
      expected: currentWords[i] || '',
      correct: word === currentWords[i]
    };
  });
}

function endTypingTest() {
  document.getElementById('inputArea').disabled = true;
  clearInterval(timer);
  clearInterval(countdown);

  const correctWords = stats.filter(w => w.correct).length;
  const totalWords = stats.length;
  const elapsedMinutes = (Date.now() - startTime) / 60000;

  const wpm = Math.round(totalWords / elapsedMinutes);
  const accuracy = totalWords ? Math.round((correctWords / totalWords) * 100) : 0;

  document.getElementById('stats').innerHTML =
    `<p><strong>WPM:</strong> ${wpm}</p>
     <p><strong>Accuracy:</strong> ${accuracy}%</p>`;
  document.getElementById('showGraphBtn').style.display = 'block';

  saveHistory({
    date: new Date().toLocaleString(),
    mode,
    wpm,
    accuracy
  });
}

function showGraph() {
  const labels = stats.map((_, i) => `Word ${i + 1}`);
  const accuracyData = stats.map(w => w.correct ? 1 : 0);

  new Chart(document.getElementById('statsChart'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Correct (1) / Incorrect (0)',
        data: accuracyData,
        backgroundColor: accuracyData.map(val => val ? '#28a745' : '#dc3545')
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 1
        }
      }
    }
  });
}

function generateSentenceStream(sentences) {
  let result = [];
  for (let i = 0; i < 100; i++) {
    result.push(sentences[Math.floor(Math.random() * sentences.length)]);
  }
  return result.join(' ').split(' ');
}

function getRandomPassage(passages) {
  return passages[Math.floor(Math.random() * passages.length)];
}

function saveHistory(entry) {
  let history = JSON.parse(localStorage.getItem('typingHistory') || '[]');
  history.unshift(entry);
  if (history.length > 5) history = history.slice(0, 5);
  localStorage.setItem('typingHistory', JSON.stringify(history));
}

function viewHistory() {
  const history = JSON.parse(localStorage.getItem('typingHistory') || '[]');
  if (history.length === 0) {
    document.getElementById('stats').innerHTML = '<div class="history-box"><p>No history found.</p></div>';
    return;
  }

  let html = '<div class="history-box"><h3>📜 Typing History (Last 5 Sessions)</h3><ul>';
  history.forEach(h => {
    html += `<li><span>${h.date}</span> | <strong>Mode:</strong> ${h.mode} | <strong>WPM:</strong> ${h.wpm} | <strong>Accuracy:</strong> ${h.accuracy}%</li>`;
  });
  html += '</ul></div>';

  document.getElementById('stats').innerHTML = html;
  document.getElementById('showGraphBtn').style.display = 'none';
}

function clearHistory() {
  localStorage.removeItem('typingHistory');
  alert('History cleared.');
  viewHistory();
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}
