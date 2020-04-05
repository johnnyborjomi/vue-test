function Randomizer(min, max, uniqueCount) {
  this.min = min;
  this.max = max;
  this.uniqueCount = uniqueCount >= max ? Math.floor(max / 2) : uniqueCount;
  this.uniques = [];
  var storage;

  function getRandom() {
    return this.min + Math.floor((this.max - this.min) * Math.random());
  }

  function updateUniques(storage) {
    if (this.uniques.length <= this.uniqueCount) {
      this.uniques.push(storage);
      return;
    }
    this.uniques.shift();
    this.uniques.push(storage);
  }

  this.get = function () {
    storage = getRandom.call(this, storage);
    if (this.uniques.indexOf(storage) == -1) {
      updateUniques.call(this, storage);
    } else {
      this.get();
    }
    return storage;
  };
}

function GameCountDown(node, count, toSubtract, endCallback) {
  this.display = node;
  this.displayMins = this.display.querySelector(".js-timer-minutes");
  this.displaySecs = this.display.querySelector(".js-timer-seconds");
  this.settingCount = count;
  this.endCallback = endCallback;
  this.timerId = 0;
  this.toSubtract = toSubtract - 1;
  this.count = count;
  this.isStopped = false;
  this.isPaused = false;

  this.end = function () {
    this.stop();
    this.endCallback();
  };

  this.start = function () {
    this.isStopped = false;
    this.count = this.settingCount;
    this.renderDisplay();
  };

  this.stop = function () {
    clearInterval(this.timerId);
    this.isStopped = true;
  };

  this.pause = function () {
    clearInterval(this.timerId);
    this.isPaused = true;
  };

  this.unPause = function () {
    this.isPaused = false;
    this.countDown();
  };

  this.subtract = function () {
    if (this.count - this.toSubtract <= 0) {
      this.count = 0;
      this.renderDisplay();
      this.end();
      return;
    }
    this.count -= this.toSubtract;
  };

  this.countDown = function () {
    if (this.isStopped) return;
    if (this.isPaused) return;
    if (this.count === 0) {
      this.end();
      return;
    }
    this.count--;
    this.renderDisplay();
    this.timerId = setTimeout(this.countDown.bind(this), 1000);
  };

  function formatTime(time) {
    var minutes = Math.floor(time / 60);
    var seconds = time - minutes * 60;
    return [minutes, seconds];
  }

  this.renderDisplay = function () {
    var time = formatTime(this.count);
    var minutes = String(time[0]);
    var seconds = String(time[1]);
    var num1 = minutes < 10 ? 0 : minutes[0];
    var num2 = minutes < 10 ? minutes[0] : minutes[1];
    var num3 = seconds < 10 ? 0 : seconds[0];
    var num4 = seconds < 10 ? seconds[0] : seconds[1];
    this.displayMins.children[0].innerHTML = num1;
    this.displayMins.children[1].innerHTML = num2;
    this.displaySecs.children[0].innerHTML = num3;
    this.displaySecs.children[1].innerHTML = num4;
  };

  this.run = function () {
    this.start();
    this.timerId = setTimeout(this.countDown.bind(this), 1000);
  };
}

function GameFieldsRenderer(game, selector) {
  this.url = ["", ".svg"];
  this.gameElem = game;
  this.flopElems = this.gameElem
    .querySelector(selector + "-flop")
    .querySelectorAll(selector + "-flop-card");
  this.turnElem = this.gameElem.querySelector(selector + "-turn-card");
  this.riverElem = this.gameElem.querySelector(selector + "-river-card");
  this.handsElems = this.gameElem.querySelectorAll(selector + "-hand-card");
  this.handType = this.gameElem.querySelector(selector + "-hand-type");

  this.renderItems = function (items, fields) {
    Array.prototype.map.call(
      items,
      function (item, index) {
        item.innerHTML = this.buildText(fields[index]);
      }.bind(this)
    );
  };

  this.buildText = function (text) {
    return text;
  };

  this.render = function (fields) {
    this.handType.innerText = fields["type"];
    this.renderItems(this.flopElems, fields["flop"]);
    this.turnElem.innerHTML = this.buildText(fields["turn"]);
    this.riverElem.innerHTML = this.buildText(fields["river"]);
    var dataHands = fields["hand1"].concat(fields["hand2"], fields["hand3"]);
    this.renderItems(this.handsElems, dataHands);
  };
}

function Game(selector, data) {
  this.data = data;
  this.gameElem = document.querySelector(selector);
  this.attemptsElem = this.gameElem.querySelector(selector + "-attempts");
  this.winStreakElem = this.gameElem.querySelector(selector + "-win-streak");
  this.scoreToBeatElem = this.gameElem.querySelector(
    selector + "-score-to-beat"
  );
  this.handsBlock = this.gameElem.querySelector(selector + "-hands");
  this.handElems = this.gameElem.querySelectorAll(selector + "-hand");
  this.gameOverOverlay = this.gameElem.querySelector(
    selector + "-over-overlay"
  );
  this.startButton = this.gameElem.querySelector(selector + "-start-btn");
  this.timerDisplay = this.gameElem.querySelector(".js-game-timer");
  this.fieldsRenderer = new GameFieldsRenderer(
    this.gameElem,
    selector,
    this.data
  );
  this.randomizer = new Randomizer(0, this.data.length);
  this.isGameStopped = false;
  this.scoreToBeat = localStorage.getItem("scoreToBeat") || 6;
  this.attempts = localStorage.getItem("attempts") || 0;
  this.attempts--;
  this.winStreak = 0;

  this.mapEvents = function () {
    var self = this;
    Array.prototype.map.call(this.handElems, function (hand) {
      hand.addEventListener("click", self.onClick.bind(self));
    });
    this.startButton.addEventListener("click", this.startGame.bind(this));
  };

  this.startGame = function () {
    this.winStreakElem.innerText = 0;
    this.attemptsElem.innerText = this.attempts;
    this.attempts++;
    localStorage.setItem("attempts", this.attempts);
    this.gameOverOverlay.classList.remove("active");
    this.isGameStopped = false;
    this.newQuiz();
    this.renderGameFields();
    this.timer.run();
  };

  this.endGame = function () {
    console.log("end");
    this.gameOverOverlay.classList.add("active");
    this.isGameStopped = true;
  };

  this.onClick = function (e) {
    if (this.checkHands(e.currentTarget)) {
      this.onCorrect(e.currentTarget);
      return;
    }
    this.onIncorrect(e.currentTarget);
  };

  this.checkHands = function (hand) {
    return hand.dataset.hand == this.currentQuiz["win-hand-num"];
  };

  this.onCorrect = function (hand) {
    this.upgradeStreak();
    this.showResultState("green", hand);
  };

  this.onIncorrect = function (hand) {
    this.timer.subtract();
    this.showResultState("red", hand);
  };

  this.upgradeStreak = function () {
    this.winStreak++;
    this.winStreakElem.innerText = this.winStreak;
    if (this.winStreak > this.scoreToBeat) {
      this.scoreToBeat = this.winStreak;
      this.scoreToBeatElem.innerHTML = this.scoreToBeat;
      localStorage.setItem("scoreToBeat", this.scoreToBeat);
    }
  };

  this.showResultState = function (cssClass, hand) {
    var self = this;
    this.timer.pause();
    this.timer.display.classList.add(cssClass);
    this.handsBlock.classList.add("disabled");
    hand.classList.add(cssClass);
    setTimeout(function () {
      self.timer.display.classList.remove(cssClass);
      self.handsBlock.classList.remove("disabled");
      hand.classList.remove(cssClass);
      self.timer.unPause();
      if (self.isGameStopped) return;
      self.updateGame();
    }, 1000);
  };

  this.newQuiz = function () {
    this.currentQuiz = this.data[this.randomizer.get()];
  };

  this.renderGameFields = function () {
    this.fieldsRenderer.render(this.currentQuiz);
  };

  this.updateGame = function () {
    this.newQuiz();
    this.renderGameFields();
  };

  this.init = function (time, faulTime) {
    this.scoreToBeatElem.innerText = this.scoreToBeat;
    this.winStreakElem.innerText = this.winStreak;
    this.attemptsElem.innerText = this.attempts;
    this.newQuiz();
    this.timer = new GameCountDown(
      this.timerDisplay,
      time,
      faulTime,
      this.endGame.bind(this)
    );
    this.mapEvents();
  };
}

var game;
fetch("cards.json")
  .then((data) => data.json())
  .then((data) => {
    console.log(data);
    game = new Game(".js-game", data);
    game.init(15, 5);
    game.startGame();
  });
