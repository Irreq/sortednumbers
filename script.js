let timelineData = []; // Declare the timelineData variable

const maxVisibleItems = 8;

const container = document.querySelector(".timeline-container");
const timeline = document.querySelector(".timeline");

let scrollPosition = 0; // Tracks the scroll offset
function renderTimeline() {
  const buffer = 5; // Number of items to render above and below the visible range
  const start = Math.max(0, Math.floor(scrollPosition / 100) - buffer); // Start with buffer
  const end = Math.min(start + maxVisibleItems + 2 * buffer, timelineData.length); // End with buffer

  const existingItems = Array.from(document.querySelectorAll(".timeline-item"));

  // Remove items that are far outside the visible range (beyond buffer)
  existingItems.forEach((item) => {
    const itemIndex = parseInt(item.dataset.index, 10); // Get index from dataset
    if (itemIndex < start || itemIndex >= end) {
      item.remove(); // Remove item from DOM
    }
  });

  // Add new items for the buffered visible range
  for (let i = start; i < end; i++) {
    // Check if item already exists in the DOM
    const existingItem = document.querySelector(`.timeline-item[data-index="${i}"]`);
    if (existingItem) {
      // Update position of the existing item
      const offset = i - Math.floor(scrollPosition / 100);
      const position =
        offset * (100 / maxVisibleItems) -
        (scrollPosition % 100) / maxVisibleItems;
      existingItem.style.top = `${position}%`;

      // Ensure visibility
      if (position < -buffer * 100 / maxVisibleItems || position > 100 + buffer * 100 / maxVisibleItems) {
        existingItem.classList.add("hidden");
      } else {
        existingItem.classList.remove("hidden");
      }
      continue;
    }

    // If item doesn't exist, create it
    const offset = i - Math.floor(scrollPosition / 100);
    const position =
      offset * (100 / maxVisibleItems) -
      (scrollPosition % 100) / maxVisibleItems;

    const timelineItem = document.createElement("div");
    timelineItem.className = "timeline-item";
    timelineItem.style.top = `${position}%`;
    timelineItem.dataset.index = i; // Store index for tracking

    // Fade items out when near edges of the visible range
    if (
      position < -buffer * 100 / maxVisibleItems ||
      position > 100 + buffer * 100 / maxVisibleItems
    ) {
      timelineItem.classList.add("hidden");
    }

    const data = timelineData[i];
    const symbol = data.symbol || ""; // Fallback if symbol is undefined

    timelineItem.innerHTML = `
            <div class="number">${data.number}</div>
            <div class="line"></div>
            <div class="about">
              <h2>${symbol}</h2>
              <p>${data.description}</p>
            </div>
        `;

    timeline.appendChild(timelineItem);
  }

  // Trigger MathJax rendering only for new items
  MathJax.Hub.Queue(["Typeset", MathJax.Hub, timeline]);
}


function handleScroll(event) {
  const delta = event.deltaY; // Raw scroll value
  const step = 70; // Adjust the speed of scrolling
  scrollPosition += delta > 0 ? step : -step;

  // Clamp scroll position to keep it within the data range
  scrollPosition = Math.max(
    0,
    Math.min(scrollPosition, (timelineData.length - maxVisibleItems) * 100),
  );

  renderTimeline();
}

function findClosestIndex(sortedList, target) {
  let low = 0;
  let high = sortedList.length - 1;

  while (low < high) {
    let mid = Math.floor((low + high) / 2);

    if (sortedList[mid] === target) {
      return mid; // Exact match found
    }

    if (sortedList[mid] < target) {
      low = mid + 1; // Narrow search to the right
    } else {
      high = mid; // Narrow search to the left
    }
  }

  // After the loop, `low` is the closest index (or nearest higher)
  // Compare low with its previous neighbor to find the closer one
  if (
    low > 0 &&
    Math.abs(sortedList[low - 1] - target) < Math.abs(sortedList[low] - target)
  ) {
    return low - 1;
  }

  return low;
}

let searchNumbers = [];

// Filter math expressions based on search input
function filterNumbers() {
  const query = document.getElementById("search-input").value.toLowerCase();
  scrollPosition = findClosestIndex(searchNumbers, query) * 100;
  renderTimeline();
}

document.addEventListener("DOMContentLoaded", function () {
  // Fetch the JSON file
  fetch("numbers.json") // Ensure the path is correct based on the file structure
    .then((response) => response.json())
    .then((data) => {
      data.sort((a, b) => a.number - b.number);
      searchNumbers = data.map((item) => item.number);
      scrollPosition = findClosestIndex(searchNumbers, 1) * 100;
      timelineData = data; // Store the fetched JSON data in timelineData
      console.log(timelineData); // Check the data in the console
      renderTimeline(); // Call the function to render the timeline
      const heading = document.querySelector("h2.n_sorted"); // Select the <h2> with class "n_sorted"
      heading.textContent = `${data.length} ${heading.textContent}`; 
      window.addEventListener("wheel", handleScroll);
    })
    .catch((error) => {
      console.error("Error loading JSON data:", error);
    });
});
