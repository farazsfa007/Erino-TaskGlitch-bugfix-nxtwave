# 🚀 TaskGlitch - Fixed & Optimized

This repository contains the fixed version of the **Task Management Web App**. The original application contained several hidden bugs affecting performance, UI stability, and logic. All 5 mandatory bugs have been resolved, along with an additional security improvement.

**🔗 Live Demo:** [Insert your Vercel/Netlify link here]

---

## 🛠️ Bug Fixes Report

### ✅ Bug 1: Double Fetch Issue (API called twice)
* **The Issue:** The task list was loading twice on page refresh due to `React.StrictMode` invoking effects double-time and a secondary "opportunistic" fetch in the code.
* **The Fix:** * Implemented a `useRef` (`fetchedRef`) tracking mechanism in the `useTasks` hook to ensure the initial data fetch only runs once per session.
    * Removed the redundant `setTimeout` fetch that was injecting duplicate data.

### ✅ Bug 2: Undo Snackbar Logic
* **The Issue:** Closing the "Undo Delete" snackbar did not clear the deleted task from memory. This allowed users to accidentally "restore" a task that should have been permanently deleted later.
* **The Fix:** * Added a `clearLastDeleted` function to the state manager.
    * Connected this function to the Snackbar's `onClose` event in `App.tsx`, ensuring the temporary undo state is wiped immediately when the notification disappears.

### ✅ Bug 3: Unstable Sorting (Jittery UI)
* **The Issue:** Tasks with identical ROI and Priority were jumping around randomly on every re-render because the sort function used `Math.random()` as a tie-breaker.
* **The Fix:** * Removed the random logic.
    * Implemented a **deterministic tie-breaker** using the task's `createdAt` timestamp. Now, if ROI and Priority are equal, older tasks consistently appear first.

### ✅ Bug 4: Double Dialog Trigger (Event Bubbling)
* **The Issue:** Clicking the "Edit" or "Delete" buttons triggered the specific action *plus* the "View Details" dialog because the click event bubbled up to the parent row.
* **The Fix:** * Added `e.stopPropagation()` to the `onClick` handlers for both the Edit and Delete buttons in `TaskTable.tsx`. This isolates the button clicks from the row click.

### ✅ Bug 5: ROI Calculation Errors (Infinity / NaN)
* **The Issue:** Entering `0` for "Time Taken" caused a division-by-zero error (`Infinity`), and empty inputs caused `NaN` values, breaking the metrics display.
* **The Fix:** * Added input validation in `logic.ts` (`computeROI`) to return `0` if time is zero or invalid.
    * Added safeguards in `useTasks.ts` to default `timeTaken` to `1` during data normalization and updates.

---

## 🛡️ Additional Improvements

### 🔒 Security Fix: XSS Vulnerability
* **The Issue:** The original code used `dangerouslySetInnerHTML` to render Task Notes. This exposed the application to **Cross-Site Scripting (XSS)** attacks if a user entered malicious scripts into the notes field.
* **The Fix:** Replaced `dangerouslySetInnerHTML` with standard React text rendering in `TaskTable.tsx`. Browsers now safely escape all text content.

---

## ⚙️ Tech Stack
* **Framework:** React (Vite)
* **Language:** TypeScript
* **UI Library:** Material UI (MUI)
* **State Management:** Context API + Custom Hooks

## 🏃‍♂️ How to Run Locally

1.  Clone the repository:
    ```bash
    git clone [https://github.com/yourusername/task-glitch-fixed.git](https://github.com/yourusername/task-glitch-fixed.git)
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the dev server:
    ```bash
    npm run dev
    ```
