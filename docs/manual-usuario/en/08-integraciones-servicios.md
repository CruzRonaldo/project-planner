# 8. External Cloud Integrations and Services

[← Back to Index](./README.md)

---

## Screen Spaces and Service Connectors

The **Integraciones** module centralizes communication with external cloud platforms and tools extending Project Planner's capabilities:

- **1. Make (Integromat) Connector — Administrator Only:**
  - **Status Indicator:** Shows *Connected* (in green) or *Disconnected* (in gray).
  - **Primary Webhook URL:** Webhook endpoint listening for platform signals.
  - **Sync Frequency:** Schedule selector (e.g., *Every 15 min*, *Every 30 min*, *Real-time*).
  - **Task Toggle Switches:** Enable or pause tasks individually:
    - *Two-Factor Authentication (2FA):* Delivery of temporary security codes.
    - *Notifications & Assignments:* Immediate alerts to Discord or corporate email upon new projects or work orders.
    - *Budget Governance ($100k):* Automated alert triggered when a project meets or exceeds $100,000 USD.
  - **[Test Connection] Button:** Sends a diagnostic health check to confirm the webhook is listening.

- **2. Google Drive Connector:**
  - Displays connection state and the email of the linked corporate Google account.
  - **[Connect Google Drive] Button:** Launches secure OAuth authorization with Google.
  - **[Test Connection] Button:** Verifies in real time that cloud storage access remains valid.

- **3. Autodesk APS / Revit 3D Viewer:**
  - Embedded browser viewer allowing inspection of architectural, structural, and MEP models in IFC and Revit (`.rvt`) formats without desktop CAD software.
  - **Visualization Tools:**
    - Interactive 3D orbit and rotation with mouse.
    - Cross-section cut tool to inspect internal slabs and structural columns.
    - Layer visibility filters to isolate structural framing, architectural walls, or MEP ducts.

![Integrations Panel](../../assets/manual/09-integraciones-servicios.png)
*Figure 8.1: Active integrations panel displaying Make, Google Drive, and Autodesk Revit.*

---

## 8.1 Check General Integrations Status

**Available for:** Administrator and Subadministrator.

1. In the sidebar, select **“Integrations”** (`Shift + 7`).
2. Review cards to verify whether services are marked as **Connected** (green) or **Disconnected** (gray).
3. Check the reported last synchronization timestamp on each card.

---

## 8.2 Connect Google Drive with the Platform

**Available for:** Administrator and Subadministrator.

1. On the **Google Drive** card, click the **[Connect Google Drive]** button.
2. In the browser popup window, sign in with your corporate Google account and grant permissions.
3. Return to Project Planner and click the **[Test Connection]** button.

**Expected result:** the card updates status to **Connected** and displays the authorized email address.

---

## 8.3 Configure Make Webhook and Toggle Automated Tasks

**Available for:** Administrator only.

1. On the **Make** card, click **[Configure Webhook]**.
2. Paste the URL endpoint generated in your Make.com scenario.
3. Toggle on the switches for tasks you wish to enable (*2FA*, *Notifications*, *Budget Governance*).
4. Click **[Save]**.
5. Click **[Test Connection]** to ensure the platform receives a successful response.

**Expected result:** the platform confirms that the webhook responded successfully.

---

## 8.4 Explore a 3D Model in the Revit Viewer

**Available for:** all roles.

1. Navigate to the technical sheet of a project that has a 3D model linked.
2. Click the **3D Viewer** button.
3. Use your mouse to rotate, pan, and zoom into the structure.
4. Use the layers side panel to toggle visibility of specific components (e.g., viewing only structural framing).
