# 8.Problems fixing

[← Back to contents](./README.md)

## 8.1 Quick table

| Problem | Check | Recommended action |
|---|---|---|
| Unable to log in | Django connection message | Confirm that the backend is running and try again. |
| Invalid credentials | Role, email, and password | Choose the correct card and use recovery if you don't remember the password. |
| 2FA code rejected | Phone time and code valid | Wait for a new code and check that the clock is set to automatic. |
| Empty screen | Active filters or no data | Clear filters, update records, and check the database. |
| A button does not appear | Previous role or session | Log out, log back in, and confirm permissions with the administrator. |
| A change is not reflected in other stations | Synchronization or saving | Confirm saving using an explicit button and check the connection to the backend. |
| Drive does not connect | OAuth or return URI | Reauthorize and request configuration review from the technical lead. |
| Make is not responding | Webhook URL | Check format, availability, and active scenario. |
| APS/Revit does not load | Credentials, format, or processing | Wait for the translation and check the status message. |
| Backup failure | PostgreSQL and tools | Escalate to the database manager; do not repeat blind restores. |

## 8.2 Information to be sent to support

When requesting help, please include:

1. module where the problem occurred;
2. button pressed;
3. approximate date and time;
4. account role, without sending a password;
5. full message displayed;
6. if the problem persists after updating;
7. A screenshot where no credentials or sensitive information appear.

## 8.3 Actions you should not take

- Do not share passwords, 2FA codes, tokens, or `.env` files.
- Do not delete projects or files to “test” a solution.
- Do not restore a database without authorization and prior backup.
- Do not run `seed_data --clear` on a database with information that needs to be retained.
- Do not modify administrative permissions from the database without an approved procedure.

## 8.4 Escalation

- **Usage Issue:** System Administrator.
- **Account or permissions:** Administrator or Super Administrator.
- **Database and backups:** Responsible for PostgreSQL.
- **Drive, Make, APS, or email:** Responsible for integrations.
- **Recurring system error:** Development team, attaching previous diagnostic data.

## 8.5 Control of the manual

If a button changes its name or a flow no longer matches:

1. note the path and the affected action;
2. compare with the deployed version;
3. update the Markdown first;
4. Validate the procedure with each role;
5. replace the capture;
6. Record the date and verified commit;
7. Regenerate the PDF only after completing the review.

