document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ action: "getScrapedJobs" }, (response) => {
    const jobList = document.getElementById("jobList");
    jobList.innerHTML = "";

    if (!response || !response.jobs || response.jobs.length === 0) {
      jobList.innerText = "No jobs found.";
      return;
    }

    jobList.insertAdjacentHTML('afterbegin', `<div>✅ Scraped ${response.jobs.length} jobs from this page</div>`);

    response.jobs.forEach((job, index) => {
      const div = document.createElement("div");
      div.className = "job-card";
      div.innerHTML = `
        <input type="checkbox" id="check-${index}" checked />
        <input type="text" id="title-${index}" value="${job.title}" placeholder="Job Title" />
        <input type="text" id="company-${index}" value="${job.company}" placeholder="Company Name" />
        <input type="text" id="type-${index}" value="${job.type}" placeholder="Job Type (e.g. Developer)" />
      `;
      jobList.appendChild(div);
    });

    document.getElementById("pushButton").addEventListener("click", () => {
      const selectedJobs = response.jobs
        .map((_, i) => ({
          selected: document.getElementById(`check-${i}`).checked,
          title: document.getElementById(`title-${i}`).value,
          company: document.getElementById(`company-${i}`).value,
          type: document.getElementById(`type-${i}`).value
        }))
        .filter(j => j.selected);

      chrome.runtime.sendMessage({ action: "pushJobs", jobs: selectedJobs }, (res) => {
        alert(res.success ? "Jobs pushed successfully!" : `Error: ${res.error || 'unknown error'}`);
      });
    });
  });
});
