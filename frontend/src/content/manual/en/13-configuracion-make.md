# 13. Automations and Integration with Make

[← Back to Index](./README.md)

---

## How Automations Work

Project Planner dispatches real-time automated notifications to external communication channels (such as corporate email, Discord, or Slack) to keep the team aligned without manual messaging.

The platform emits notices across 4 fundamental project lifecycle events:

1. **Project Creation (`project.created`):**  
   Fires when a new project is saved in the Portfolio. Transmits code, title, budget, dates, and the assigned lead engineer.
2. **Leader Assignment or Change (`project.leader_assigned`):**  
   Immediately notifies the engineer or architect designated as project leader regarding their new coordination duties.
3. **Work Order Dispatch (`task.assigned`):**  
   Notifies the assigned technical specialist when an activity is issued, communicating title, priority, estimated hours, and deadline.
4. **$100k Budget Governance Alert (`governance.budget_alert`):**  
   Mandatory preventive alert triggered whenever a project meets or exceeds $100,000 USD in capital investment for Steering Committee review.

---

## 13.1 Configure the Automation Link in Project Planner

**Available for:** Administrator only.

1. In the sidebar, navigate to **Integrations** (`Shift + 7`).
2. On the **Make** card, click the **[Configure Webhook]** button.
3. Paste the URL endpoint generated in your Make.com scenario.
4. Toggle on the switches for events you wish to dispatch automatically.
5. Click **[Save]**.

**Expected result:** the card records the endpoint and displays the **Connected** badge.

---

## 13.2 Verify Connection with Make

**Available for:** Administrator only.

1. On the **Make** card, click the **[Test Connection]** button.
2. The platform sends a diagnostic health signal to Make.
3. A confirmation message appears confirming that the connection responded successfully.

**If it doesn't work:** verify that the pasted URL has no trailing spaces and that your Make.com scenario is turned **ON**.

---

## 13.3 Connect Destination Channels in Make.com

**Available for:** Administrators or automation flow managers.

1. In your **Make.com** account, open the scenario linked to the Project Planner webhook.
2. Add your desired downstream module:
   - **Email (Gmail or Microsoft 365):** To send formatted summaries directly to lead engineers' inboxes.
   - **Discord or Slack:** To broadcast real-time alerts into dedicated project channels.
3. Map payload fields (project code, title, assigned specialist, or budget).
4. Save and activate the scenario in **ON** mode.
