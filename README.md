# Tomorrow Weather Planner

A free local AI weather agent that creates a focused forecast for tomorrow:

- Morning commute weather: 7 AM–9 AM
- College-day weather summary: 9 AM–5 PM
- Evening commute weather: 5 PM–7 PM
- Suggestions for what to wear, including whether to take an umbrella

It uses:

- [Ollama](https://ollama.com/) to run a local AI model
- [Qwen 2.5](https://ollama.com/library/qwen2.5) as the model
- [Open-Meteo](https://open-meteo.com/) for free weather data
- Windows Task Scheduler to run automatically every evening
- Google Drive for Desktop to save and sync forecasts

## Requirements

- Node.js
- Ollama for Windows
- Google Drive for Desktop (optional, for phone access)
- A Qwen model downloaded through Ollama

## Installation

1. Clone the repository:

   ```powershell
   git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   cd my-agent

2. Install the Node.js dependency:
    npm install

3. Install Ollama from [https://ollama.com/download](https://ollama.com/download).

4. Download the local model: ollama pull qwen2.5:3b

5. In `tomorrow-weather.mjs`, change the city: const CITY = "London";

6. Run the weather planner: node .\agent.mjs
The program fetches tomorrow's forecast and uses the local AI model to produce a short commute, college-day, and clothing report.

## Save reports to Google Drive
Install Google Drive for Desktop, then change the output path in `run-tomorrow-weather.cmd` to a folder inside your Google Drive:
node tomorrow-weather.mjs > "C:\Users\YOUR-USERNAME\My Drive\Weather Planner\weather-%TOMORROW%.txt"
A new report will be saved with tomorrow's date, for example: weather-2026-09-16.txt
Google Drive syncs the report so it can be opened on a phone.

## Schedule it for 7 PM every day
Run this in PowerShell from the project folder:
  schtasks /create /tn "Tomorrow Weather Planner" /tr "`"$PWD\run-tomorrow-weather.cmd`"" /sc daily /st 19:00 /f
Check the task:
  schtasks /query /tn "Tomorrow Weather Planner" /v /fo list

In Task Scheduler, enable:
"Run task as soon as possible after a scheduled start is missed"
This lets the task run later if the computer was asleep at 7 PM.

## Project files
| File | Purpose |
| --- | --- |
| `tomorrow-weather.mjs` | Fetches weather data and creates the AI forecast |
| `agent.mjs` | Original basic weather-agent example |
| `run-tomorrow-weather.cmd` | Runs the planner and saves the report |
| `.gitignore` | Prevents dependencies and generated reports from being uploaded |

## Notes
- The program needs an internet connection to fetch weather data.
- Ollama runs the AI model locally, so no paid AI API key is required.
- The first Ollama model download is approximately 2 GB.
- Generated reports and `node_modules` should remain ignored by Git.
