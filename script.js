// -------------------------------------------------- DOM ELEMENTS -------------------------------------------------------

const newGameBtn = document.getElementById("new-game"); //Button - start fresh a game
const quitGameBtn = document.getElementById("quit-game"); //Button - finish game
const gameBoard = document.getElementById("game-board"); //Container for memory game board
const difficultySelect = document.getElementById("difficulty-levels"); //Dropdown menu - select difficulty
const moveEl = document.getElementById("moves-used"); //Display moves used
const matchEl = document.getElementById("matches-collected"); //Display the matches collected
const timeEl = document.getElementById("time-used"); //Display time used
const dialogMessage = document.getElementById("dialog-message"); //Dialog box
const closeBtn = document.getElementById("close-button"); //Close btton for dialog box
const music = document.getElementById("bg-music");
const button = document.getElementById("music-toggle");

// -------------------------------------------------- GAME VARIABLES -----------------------------------------------------

let board = []; //Array to store the emojis on the board
let moves = 0; //Numbers of moves used
let matches = 0; //Number of matches collected
let seconds = 0; //Timer, seconds
let minutes = 0; //Timer, minutes
let interval = null; //Interval for the timer
let firstCard = null; //First card reference
let secondCard = null; //Second card reference
let lockBoard = false; //Prevents interaction while checkingfor matches
let selectedIndex = 0; //Index of currently selected card for keyboard navigation
let isPlaying = false;

// -------------------------------------------------- EMOJI LIST ---------------------------------------------------

const emojiList = [
  "🐶",
  "🦁",
  "🐹",
  "🐷",
  "🦄",
  "🦋",
  "🐙",
  "🐸",
  "🐞",
  "🐵",
  "🐼",
  "🐯",
  "🦀",
  "🐬",
  "🐻",
  "🐿",
  "🦍",
  "🐩",
  "🐠",
  "🐢",
  "🐍",
  "🐈",
  "🐝",
  "🐥",
];

// ----------------------------------------------------- MUSIC LOGIC --------------------------------------------------------

// Toggle button
function musicLogic() {
  music.volume = 0.5; // optional
  if (isPlaying) {
    music.pause();
    button.textContent = "Music ON";
  } else {
    music.play();
    button.textContent = "Music PAUSE";
  }
  isPlaying = !isPlaying;
}

button.addEventListener("click", musicLogic);

// -------------------------------------------------- DIFFICULTY LEVEL ---------------------------------------------------

const difficultyLevels = {
  easy: { pairs: 6, columns: 4, rows: 3 }, //12 cards, 6 pairs
  medium: { pairs: 12, columns: 6, rows: 4 }, //24 cards, 12 pairs
  hard: { pairs: 24, columns: 8, rows: 6 }, //48 cards, 24 pairs
};

// -------------------------------------------------- SETUP --------------------------------------------------------------

newGameBtn.addEventListener("click", startGame); //Starts new game when button is clicked
quitGameBtn.addEventListener("click", quitGame); //Finish game when button is clicked
closeBtn.addEventListener("click", () => {
  dialogMessage.close(); //Close the victory dialog box
});

startGame(); //Starts the actual game when page is loaded

// -------------------------------------------- GENERATE EMOJI FROM EMOJI ARRAY ------------------------------------------

function getRandomEmojis(pairs) {
  const shuffledEmojis = [...emojiList].sort(() => 0.5 - Math.random()); //Shuffles the emoji list
  return shuffledEmojis.slice(0, pairs); //Returns the required number of pairs
}

// -------------------------------------------------- BOARD SET UP -------------------------------------------------------

function createBoard() {
  board = [];
  const { pairs } = difficultyLevels[difficultySelect.value]; //Get numbers of pairs based on dificulty
  const emojis = getRandomEmojis(pairs); //Get random emojis

  emojis.forEach((emoji) => {
    board.push(emoji, emoji); //Add each emoji twice to create pairs
  });

  board.sort(() => Math.random() - 0.5); //Shuffle the board
}

// -------------------------------------------------- RENDER BOARD -------------------------------------------------------

function renderBoard() {
  const { columns, rows } = difficultyLevels[difficultySelect.value];

  gameBoard.innerHTML = "";
  gameBoard.style.setProperty("--columns", columns);

  board.forEach((emoji, index) => {
    const card = document.createElement("div");
    card.className = "card hidden";
    card.dataset.index = index;
    card.textContent = emoji;

    //Extra help for screen readers, without its hard to know whats under the cards.
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Kort ${index + 1}, skjult`);
    card.setAttribute("tabindex", "-1");

    card.addEventListener("click", () => handleCardClick(card));

    gameBoard.appendChild(card);
  });
  selectedIndex = 0;
  updateSelection(0);
}

// -------------------------------------------------- KEYDOWN NAVIGATION -------------------------------------------------------

function getCards() {
  return Array.from(document.querySelectorAll(".card"));
}

function updateSelection(newIndex) {
  const cards = getCards();
  if (!cards.length) return;

  // Clamp index
  //newIndex = Math.max(0, Math.min(newIndex, cards.length - 1));
  // prevent going out of bounds
  if (newIndex < 0 || newIndex >= cards.length) return;

  // Remove old selection
  cards[selectedIndex]?.classList.remove("selected");

  selectedIndex = newIndex;

  // Add new selection
  cards[selectedIndex].classList.add("selected");
}

// -------------------------------------------------- CARD CLICKER ----------------------------------------------------------
function handleCardClick(card) {
  if (lockBoard) return;
  if (!card.classList.contains("hidden")) return;
  if (card === firstCard) return;

  card.classList.remove("hidden");
  // Extra help for screen readers, without its hard to know whats under the cards.
  card.setAttribute(
    "aria-label",
    `Kort ${card.dataset.index + 1}, ${card.textContent}`
  );

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  lockBoard = true;
  moves++;
  moveEl.textContent = moves;

  checkForMatch();
}
// -------------------------------------------------- MATCH CHECK ---------------------------------------------------------

function checkForMatch() {
  const isMatch = firstCard.textContent === secondCard.textContent;

  if (isMatch) {
    disableMatchedCards();
  } else {
    unflipCards();
  }
}

// -------------------------------------------------- DISABLE MATCHES ----------------------------------------------------------

function disableMatchedCards() {
  firstCard.classList.add("matched");
  secondCard.classList.add("matched");

  matches++;
  matchEl.textContent = matches;

  resetCards();

  // Its checking if game is completed
  checkGameComplete();
}

// -------------------------------------------------- CHECK IF GAME COMPLETED ---------------------------------------------------

function checkGameComplete() {
  const { pairs } = difficultyLevels[difficultySelect.value];

  // If all matches are found
  if (matches === pairs) {
    clearInterval(interval); // Stop the timer

    // Show the dialog with results
    const dialogText = document.querySelector("#dialog-box p");
    dialogText.textContent = `Congratulations! You successfully completed this game and found all the matches. You did this in ${moves} moves and your time was ${timeEl.textContent}. Great job!`;

    showModal();
  }
}

// -------------------------------------------------- NO MATCHES ----------------------------------------------------------

function unflipCards() {
  setTimeout(() => {
    firstCard.classList.add("hidden");
    secondCard.classList.add("hidden");

    resetCards();
  }, 800); // delay so player can see
}

// -------------------------------------------------- RESET CARDS ----------------------------------------------------------
function resetCards() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

// -------------------------------------------------- MOVES USED ----------------------------------------------------------

function movesUsed() {
  moves++;
  moveEl.textContent = moves;
}

// -------------------------------------------------- MATCHES COLLECTED ----------------------------------------------------------

function matchesCollected() {
  matches++;
  matchEl.textContent = matches;
}

// -------------------------------------------------- SET TIMER ----------------------------------------------------------

function startTimer() {
  clearInterval(interval);

  interval = setInterval(() => {
    seconds++;
    if (seconds === 60) {
      minutes++;
      seconds = 0;
    }
    let formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    let formattedSeconds = seconds < 10 ? "0" + seconds : seconds;

    timeEl.textContent = `${formattedMinutes}:${formattedSeconds}`;
  }, 1000);
}

// -------------------------------------------------- START GAME SETUP ---------------------------------------------------

function startGame() {
  resetBoard();
  createBoard();
  renderBoard();
  startTimer();
}

function showModal() {
  dialogMessage.showModal();
}

// -------------------------------------------------- QUIT GAME SETUP ---------------------------------------------------

function quitGame() {
  clearInterval(interval); // Stops the timer
  resetBoard();
  gameBoard.innerHTML = "";
}

// -------------------------------------------------- RESET BOARD --------------------------------------------------------

function resetBoard() {
  moves = 0;
  matches = 0;
  seconds = 0;
  minutes = 0;
  // Reset display
  moveEl.textContent = "0";
  matchEl.textContent = "0";
  timeEl.textContent = "00:00";

  clearInterval(interval);
}

// -------------------------------------------------- INPUT / KEYDOWN ----------------------------------------------------

const inputKeys = Object.freeze({
  moveLeft: "ArrowLeft",
  moveRight: "ArrowRight",
  moveDown: "ArrowDown",
  moveUp: "ArrowUp",
  enter: "Enter",
  space: " ",
});

function select() {
  // shared logic for mouse & keyboard
  const cards = getCards();
  const card = cards[selectedIndex];
  if (!card) return;

  handleCardClick(card);
}

function moveLeft() {
  updateSelection(selectedIndex - 1);
}
function moveRight() {
  updateSelection(selectedIndex + 1);
}
function moveDown() {
  const { columns } = difficultyLevels[difficultySelect.value];
  updateSelection(selectedIndex + columns);
}
function moveUp() {
  const { columns } = difficultyLevels[difficultySelect.value];
  updateSelection(selectedIndex - columns);
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case inputKeys.moveLeft:
      moveLeft();
      break;
    case inputKeys.moveRight:
      moveRight();
      break;
    case inputKeys.moveDown:
      moveDown();
      break;
    case inputKeys.moveUp:
      moveUp();
      break;
    case "Enter":
    case " ":
      e.preventDefault(); // prevents page scroll on space
      select();
      break;
  }
});
