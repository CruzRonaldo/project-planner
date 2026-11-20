# 2. Dashboard and Strategic Planning

[← Back to contents](./README.md)

## 2.1 Check the Dashboard

**Available for:** All roles.

1. Tap **“Home”** in the side menu.
2. Review the scorecards: active projects, pending milestones, budget, and optimization.
3. Refer to the summary project schedule.
4. Review alerts, progress, and budget allocation when data is available.
5. Use the search bar at the top to find a project or milestone.

**Expected result:** The indicators are calculated using the information available in the portfolio.

If the Dashboard appears empty, open **Portfolio** and confirm that there are registered projects. It may also be because the backend is still loading.

![Dashboard and Metrics](../assets/manual/02-dashboard-kpis-gantt.png)
*Figure 2.1: Dashboard with executive KPI cards and semi-annual Mini-Gantt.*

## 2.2 Check the Master Calendar

**Available to:** All roles. Technical accounts have primarily read-only access.

1. Press **“Strategic Planning”**.
2. In **“Filter by project”**, select a project or leave the general option.
3. Select the role you want to consult
4. Read the Gantt bars to identify start, duration, and continuity.
5. Review **Global Milestones**, statuses, and dates.
6. Refer to the readjustment history when available.

**Expected result:** The timeline shows only the projects that match the filters.

## 2.3 Adjusting a project schedule

**Available to:** Administrator and Sub-administrator.

1. Tap **"Adjust Calendar"**.
2. Select the project to be rescheduled.
3. Select the start month.
4. Adjust the total duration.
5. Select or enter the reason for the readjustment.
6. Review the preview.
7. Tap **“Save settings”**.

**Expected result:** The project bar changes and the movement is recorded in the readjustment history.

**If it doesn't work:** Confirm that the project exists in the database, that the duration is valid, and that the account has management permissions.

![Schedule Adjustment Dialog](../assets/manual/03-ajustar-calendario-modal.png)
*Figure 2.2: Schedule Adjustment Modal with selection of project, duration, and reason for mandatory audit.*

## 2.4 Optimization engine and time analysis

**Available to:** Administrator and Sub-administrator.

### Procedure operativo
1. At the top of Scheduling, press **“Analyze times”**.
2. Select the project you want to evaluate.
3. The system loads the tasks, predecessor dependencies, and assigned technical personnel.
4. Press **“Calculate proposal”**.
5. Review the comparative table with the results of the algorithmic analysis:
   - **Saved deadline:** Original duration of the project in calendar days.
   - **Proposed deadline:** New duration calculated considering the critical path and actual availability.
   - **Margin relative to the saved deadline (days gained):** Net time by which the project can be shortened.
   - **Exceedance of the saved time frame:** Days of delay in the event of bottlenecks due to over-assignment of technicians.
   - **Minimum by unit:** Theoretical minimum number without staffing conflicts.
   - **Slack:** The number of days that a task can be delayed without postponing the final delivery.
   - **Additional wait time due to resource:** Days of delay caused by the specialist handling multiple tasks simultaneously.

### Internal calculations and mathematical logic of the engine
Project Planner implements a deterministic algorithmic engine based on three project engineering standards:

1. **Critical Path Method (CPM):**
   - Build a Directed Acyclic Graph (DAG) and perform a topological sort to ensure the absence of circular dependencies.
   - Perform a forward pass to obtain the earliest start and finish (Early Start / Early Finish) and a backward pass to calculate the latest start and finish (Late Start / Late Finish).
   - Calculate the **total slack**:
     $$\text{Holgura (Slack)} = \text{Inicio Tardío} - \text{Inicio Temprano}$$
   - Tasks with $\text{Holgura} = 0$ make up the **Critical Path** (`is_critical_path = True`). Only by speeding up these tasks can the project's delivery time be reduced.

2. **Weighting by Actual Staff Availability:**
   - The theoretical duration of each task is adjusted according to the actual time spent by the assigned technician (80%, 60%, etc.):
     $$\text{Duración Efectiva (días)} = \left\lceil \text{Duración Base} \times \frac{100}{\text{Disponibilidad (\%)}}\right\rceil$$

3. **Resource Leveling and Conflict Resolution (RCPSP):**
   - If the same specialist is assigned to several critical tasks on overlapping dates, the engine schedules sequential intervals and quantifies the **Additional Wait for Resource** (`resource_delay_days`).

4. **Compression and 7-Day Safety Margin:**
   - For construction tasks with specific outputs ($m^2/\text{día}$, reinforced crews), the acceleration factor is calculated as follows:
     $$\text{Días Ahorrados} = \text{round}\left(\frac{\text{Duración Original}}{5}\right)$$
   - The system always maintains a **7-day technical buffer** to absorb weather-related contingencies, inspections, or supplier delays.

5. **Budget Governance Rule ($100,000 USD):**
   - If the cost of the optimized project is **$\le \$$100,000 USD**, approval falls to the Technical Lead.
   - If the budget exceeds **$\$$100,000 USD**, the system automatically activates the governance rule: it requires approval from the **Steering Committee** and sends an automatic webhook to Make to send an alert in the Discord channel and by company email.

## 2.5 Create a Global Milestone

**Available to:** Administrator and Sub-administrator.

1. Press **“New Global Milestone”**.
2. Select the associated project.
3. Select the initial status.
4. Enter the name of the milestone or critical deliverable.
5. Please indicate the deadline.
6. Select the person responsible for validation if the form so requests.
7. Enter the description or deliverables.
8. Press **“Record Global Milestone”**.

**Expected result:** The milestone appears in the Global Milestones section.

## 2.6 Changing or deleting a milestone

1. Locate the landmark.
2. To change it, open the status selector and choose the new status.
3. To view information, press the details button.
4. To delete it, tap the delete icon and confirm only if you are sure.

Deletion is not available for technical accounts.

## 2.7 Exporting the Gantt chart

1. First apply the project and year filters.
2. Press **“Export Gantt / PDF”**.
3. In the print window, select **Save as PDF**.
4. Check orientation, margins, and preview.
5. Save the file.

> **Recommended screenshots:** Header with the four administrative actions, filtered Gantt chart, milestone creation, and status selector.

