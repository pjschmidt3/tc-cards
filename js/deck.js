let cards = [];
let idCounter = 0;
let socket = null;
let serverURL = window.location.hostname + ":" + window.location.port;
let tableId = window.location.search.substring(4);
let compassDiff = 0;
let compassDirection = 0;
let isCompassAttached = false;
let touchStartX = 0;
let touchEndX = 0;

// on ready
document.addEventListener(
  "DOMContentLoaded",
  function () {
    // init a deck of 10 cards
    init(10);

    // ==========
    // Creating the deck connection
    // 1. Find where "serverURL" (a string) is passed into the io.connect() method
    // 2. Replace the string with the variable serverURL (without quotes) in order for
    // socket.io-client to connect with the server
    // ==========

    // connect to websocket server
    socket = io.connect(serverURL);

    // register phone connection
    socket.emit("phone-connect", tableId);

    // init touch events in phone
    let touchTrack = new TouchTrack();
    touchTrack.init(
      document.getElementById("touchHandler"),
      touchStart,
      touchMove,
      touchEnd
    );
  },
  false
);

// CARD FUNCTIONS

function addCard() {
  // adds a new card to the end of the deck
  let randomCard = getRandomCard();
  let card = {
    id: "card" + idCounter++,
    suit: randomCard.suit,
    rank: randomCard.rank,
  };
  cards.push(card);

  document.getElementById("touchHandler").innerHTML += `<div class="item">
            <div id="${card.id}" class="card ${card.suit} rank${card.rank}">
                <div class="face"/>
            </div>
        </div>`;
}

// ==========
// Correcting the card throw strength property
// 1. Find where 0 is assigned the value for 'strength'
// 2. Replace 0 with 'strength' (not in quotes) to assign
// the value from the strength parameter to the strength property for each card
// ==========

function removeCard(id, strength) {
  // animates a card leaving the deck
  // after 500 ms removes the element from the DOM and informs the table
  if (cards.length === 0) {
    return;
  }
  let card = cards[0];
  cards.splice(0, 1);
  setTimeout(function () {
    document.getElementById(id).parentElement.remove();
    addCard();
    socket.emit("phone-throw-card", {
      tableId: tableId,
      suit: card.suit,
      rank: card.rank,
      angle: getCompassDirection(),
      strength: strength,
    });
  }, 200);
}

// SWIPE EVENTS

function touchStart(x, y) {
  // do nothing
  touchStartX = Math.round(x);
}

function touchMove(evt, x, y, offsetX, offsetY) {
  evt.preventDefault();
}

function touchEnd(x, y, offsetX, offsetY, timeTaken) {
  // 10 pixels swipe up = min threshold
  if (-offsetY < 10) {
    return;
  }

  touchEndX = Math.round(x);

  // add class to animate
  let card = cards[0];
  let cardElement = document.getElementById(card.id);
  cardElement.classList += " move";

  // calculate strength (2000+ pixels per second = 100% strength)
  let distanceY = -offsetY;
  let pps = Math.trunc((distanceY * 1.0) / (timeTaken / 1000.0));
  let min = Math.min(2000, pps);
  let percentage = Math.trunc((min / 2000) * 100);

  removeCard(card.id, percentage);
}

// RANDOM CARDS

function getRandomCard() {
  return {
    suit: getRandomSuit(),
    rank: getRandomNumber(1, 13),
  };
}

function getRandomSuit() {
  let suits = ["hearts", "spades", "clubs", "diamonds"];
  return suits[getRandomNumber(0, 3)];
}

// AUX

function init(n) {
  for (let i = 0; i < n; i++) {
    addCard();
  }
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getCompassDirection() {
  let val = (touchEndX - touchStartX + 360) % 360;
  if (val >= 0 && val < 180) {
    return Math.min(val, 70);
  } else {
    return Math.max(val, 250);
  }
}

function calibrate() {
  document.getElementById("touchHandler").className += " calibrated";
  document.getElementById("waiting-for-calibration").remove();
  compassDiff = compassDirection;
}
