// URL of your published Google Sheet CSV
const csvUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTAhxSgkKqKMBBh--ANLq5BborX1XRoW1GVsLp2G6di80-ectAgXmcRJzn9K-rhJyR2TuIQuD-EDu_i/pub?output=csv";

// Function to fetch CSV data and parse it
async function fetchPushupData() {
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    const data = parseCSV(csvText);
    updatePushupCounter(data);
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

// Extract Twitter username from the proof link
function extractTwitterUsername(proofLink) {
  const urlParts = proofLink.split("/");
  return `@${urlParts[3]}`;
}

// Update the main pushup counter (cumulative total)
function updatePushupCounter(data) {
  const totalPushups = data.reduce((total, entry) => total + entry.pushups, 0);
  document.getElementById("pushup-counter").textContent = totalPushups;
}

// Update the leaderboard to show each submission separately
function updateLeaderboard(data) {
  const leaderboard = document.getElementById("leaderboard-list");
  leaderboard.innerHTML = ""; // Clear existing list

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Filter today's pushups and display each submission separately
  const todayEntries = data.filter(
    (entry) => entry.submittedAt.split(" ")[0] === today
  );

  // Sort by most pushups (optional, you can remove if needed)
  todayEntries.sort((a, b) => b.pushups - a.pushups);

  // Display each submission in the leaderboard
  todayEntries.forEach((entry) => {
    const tr = document.createElement("tr");

    // Twitter Username
    const usernameTd = document.createElement("td");
    const usernameLink = document.createElement("a");
    const twitterUsername = extractTwitterUsername(entry.proofLink);
    usernameLink.href = `https://twitter.com/${twitterUsername.replace(
      "@",
      ""
    )}`;
    usernameLink.textContent = twitterUsername;
    usernameLink.target = "_blank";
    usernameTd.appendChild(usernameLink);
    tr.appendChild(usernameTd);

    // Pushups
    const pushupsTd = document.createElement("td");
    pushupsTd.textContent = entry.pushups;
    tr.appendChild(pushupsTd);

    // Proof
    const proofTd = document.createElement("td");
    const proofLinkElement = document.createElement("a");
    proofLinkElement.href = entry.proofLink;
    proofLinkElement.textContent = "proof";
    proofLinkElement.target = "_blank";
    proofTd.appendChild(proofLinkElement);
    tr.appendChild(proofTd);

    leaderboard.appendChild(tr);
  });
}

// Fetch data on page load
fetchPushupData();

// Button to add pushups (open the form in a new tab)
document.getElementById("add-pushups-btn").addEventListener("click", () => {
  window.open("https://tally.so/r/waEgxX", "_blank");
});
