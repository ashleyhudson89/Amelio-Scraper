chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeJobs") {
    const elements = document.querySelectorAll("div.jobsearch-SerpJobCard, div.job_seen_beacon, li.result, article, div.jobs-search__results-list > ul > li");

    const jobs = Array.from(elements).map(el => ({
      html: el.innerText.trim().slice(0, 2000)
    }));

    sendResponse({ jobs });
  }
});
