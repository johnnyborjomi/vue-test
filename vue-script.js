var ROUND_TIME = 30;
var PENALTY_TIME = 5;
var ANIMATION_TIME = 1000;

var app = new Vue({
  el: "#app",
  data: function () {
    return {
      randomizer: null,
      timer: new GameCountDown(ROUND_TIME, PENALTY_TIME, this.endGame),
      cardsData: [],
      quiz: null,
      gameStateClass: "normal",
      isGameStopped: false,
      isGamePaused: true,
      scoreToBeat: localStorage.getItem("scoreToBeat") || 6,
      attempts: localStorage.getItem("attempts") || 0,
      winStreak: 0,
      correctHand: null,
      incorrectHand: null,
    };
  },
  methods: {
    onClick: function (event) {
      if (this.gameStateClass != "normal") return;
      console.log("click", event.currentTarget);
      this.checkQuiz(event.currentTarget.dataset.hand);
      var random = this.randomizer.get();
      this.quiz = this.cardsData[random];
      console.log(random);
    },
    getQuiz: function () {
      fetch("cards.json")
        .then((data) => data.json())
        .then((data) => {
          this.cardsData = data;
          // console.log(this.cardsData);
          this.randomizer = new Randomizer(0, this.cardsData.length);
          this.quiz = this.cardsData[this.randomizer.get()];
        });
    },
    endGame: function () {
      console.log("end");
    },
    setGameState: function (gameState, handsState) {
      this.gameStateClass = gameState;
      this.timer.pause();
      this.setHandsState(...handsState);

      console.log(gameState);
      setTimeout(() => {
        console.log(gameState);

        this.gameStateClass = "normal";
        this.timer.unPause();
        this.setHandsState();
      }, ANIMATION_TIME);
    },
    setHandsState: function (hand, incorrectHand) {
      if (!hand) {
        this.correctHand = null;
        this.incorrectHand = null;
        return;
      }
      if (incorrectHand) {
        this.incorrectHand = incorrectHand;
        this.correctHand = hand;
        return;
      }
      this.correctHand = hand;
      this.incorrectHand = null;
    },
    checkQuiz: function (hand) {
      var res = hand == this.quiz["win-hand-num"];
      console.log(hand, this.quiz["win-hand-num"], res);

      if (res) {
        this.winStreak++;
        this.setGameState("correct", [hand]);
      } else {
        this.setGameState("incorrect", [this.quiz["win-hand-num"], hand]);
      }
    },
  },
  created: function () {
    this.getQuiz();
    this.timer.run();
  },
  computed: {
    cardsClass: function () {
      return {};
    },
  },
});

//////////////////RANDOMIZER//////////////////

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

////////GAME COUNTDOWN////////////////

function GameCountDown(count, toSubtract, endCallback) {
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
  };

  this.run = function () {
    this.start();
    this.timerId = setTimeout(this.countDown.bind(this), 1000);
  };
}

//  FILTERS

Vue.filter("card", function (value) {
  let parts = value.split("-");
  let color = parts[1] == "spades" || parts[1] == "clubs" ? "black" : "red";
  // console.log(parts[1], color);
  return `<div class="card-type" style="color: ${color};">${parts[0]}</div>
          <div class="card-mast" style="color: ${color};">&${parts[1]};</div>`;
});

Vue.filter("time", function (time) {
  var minutes = String(Math.floor(time / 60));
  var seconds = String(time - minutes * 60);

  // return minutes;

  return `<div class="timer__frame timer__min js-timer-minutes">
            <span class="timer__value">${minutes < 10 ? 0 : minutes[0]}</span>
            <span class="timer__value">${
              minutes < 10 ? minutes[0] : minutes[1]
            }</span>
          </div>
          <div class="timer__sep">:</div>
          <div class="timer__frame timer__sec js-timer-seconds">
            <span class="timer__value">${seconds < 10 ? 0 : seconds[0]}</span>
            <span class="timer__value">${
              seconds < 10 ? seconds[0] : seconds[1]
            }</span>
          </div>`;
});
