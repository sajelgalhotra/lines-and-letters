// Returns a random int less than max
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Returns if the passed int is odd
// Scrabble tiles (for letter frequency)
const LETTERS = ["E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E",
  "A", "A", "A", "A", "A", "A", "A", "A", "A", "I", "I", "I",
  "I", "I", "I", "I", "I", "I", "O", "O", "O", "O", "O", "O",
  "O", "O", "N", "N", "N", "N", "N", "N", "R", "R", "R", "R",
  "R", "R", "T", "T", "T", "T", "T", "T", "D", "D", "D", "D",
  "L", "L", "L", "L", "S", "S", "S", "S", "U", "U", "U", "U",
  "G", "G", "G", "B", "B", "C", "C", "F", "F", "H", "H", "M",
  "M", "P", "P", "V", "V", "W", "W", "Y", "Y", "J", "K", "Q",
  "X", "Z"];

// Point values 
const BASE = {
  "A": 1, "B": 1, "C": 1, "D": 1,
  "E": 1, "F": 2, "G": 1, "H": 2,
  "I": 1, "J": 4, "K": 3, "L": 1,
  "M": 1, "N": 1, "O": 1, "P": 1,
  "Q": 5, "R": 1, "S": 1, "T": 1,
  "U": 1, "V": 2, "W": 2, "X": 3,
  "Y": 1, "Z": 4,
}

// export const BASE_URL = "https://flask-fire-7e7ywojchq-uc.a.run.app";
export const BASE_URL = "http://127.0.0.1:5000";

function isOdd(num) { return num % 2 }

function isVowel(letter) { return ["A", "E", "I", "O", "U"].includes(letter) }

/* 
  Randomizes array in-place using Durstenfeld shuffle algorithm 
  From https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
*/
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

// Returns if the borders at the indicated indices are all claimed in gridState
export function areClaimed(gridState, indices) {
  return indices.every(([x, y]) => gridState[y][x].claimer);
}

// Returns if the passed gameState is done
export function isFinished(gridState) {
  const numUnclaimed = gridState.map((row) =>
    row.filter((item) =>
      item.hasOwnProperty("claimer") && item.claimer === 0
    )
  ).flat(1).length;
  return numUnclaimed === 0;
}

// Detects claimed letters and updates grid state in newGridSquares
export function getClaimedLetters(newGridSquares, oldGridSquares, x, y, currentPlayer) {
  let claimedLetters = [];
  if (isOdd(y)) {
    if (x !== 0 && areClaimed(oldGridSquares, [[x - 1, y - 1], [x - 2, y], [x - 1, y + 1]])) {
      newGridSquares[y][x - 1].winner = currentPlayer;
      claimedLetters.push({ letter: newGridSquares[y][x - 1].letter, point_value: newGridSquares[y][x - 1].point_value });
    }
    if (x !== oldGridSquares.length - 1 && areClaimed(oldGridSquares, [[x + 1, y - 1], [x + 2, y], [x + 1, y + 1]])) {
      newGridSquares[y][x + 1].winner = currentPlayer;
      claimedLetters.push({ letter: newGridSquares[y][x + 1].letter, point_value: newGridSquares[y][x + 1].point_value });
    }
  } else {
    if (y !== 0 && areClaimed(oldGridSquares, [[x, y - 2], [x - 1, y - 1], [x + 1, y - 1]])) {
      newGridSquares[y - 1][x].winner = currentPlayer;
      claimedLetters.push({ letter: newGridSquares[y - 1][x].letter, point_value: newGridSquares[y - 1][x].point_value });
    }
    if (y !== oldGridSquares.length - 1 && areClaimed(oldGridSquares, [[x - 1, y + 1], [x + 1, y + 1], [x, y + 2]])) {
      newGridSquares[y + 1][x].winner = currentPlayer;
      claimedLetters.push({ letter: newGridSquares[y + 1][x].letter, point_value: newGridSquares[y + 1][x].point_value });
    }
  }
  return claimedLetters;
}

// Detects if a move branches off a previous one without allowing opponent captures
function isDifficultCPUCandidateMove(y, x, gridState, strict) {
  if (isOdd(y)) {
    let leftBoxNumClaimed = 1;
    let rightBoxNumClaimed = 1;
    if (x !== 0) {
      leftBoxNumClaimed = [[x - 1, y - 1], [x - 2, y], [x - 1, y + 1]].filter((coord) =>
        gridState[coord[1]][coord[0]].claimer !== 0
      ).length + 1;
    }
    if (x !== gridState.length - 1) {
      rightBoxNumClaimed = [[x + 1, y - 1], [x + 2, y], [x + 1, y + 1]].filter((coord) =>
        gridState[coord[1]][coord[0]].claimer !== 0
      ).length + 1;
    }
    const adjacent = !strict || leftBoxNumClaimed === 2 || rightBoxNumClaimed === 2;
    return adjacent && leftBoxNumClaimed < 3 && rightBoxNumClaimed < 3;
  } else {
    let topBoxNumClaimed = 1;
    let bottomBoxNumClaimed = 1;
    if (y !== 0) {
      topBoxNumClaimed = [[x, y - 2], [x - 1, y - 1], [x + 1, y - 1]].filter((coord) =>
        gridState[coord[1]][coord[0]].claimer !== 0
      ).length + 1;
    }
    if (y !== gridState.length - 1) {
      bottomBoxNumClaimed = [[x - 1, y + 1], [x + 1, y + 1], [x, y + 2]].filter((coord) =>
        gridState[coord[1]][coord[0]].claimer !== 0
      ).length + 1;
    }
    const adjacent = !strict || topBoxNumClaimed === 2 || bottomBoxNumClaimed === 2;
    return adjacent && topBoxNumClaimed < 3 && bottomBoxNumClaimed < 3;
  }
}

// Selects an available border at random
function randomSelect(gridState) {
  while (true) {
    const i = getRandomInt(gridState.length);
    const j = getRandomInt(gridState[0].length);
    if (gridState[i][j].hasOwnProperty("claimer") && gridState[i][j].claimer === 0) {
      let newGridState = JSON.parse(JSON.stringify(gridState));
      newGridState[i][j].claimer = 2;
      const claimedLetters = getClaimedLetters(newGridState, gridState, j, i, 2);
      return { grid: newGridState, claimedLetters: claimedLetters };
    }
  }
}

/*
  Returns the usefulness of a letter given the letters already claimed.
  Usefulness = PV + AH + VB
  PV: point value. Modify for vowels and Q.
  AH: already have. More points for new letters, except common double letters.
  VB: vowel balance. More points for vowels if you already have more consonants, and vice versa.
*/
function getUsefulness(letter, alreadyClaimed) {
  // Baseline is modified point value
  let usefulness = Math.floor((letter.point_value + 1) / 2);
  // Bonus for vowels
  usefulness += isVowel(letter.letter) ? 1 : 0;
  // Penalty for Q if no U already
  if (letter.letter === "Q" && !alreadyClaimed.includes("U")) {
    usefulness = 0;
  }

  // Bonus for new letters
  usefulness += alreadyClaimed.includes(letter.letter) ? 0 : 2;
  // Bonus for second E, L, S, O
  if (["E", "L", "S", "O"].includes(letter.letter)) {
    if (alreadyClaimed.filter((item) => item === letter.letter).length === 1) {
      usefulness += 2;
    }
  }

  // Bonus for keeping vowel-consonant balance
  const numVowels = alreadyClaimed.filter((item) => isVowel(item)).length;
  if (numVowels < Math.ceil(alreadyClaimed.length / 2)) {
    // More consonants. Vowels good
    usefulness += isVowel(letter.letter) ? 2 : 0;
  } else if (numVowels > Math.floor(alreadyClaimed.length / 2)) {
    // More vowels. Consonants good
    usefulness += isVowel(letter.letter) ? 0 : 2;
  } else {
    // Either consonant or vowel is good
    usefulness += 2;
  }

  return usefulness;
}

/*
This function takes the grid state and a difficulty setting (any type)
and should return the following:
  { grid: newGridState,
    claimedLetters: letters that were claimed, each of form { letter: "a", point_value: 1 } 
  }
*/
export function CPU(gridState, difficulty) {
  if (difficulty === "Easy Peasy") {
    // Select a line at random.
    return randomSelect(gridState);
  } else if (difficulty === "Mid") {
    // Complete high-value boxes if available. Otherwise, select at random.
    let bestValue = 0;
    let best = null;
    for (let i = 0; i < gridState.length; i++) {
      for (let j = 0; j < gridState[0].length; j++) {
        if (gridState[i][j].hasOwnProperty("claimer") && gridState[i][j].claimer === 0) {
          let newGridState = JSON.parse(JSON.stringify(gridState));
          newGridState[i][j].claimer = 2;
          const claimedLetters = getClaimedLetters(newGridState, gridState, j, i, 2);
          const claimValue = claimedLetters.map((item) => item.point_value)
            .reduce((a, b) => a + b, 0);
          if (claimValue > bestValue) {
            bestValue = claimValue;
            best = { grid: newGridState, claimedLetters: claimedLetters };
          }
        }
      }
    }
    return best ? best : randomSelect(gridState);
  } else if (difficulty === "Don't Even Bother Trying") {
    // Avoid letting opponent complete boxes, go for useful letters
    // First, try to claim useful letters
    const alreadyClaimed = gridState.map((row) =>
      row.filter((item) => item.hasOwnProperty("winner") && item.winner === 2))
      .flat().map((item) => item.letter);
    let bestUsefulness = 0;
    let bestUseful = null;
    let nextBestCandidates = [];
    let nextNextBestCandidates = [];
    for (let i = 0; i < gridState.length; i++) {
      for (let j = 0; j < gridState[0].length; j++) {
        if (gridState[i][j].hasOwnProperty("claimer") && gridState[i][j].claimer === 0) {
          let newGridState = JSON.parse(JSON.stringify(gridState));
          newGridState[i][j].claimer = 2;
          const claimedLetters = getClaimedLetters(newGridState, gridState, j, i, 2);
          if (claimedLetters.length) {
            const claimUsefulness = claimedLetters.map((item) => getUsefulness(item, alreadyClaimed)).reduce((a, b) => a + b);
            if (claimUsefulness > bestUsefulness) {
              bestUsefulness = claimUsefulness;
              bestUseful = { grid: newGridState, claimedLetters: claimedLetters };
            }
          } else if (isDifficultCPUCandidateMove(i, j, newGridState, true)) {
            nextBestCandidates.push({ grid: newGridState, claimedLetters: claimedLetters });
          } else if (isDifficultCPUCandidateMove(i, j, newGridState, false)) {
            nextNextBestCandidates.push({ grid: newGridState, claimedLetters: claimedLetters });
          }
        }
      }
    }
    if (bestUseful) {
      return bestUseful;
    }

    // If nothing to be claimed, build off existing lines without allowing opponent to claim
    if (nextBestCandidates.length) {
      return nextBestCandidates[Math.floor(Math.random() * nextBestCandidates.length)];
    }

    // If can't build off, at least don't allow opponent to claim
    if (nextNextBestCandidates.length) {
      return nextNextBestCandidates[Math.floor(Math.random() * nextNextBestCandidates.length)];
    }

    // If all else fails, choose at random.
    return randomSelect(gridState);
  }
}

export const syncGridDB = (newGridSquares, lobbyCode, claimedLetters, currentPlayer, setPhase) => {
  const requestData = { "grid": JSON.stringify(newGridSquares) };
  const requestOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  };
  fetch(`${BASE_URL}/games/${lobbyCode}`, requestOptions)
    .catch(error => console.error(error));

  if (claimedLetters.length) {
    // Add letters to player's collection
    const requestData = { "letters": claimedLetters, "player_id": currentPlayer };
    const requestOptions = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    };
    fetch(`${BASE_URL}/games/${lobbyCode}`, requestOptions)
      .catch(error => console.error('Error:', error));
    if (isFinished(newGridSquares)) {
      // Send to anagrams
      setTimeout(() => {
        console.log("Changing phases!");
        alert("Changing to anagrams!");
        const requestData = { "game_code": lobbyCode, "phase": 2 };
        const requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        };
        fetch(`${BASE_URL}/lobby`, requestOptions)
          .then(response => { setPhase(2); })
          .catch(error => console.error('Error:', error));
      }, 2000);
    }
  }
  const turnRequestData = { "advance_player": true };
  const turnRequestOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(turnRequestData)
  };
  fetch(`${BASE_URL}/games/${lobbyCode}`, turnRequestOptions)
    .catch(error => console.error('Error:', error));

}

/* 
  Function to pass a player's final score to the backend
*/
export const submitFinalScore = (lobbyCode, currentPlayer, finalScore) => {
  const requestData = { "final_score": finalScore, "player_id": currentPlayer };
  const requestOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  };
  fetch(`${BASE_URL}/games/${lobbyCode}`, requestOptions)
    .catch(error => console.error('Error:', error));
}


/*
  Function to confirm all players scores are in and you can proceed to the results page.
*/

export const canProceed = async (lobbyCode, currentPlayer, done) => {
  const requestOptions = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      done,
    }),
  };
  let canProceed = false;
  await fetch(
    `${BASE_URL}/games/${lobbyCode}/anagrams/${currentPlayer}`,
    requestOptions
  )
    .then((response) => response.json())
    .then((data) => {
      canProceed = data.can_proceed;
    })
    .catch((error) => console.error("Error:", error));

  return canProceed;
};

/*
  Return a random grid. Pass the size of the grid.
*/
export function generateGrid(gridSize) {
  // Grid should have around half vowels and half consonants
  const MARGIN_OF_ERROR = 0.05;
  let distribution = [0, 0];
  let letters = [];
  for (let i = 0; i <= gridSize * gridSize; i++) {
    let sample = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    while ((distribution[0] > Math.floor(gridSize * gridSize * (0.5 + MARGIN_OF_ERROR)) && isVowel(sample))
      || (distribution[1] > Math.floor(gridSize * gridSize * (0.5 + MARGIN_OF_ERROR)) && !isVowel(sample))) {
      sample = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    }
    if (isVowel(sample)) {
      distribution[0] += 1;
    } else {
      distribution[1] += 1;
    }
    letters.push(sample);
  }
  shuffle(letters);

  // Fill grid items with dots, borders, squares
  const gridItems = new Array(2 * gridSize + 1);
  for (let i = 0; i < 2 * gridSize + 1; i++) {
    gridItems[i] = new Array(2 * gridSize + 1);
    for (let j = 0; j < 2 * gridSize + 1; j++) {
      if (isOdd(i) && isOdd(j)) {
        const letter = letters.pop();
        const point_value = getPointValue(letter);
        gridItems[i][j] = { x: j, y: i, letter: letter, point_value: point_value, winner: 0 };
      } else if (isOdd(i) || isOdd(j)) {
        gridItems[i][j] = { x: j, y: i, claimer: 0 };
      } else {
        gridItems[i][j] = { x: j, y: i };
      }
    }
  }
  return gridItems;
}

/* 
  Return a randomly generated point value based on a letter.
  Base values are provided in BASE, roughly based on Scrabble:
    A, B, C, D, E, G, I, L, M, N, O, P, R, S, T, U, Y: 1 point
    F, H, V, W: 2 points
    K, X: 3 points
    J, Z: 4 points
    Q: 5 points
  With a 30% probability, the value gets +1
*/
export function getPointValue(letter) {
  let point_value = BASE[letter];
  if (Math.random() < 0.30) {
    point_value += 1;
  }
  return point_value;
}