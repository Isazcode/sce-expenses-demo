# SCE Expense Reports

**expenses.scebrokerage.com** is where SCE employees build and send expense reports.

1. Sign in with your SCE Microsoft account.
2. Import the card statement CSV, mark charges business or personal, and add a description and receipt to each one.
3. Press **Submit to Danna**. The app emails Danna **from your own Outlook**, with the Excel report (in her template) and every receipt attached. A copy stays in your Sent Items.
4. A Power Automate flow files the attachments in SharePoint under `Reimbursements/<year>/<M.YYYY>/<F. Last M.D>/`, in `Expense Reports` and `Receipts` folders.

A demo with made-up data is at [`/demo/`](demo/).

There's no server. The site is static files on GitHub Pages, and everything runs in the browser as the signed-in person. The app has only two permissions: read your own profile, and send mail as you. It has no SharePoint access.

```
index.html          the app
redirect.html       where Microsoft sends people back after sign-in
config.js           client id, tenant id, Danna's address, filing mailbox
vendor/             MSAL (Microsoft sign-in) and ExcelJS, kept in the repo instead of loaded from a CDN
demo/               the demo with sample data and sample receipts
```

---

## Setup

### 1. Register the app in Entra (5 min)

Entra admin center → **App registrations → New registration**

- **Name:** SCE Expense Reports
- **Supported account types:** Accounts in this organizational directory only
- **Redirect URI:** platform **Single-page application (SPA)**, value `https://expenses.scebrokerage.com/redirect.html`

After it's created:

- **Authentication → Single-page application:** add these redirect URIs too:
  - `https://expenses.scebrokerage.com/` (needed for sign-out)
  - `https://isazcode.github.io/sce-expenses-demo/redirect.html` (for testing before DNS is set up)
- **API permissions:** Microsoft Graph → Delegated → `User.Read` and `Mail.Send` → **Grant admin consent for SCE**. This means nobody sees a consent prompt.
- Optional: **Enterprise applications → SCE Expense Reports → Properties → Assignment required = Yes**, then assign your all-staff group.
- Copy the **Application (client) ID** and the **Directory (tenant) ID** into `config.js`.

### 2. Shared mailbox for filing (2 min)

Exchange admin center → **Recipients → Mailboxes → Add a shared mailbox**: `expenses@scebrokerage.com`. Give yourself Full Access. Every report is CC'd here, so it's also a complete record of what was submitted.

To skip filing, set `filingMailbox: ""` in `config.js`.

### 3. Custom domain (10 min, plus DNS time)

1. **GoDaddy → scebrokerage.com → DNS → Add record:** type `CNAME`, name `expenses`, value `isazcode.github.io`, TTL 1 hour.
2. Optional, recommended: protect the domain. In **GitHub → your profile Settings → Pages → Add a domain**, enter `scebrokerage.com`, then add the TXT record GitHub shows at GoDaddy and click Verify. This stops anyone else's GitHub repo from claiming an `scebrokerage.com` subdomain.
3. **Repo → Settings → Pages → Custom domain:** enter `expenses.scebrokerage.com` and Save. GitHub commits a `CNAME` file. When the DNS check passes, tick **Enforce HTTPS**. The certificate can take up to an hour.

> Do step 3 only after the GoDaddy record exists. Once the custom domain is set, the old `isazcode.github.io/sce-expenses-demo` link redirects to `expenses.scebrokerage.com`.

### 4. Power Automate flow that files reports in SharePoint (15 min)

Create an **Automated cloud flow** signed in as you (you need Full Access to `expenses@`).

**Trigger:** Office 365 Outlook → *When a new email arrives in a shared mailbox (V2)*
- Original Mailbox Address: `expenses@scebrokerage.com`
- Folder: Inbox
- Only with Attachments: Yes
- Include Attachments: Yes
- Subject Filter: `Expense report:`

**Action:** Office 365 Users → *Get user profile (V2)*
- User (UPN): `From` (dynamic content)

**Action:** Initialize variable **received** (String):
```
convertFromUtc(triggerOutputs()?['body/receivedDateTime'], 'Eastern Standard Time')
```

**Action:** Initialize variable **folder** (String). Replace `/Shared Documents` with your library's path as the SharePoint folder picker shows it:
```
concat('/Shared Documents/Reimbursements/',
  formatDateTime(variables('received'),'yyyy'), '/',
  formatDateTime(variables('received'),'M.yyyy'), '/',
  substring(outputs('Get_user_profile_(V2)')?['body/displayName'],0,1), '. ',
  last(split(trim(outputs('Get_user_profile_(V2)')?['body/displayName']),' ')), ' ',
  formatDateTime(variables('received'),'M.d'))
```
For Miguel Guerrero on Nov 5, 2026, this gives `/Shared Documents/Reimbursements/2026/11.2026/M. Guerrero 11.5`.

**Action:** *Apply to each* over `Attachments` (from the trigger), containing a **Condition**:
```
endsWith(toLower(items('Apply_to_each')?['name']), '.xlsx')
```
- **If yes:** SharePoint → *Create file*
  - Site Address: your site
  - Folder Path: `concat(variables('folder'),'/Expense Reports')`
  - File Name: `items('Apply_to_each')?['name']`
  - File Content: `base64ToBinary(items('Apply_to_each')?['contentBytes'])`
- **If no:** the same *Create file*, but with Folder Path `concat(variables('folder'),'/Receipts')`

Create file makes any missing folders. Check this on your first test.

Optional last step: Office 365 Outlook → *Move email (V2)* to a `Filed` folder in the shared mailbox, so the Inbox only shows reports that didn't get filed.

### 5. Test

1. Before DNS is ready, use `https://isazcode.github.io/sce-expenses-demo/`. Sign in, import a statement, attach two receipts, and submit.
2. Check that:
   - Danna gets the email with the Excel and receipts attached
   - a copy is in your Sent Items
   - `expenses@` got the CC
   - the flow created the SharePoint folder with both subfolders
3. Sign in with a personal Microsoft account. It should be refused.

## Notes

- Photos are shrunk to about 1800 px JPEG in the browser before attaching, so a typical receipt is 200–400 KB. PDFs are attached as-is. Reports over 25 MB of receipts are refused before sending (you can change this with `maxTotalMB` in `config.js`).
- A second report from the same person on the same day goes into the same SharePoint folder. File names start with the line number and date, so they don't overwrite each other.
- Drafts stay in the browser tab until the person submits, and the page warns them before they close it.
- To update the app, edit the files and push to `main`. GitHub Pages redeploys in about a minute.
