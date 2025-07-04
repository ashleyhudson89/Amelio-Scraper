let scrapedJobs = [];
let openaiKey = null;

// Load OpenAI key from local storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["openaiKey"], (data) => {
    openaiKey = data.openaiKey;
  });
});

// Listen for popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getScrapedJobs") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "scrapeJobs" }, async (response) => {
        if (!response || !response.jobs) {
          sendResponse({ jobs: [] });
          return;
        }

        const jobs = await Promise.all(response.jobs.map(async job => {
          try {
            const result = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": "Bearer " + openaiKey,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: "gpt-4",
                messages: [
                  {
                    role: "system",
                    content: "Extract the job title, company name, and job type from this job description. Respond in format: Title: ..., Company: ..., Type: ..."
                  },
                  {
                    role: "user",
                    content: job.html
                  }
                ],
                temperature: 0.2
              })
            });
            const data = await result.json();
            const msg = data.choices[0].message.content;
            const [title, company, type] = msg.split('\\n').map(line => line.replace(/^.*?:\\s*/, ''));
            return { title, company, type };
          } catch (err) {
            return { title: "", company: "", type: "" };
          }
        }));

        scrapedJobs = jobs;
        sendResponse({ jobs });
      });
    });
    return true;
  }

  if (request.action === "pushJobs") {
    console.log("Would push to Salesforce:", request.jobs);
    // Add real Salesforce push logic here using fetch + access token
    sendResponse({ success: true });
  }
});
