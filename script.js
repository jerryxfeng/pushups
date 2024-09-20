// URL of your published Google Sheet CSV
const csvUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTAhxSgkKqKMBBh--ANLq5BborX1XRoW1GVsLp2G6di80-ectAgXmcRJzn9K-rhJyR2TuIQuD-EDu_i/pub?output=csv";

// Function to fetch CSV data and parse it
async function fetchPushupData() {
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    const data = parseCSV(csvText);
    animatePushupCounter(data);
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
      submittedAt: new Date(submittedAt), // Parse date
      pushups: parseInt(pushups) || 0,
      proofLink,
    };
  });
}

// Extract Twitter username from the proof link
function extractTwitterUsername(proofLink) {
  const urlParts = proofLink.split("/");
  return `@${urlParts[3]}`;
}

// Get the date 24 hours ago
function getYesterdayDate() {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now;
}

// Update the leaderboard to show the four columns with formatting
function updateLeaderboard(data) {
  const leaderboard = document.getElementById("leaderboard-list");
  leaderboard.innerHTML = "";

  const userStats = {};

  data.forEach((entry) => {
    const twitterUsername = extractTwitterUsername(entry.proofLink);

    if (!userStats[twitterUsername]) {
      userStats[twitterUsername] = {
        allTime: 0,
        personalBest: 0,
        personalBestLink: "",
        today: 0,
        todayLink: "",
        latestSubmissionDate: null,
      };
    }

    userStats[twitterUsername].allTime += entry.pushups;

    if (entry.pushups > userStats[twitterUsername].personalBest) {
      userStats[twitterUsername].personalBest = entry.pushups;
      userStats[twitterUsername].personalBestLink = entry.proofLink;
    }

    const yesterday = getYesterdayDate();
    if (entry.submittedAt > yesterday) {
      if (entry.submittedAt > userStats[twitterUsername].latestSubmissionDate) {
        userStats[twitterUsername].today = entry.pushups;
        userStats[twitterUsername].todayLink = entry.proofLink;
        userStats[twitterUsername].latestSubmissionDate = entry.submittedAt;
      }
    }
  });

  const sortedUsers = Object.keys(userStats).sort(
    (a, b) => userStats[b].allTime - userStats[a].allTime
  );

  sortedUsers.forEach((username, index) => {
    const tr = document.createElement("tr");

    // Username column with emojis and rank
    const usernameTd = document.createElement("td");
    const usernameLink = document.createElement("a");
    usernameLink.textContent = username;
    usernameLink.href = `https://twitter.com/${username.replace("@", "")}`;
    usernameLink.target = "_blank";

    // Add emoji for top 3 users
    if (index < 3) {
      const medal =
        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
      usernameTd.innerHTML = `${medal} `;
    } else if (index === sortedUsers.length - 1) {
      // If this is the last user, display 💩 emoji instead of a rank number
      usernameTd.innerHTML = `💩 `;
    } else {
      // For all other users, display their rank number
      const placeNumber = document.createElement("span");
      placeNumber.classList.add("placement-number");
      placeNumber.textContent = `${index + 1}.`;
      usernameTd.appendChild(placeNumber);
    }

    usernameTd.appendChild(usernameLink);
    usernameTd.classList.add("username");
    usernameTd.style.textAlign = "left"; // Align usernames to the left
    tr.appendChild(usernameTd);

    // All time pushups column
    const allTimeTd = document.createElement("td");
    allTimeTd.textContent = userStats[username].allTime;
    tr.appendChild(allTimeTd);

    // Personal best (PB) column
    const pbTd = document.createElement("td");
    const pbLink = document.createElement("a");
    pbLink.textContent = userStats[username].personalBest;
    pbLink.href = userStats[username].personalBestLink;
    pbLink.target = "_blank";
    pbTd.appendChild(pbLink);
    tr.appendChild(pbTd);

    // Today's pushups column
    const todayTd = document.createElement("td");
    if (userStats[username].today > 0) {
      const todayLink = document.createElement("a");
      todayLink.textContent = userStats[username].today;
      todayLink.href = userStats[username].todayLink;
      todayLink.target = "_blank";
      todayTd.appendChild(todayLink);
    } else {
      todayTd.textContent = "-"; // Show a dash if no pushups were submitted today
    }
    tr.appendChild(todayTd);

    // Append the row to the leaderboard
    leaderboard.appendChild(tr);
  });
}

// Animate pushup counter
function animatePushupCounter(data) {
  const totalPushups = data.reduce((total, entry) => total + entry.pushups, 0);
  const counterElement = document.getElementById("pushup-counter");
  let count = 0;
  const increment = totalPushups / 100;

  const counterInterval = setInterval(() => {
    count += increment;
    counterElement.textContent = Math.floor(count);
    if (count >= totalPushups) {
      clearInterval(counterInterval);
      counterElement.textContent = totalPushups;
    }
  }, 20);
}

// Fetch data on page load
fetchPushupData();

// Button to add pushups
document.getElementById("add-pushups-btn").addEventListener("click", () => {
  window.open("https://tally.so/r/waEgxX", "_blank");
});
