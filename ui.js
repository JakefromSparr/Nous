// === Valid Actions Set === //
const validActions = new Set([
  'start-game', 'go-rules', 'go-options', 'back-to-welcome',
  'save-and-quit', 'pull-divination', 'next-round',
  'end-round', 'double-points', 'start-question',
  'answer-a', 'answer-b', 'answer-c',
  'challenge-result', 'accept-result', 'return-to-lobby',
  'restart-game', 'save-reading', 'quit-game',
  'welcome-up', 'welcome-down', 'welcome-select',
  'participants-up', 'participants-confirm', 'participants-down',
  'fate-a', 'fate-b', 'fate-c'
]);

// === Button Configurations by Screen === //
const buttonConfigs = {
  welcome: [
    { label: "Up", action: "welcome-up" },
    { label: "Select", action: "welcome-select" },
    { label: "Down", action: "welcome-down" }
  ],
  rules: [
    { label: "Back", action: "back-to-welcome" },
    null,
    null
  ],
  options: [
    { label: "Back", action: "back-to-welcome" },
    null,
    null
  ],
  participants: [
    { label: "More", action: "participants-up" },
    { label: "Confirm", action: "participants-confirm" },
    { label: "Less", action: "participants-down" }
  ],
  "game-lobby": [
    { label: "Turn Back", action: "save-and-quit" },
    { label: "Tempt Fate", action: "pull-divination" },
    { label: "Press On", action: "next-round" }
  ],
  "round-lobby": [
    { label: "Cut the Thread", action: "end-round" },
    { label: "Weave it to Fate", action: "double-points" },
    { label: "Pull the Thread", action: "start-question" }
  ],
  question: [
    { label: "Choose A", action: "answer-a" },
    { label: "Choose B", action: "answer-b" },
    { label: "Choose C", action: "answer-c" }
  ],
  "fate-card": [
    { label: "Choose A", action: "fate-a" },
    { label: "Choose B", action: "fate-b" },
    { label: "Choose C", action: "fate-c" }
  ],
  result: [
    { label: "Disagree", action: "challenge-result" },
    { label: "Outcome", action: "", disabled: true },
    { label: "Accept", action: "accept-result" }
  ],
  failure: [
    { label: "[Logo]", action: "", disabled: true },
    { label: "Return to Lobby", action: "return-to-lobby" },
    { label: "[Logo]", action: "", disabled: true }
  ],
  "final-reading": [
    { label: "Restart", action: "restart-game" },
    { label: "Save Reading", action: "save-reading" },
    { label: "Quit", action: "quit-game" }
  ]
};

// === Validation: Warn if any action is not in the known list === //
function validateButtonActions(config) {
  for (const screen in config) {
    config[screen].forEach((btn, idx) => {
      if (btn && btn.action && !validActions.has(btn.action)) {
        console.warn(`⚠️ Invalid action '${btn.action}' on button ${idx + 1} for screen '${screen}'`);
      }
    });
  }
}
validateButtonActions(buttonConfigs);

// === UI Module for Nous === //
const UI = (() => {
  const appContainer = document.getElementById('app-container');
  const controller = document.getElementById('controller');
  const agentLog = document.getElementById('last-change');
  const ariaStatus = document.getElementById('aria-status');

  const buttons = {
    btn1: document.getElementById('btn-1'),
    btn2: document.getElementById('btn-2'),
    btn3: document.getElementById('btn-3'),
  };

  const labels = {
    btn1: buttons.btn1.querySelector('.button-label'),
    btn2: buttons.btn2.querySelector('.button-label'),
    btn3: buttons.btn3.querySelector('.button-label'),
  };

  const screens = document.querySelectorAll('.game-screen');

  // --- Welcome Screen Option Navigation ---
  const welcomeOptions = Array.from(document.querySelectorAll('#welcome-options li'));
  let welcomeIndex = 0;

  const updateWelcomeHighlight = () => {
    welcomeOptions.forEach((li, idx) => {
      li.classList.toggle('selected', idx === welcomeIndex);
    });
    if (ariaStatus) ariaStatus.textContent = getWelcomeSelection();
  };

  const moveWelcomeSelection = (dir) => {
    if (dir === 'up') {
      welcomeIndex = (welcomeIndex - 1 + welcomeOptions.length) % welcomeOptions.length;
    } else if (dir === 'down') {
      welcomeIndex = (welcomeIndex + 1) % welcomeOptions.length;
    }
    updateWelcomeHighlight();
  };

  const getWelcomeSelection = () => {
    const li = welcomeOptions[welcomeIndex];
    if (!li) return '';
    // Remove any leading symbols (like the static arrow) before returning
    return li.textContent.replace(/^\s*[^A-Za-z0-9]*/, '').trim();
  };

  const updateScreen = (screenName) => {
    // Trigger "inky black" transition
    appContainer.classList.add('is-transitioning');

    setTimeout(() => {
      // Remove active class from all screens
      screens.forEach(screen => {
        screen.classList.remove('is-active');
        screen.setAttribute('aria-hidden', 'true');
      });

      // Activate the requested screen
      const newScreen = document.querySelector(`[data-screen="${screenName}"]`);
      if (newScreen) {
        newScreen.classList.add('is-active');
        newScreen.setAttribute('aria-hidden', 'false');
      }

      appContainer.setAttribute('data-game-state', screenName);
      controller.setAttribute('data-controller-state', screenName);
      if (agentLog) agentLog.textContent = `Last state: ${screenName}`;
      if (ariaStatus) ariaStatus.textContent = screenName.replace('-', ' ');

      configureButtons(screenName);

      if (screenName === 'welcome') {
        updateWelcomeHighlight();
      }

      // Remove transition class to fade back in
      appContainer.classList.remove('is-transitioning');
    }, 700);
  };

  const configureButtons = (screenName) => {
    const config = buttonConfigs[screenName] || [];

    ['btn1', 'btn2', 'btn3'].forEach((id, i) => {
      const btn = buttons[id];
      const labelSpan = btn.querySelector('.button-label');
      const def = config[i];

      if (def && labelSpan) {
        labelSpan.innerText = def.label;
        btn.disabled = !!def.disabled;
        btn.setAttribute('data-action', def.action || '');
      } else if (labelSpan) {
        labelSpan.innerText = '';
        btn.disabled = true;
        btn.removeAttribute('data-action');
      }
    });
  };
// Inside the UI IIFE
const participantCountDisplay = document.getElementById('participant-count-display');
const flavorLine = document.getElementById('participant-flavor');
let participantCount = 1;

const updateParticipantDisplay = () => {
  participantCountDisplay.textContent = participantCount;
};

const showParticipantEntry = () => {
  participantCount = 1;
  flavorLine.hidden = true;
  updateParticipantDisplay();
  updateScreen('participants');
};

const adjustParticipantCount = (delta) => {
  participantCount = Math.min(20, Math.max(1, participantCount + delta));
  updateParticipantDisplay();
};

const getParticipantCount = () => participantCount;

const confirmParticipants = () => {
  const count = participantCount;
  flavorLine.textContent = `Strange... it looks like there are ${count + 1} of you here. Ah well.`;
  flavorLine.hidden = false;
  return count;
};

  const updateDisplayValues = (data) => {
    if ('lives' in data) {
      document.getElementById('lives-display').textContent = data.lives;
    }
    if ('roundsToWin' in data && 'roundsWon' in data) {
      const remaining = data.roundsToWin - data.roundsWon;
      document.getElementById('rounds-display').textContent = remaining;
    }
    if ('score' in data) {
      document.getElementById('score-display').textContent = data.score;
    }
    if ('thread' in data) {
      document.getElementById('thread-display').textContent = data.thread;
    }
    if ('roundScore' in data) {
      document.getElementById('round-score').textContent = data.roundScore;
    }
    if ('roundNumber' in data) {
      document.getElementById('round-number-display').textContent = data.roundNumber;
    }
    if ('currentCategory' in data) {
      document.getElementById('category-hint').textContent = data.currentCategory;
    }
    if ('divinations' in data) {
      document.getElementById('active-divinations').textContent = data.divinations.join(', ');
    }
    if ('activeRoundEffects' in data) {
      const container = document.querySelector('#divinations-display p');
      const titles = data.activeRoundEffects.map(e => e.cardTitle).filter(Boolean);
      container.textContent = titles.length ? titles.join(', ') : '[None]';
    }
  };

  const showQuestion = (q) => {
    document.getElementById('question-title').textContent = q.title;
    document.getElementById('question-text').textContent = q.text;
    document.getElementById('answer-a').textContent = q.choices.A;
    document.getElementById('answer-b').textContent = q.choices.B;
    document.getElementById('answer-c').textContent = q.choices.C;
  };

  const showFateCard = (card) => {
    document.getElementById('fate-card-title').textContent = card.title;
    document.getElementById('fate-card-text').textContent = card.text;
    const a = card.choices[0]?.label || '';
    const b = card.choices[1]?.label || '';
    const c = card.choices[2]?.label || '';
    document.getElementById('fate-a-text').textContent = a;
    document.getElementById('fate-b-text').textContent = b;
    document.getElementById('fate-c-text').textContent = c;
  };

  const showResult = (res) => {
    document.getElementById('result-header').textContent = res.correct ? "Correct" : "Incorrect";
    document.getElementById('result-question').textContent = res.question;
    document.getElementById('result-chosen-answer').textContent = res.answer;
    document.getElementById('result-explanation').textContent = res.explanation;
    document.getElementById('result-outcome-message').textContent = res.outcomeText;
  };

  const showFailure = (pointsLost) => {
    document.getElementById('lost-points-display').textContent = pointsLost;
  };

  const showFateResult = (flavorText) => {
    if (flavorText) {
      alert(flavorText);
      console.log(`[FATE RESULT]: ${flavorText}`);
    }
  };

  return {
    updateScreen,
    configureButtons,
    updateDisplayValues,
    showQuestion,
    showResult,
    showFailure,
    showFateCard,
    showFateResult,
    showParticipantEntry,
    adjustParticipantCount,
    getParticipantCount,
    confirmParticipants,
    moveWelcomeSelection,
    getWelcomeSelection
  };
})();
