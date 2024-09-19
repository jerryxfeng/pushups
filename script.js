// URL of your published Google Sheet CSV
const csvUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTAhxSgkKqKMBBh--ANLq5BborX1XRoW1GVsLp2G6di80-ectAgXmcRJzn9K-rhJyR2TuIQuD-EDu_i/pub?output=csv";

// Function to fetch CSV data and parse it
async function fetchPushupData() {
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    const data = parseCSV(csvText);
    animatePushupCounter(data); // Use animated counter function
    updateLeaderboard(data);
  } catch (error) {
    console.error("Error fetching the pushup data:", error);
  }
}

// Function to parse CSV text
function parseCSV(csvText) {
  const rows = csvText.split("\n").slice(1); // Skip header row
  return rows.map((row) => {
    const [submissionID, respondentID, submittedAt, pushups, proofLink] =
      row.split(",");
    return {
      submissionID,
      respondentID,
      submittedAt,
      pushups: parseInt(pushups) || 0,
      proofLink,
    };
  });
}

// Countdown Timer Logic
function startCountdownToMidnight() {
  const timerElement = document.getElementById("countdown-timer");

  function updateCountdown() {
    const now = new Date();

    // Get current time in Pacific Time (PT), accounting for daylight savings
    const pacificTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    );

    // Get the next midnight time in Pacific Time
    const nextMidnight = new Date(pacificTime);
    nextMidnight.setHours(24, 0, 0, 0); // Set to midnight of the next day

    // Calculate the time remaining
    const timeRemaining = nextMidnight - pacificTime;
    const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
    const seconds = Math.floor((timeRemaining / 1000) % 60);

    timerElement.textContent = `resets in: ${padNumber(hours)}:${padNumber(
      minutes
    )}:${padNumber(seconds)}`;
    setTimeout(updateCountdown, 1000);
  }

  function padNumber(num) {
    return num < 10 ? "0" + num : num;
  }

  updateCountdown();
}

// Animate pushup counter
function animatePushupCounter(data) {
  const totalPushups = data.reduce((total, entry) => total + entry.pushups, 0);
  const counterElement = document.getElementById("pushup-counter");
  let count = 0;
  const increment = totalPushups / 300;

  const counterInterval = setInterval(() => {
    count += increment;
    counterElement.textContent = Math.floor(count);
    if (count >= totalPushups) {
      clearInterval(counterInterval);
      counterElement.textContent = totalPushups;
    }
  }, 60);
}

// Extract Twitter username from the proof link
function extractTwitterUsername(proofLink) {
  const urlParts = proofLink.split("/");
  return `@${urlParts[3]}`;
}

// Find the highest pushup record for each user (by Twitter username)
function findUserPRs(data) {
  const userPRs = {};

  data.forEach((entry) => {
    const twitterUsername = extractTwitterUsername(entry.proofLink);

    if (!userPRs[twitterUsername] || entry.pushups > userPRs[twitterUsername]) {
      userPRs[twitterUsername] = entry.pushups;
    }
  });

  return userPRs;
}

// Update the leaderboard to show each submission separately
function updateLeaderboard(data) {
  const leaderboard = document.getElementById("leaderboard-list");
  leaderboard.innerHTML = "";

  // Find the PR for each user (by Twitter username)
  const userPRs = findUserPRs(data);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const todayEntries = data.filter(
    (entry) => entry.submittedAt.split(" ")[0] === today
  );

  // Sort by most pushups
  todayEntries.sort((a, b) => b.pushups - a.pushups);

  todayEntries.forEach((entry, index) => {
    const tr = document.createElement("tr");

    const usernameTd = document.createElement("td");
    const usernameLink = document.createElement("a");
    const twitterUsername = extractTwitterUsername(entry.proofLink);

    // For top 3, add medal emojis, for others add placement number
    if (index < 3) {
      const medal =
        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
      usernameLink.textContent = `${medal} ${twitterUsername}`;
    } else {
      const placeNumber = document.createElement("span");
      placeNumber.classList.add("placement-number");
      placeNumber.textContent = `${index + 1}.`; // Add place number for users after top 3
      usernameTd.appendChild(placeNumber);
      usernameLink.textContent = ` ${twitterUsername}`; // Add username next to placement
    }
    usernameLink.href = `https://twitter.com/${twitterUsername.replace(
      "@",
      ""
    )}`;
    usernameLink.target = "_blank";
    usernameTd.appendChild(usernameLink);
    usernameTd.classList.add("username");
    tr.appendChild(usernameTd);

    const pushupsTd = document.createElement("td");
    pushupsTd.textContent = entry.pushups;
    pushupsTd.classList.add("pushups");

    // Add PR badge if this is their personal record (highest pushup count ever)
    if (entry.pushups === userPRs[twitterUsername]) {
      const prBadge = document.createElement("span");
      prBadge.classList.add("pr-badge");
      prBadge.textContent = "PR";
      pushupsTd.appendChild(prBadge);
    }

    tr.appendChild(pushupsTd);

    const proofTd = document.createElement("td");
    const proofLinkElement = document.createElement("a");
    proofLinkElement.href = entry.proofLink;
    proofLinkElement.textContent = "watch vid 🎬"; // Change "proof" to "watch vid"
    proofLinkElement.target = "_blank";
    proofTd.appendChild(proofLinkElement);
    proofTd.classList.add("proof");
    tr.appendChild(proofTd);

    leaderboard.appendChild(tr);
  });
}

// Fetch data on page load
fetchPushupData();
startCountdownToMidnight();

// Button to add pushups
document.getElementById("add-pushups-btn").addEventListener("click", () => {
  window.open("https://tally.so/r/waEgxX", "_blank");
});
