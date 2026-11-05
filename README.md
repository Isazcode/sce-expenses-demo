# SCE Expense Reports · demo

A clickable demo of the new expense report flow for Snapper Creek Energy. It uses made-up sample data, and nothing is sent or saved.

**How to try it**

1. Open the demo. A sample card statement is already loaded for a made-up employee, with business and personal charges marked.
2. Open **sample receipts** (the link in the yellow banner) and drag the images into the **Receipts** box. Each one is read and attached to the matching charge.
3. Press **Submit to Danna**. The demo shows the email Danna would get and the SharePoint folder that would be created.
4. **Download a copy (.xlsx)** opens the Excel report in Danna's format.

**What changes in the real app**

- People sign in with their SCE Microsoft account, and their name comes from that account.
- Submitting saves the report and receipts to `Reimbursements/<year>/<M.YYYY>/<F. Last M.D>/` in the Finance SharePoint site and emails Danna.
- Receipt reading uses Azure AI Document Intelligence. In the demo, reading is simulated for the four sample receipts.
