# Analytics setup (Google Sheets, free)

1. Create a new Google Sheet (this becomes the analytics database).
2. Extensions -> Apps Script. Delete the default code, paste in `analytics.gs`, save.
3. Deploy -> New deployment -> type "Web app".
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the web app URL (ends in `/exec`).
5. In `script.js`, set `ANALYTICS_URL` to that URL.
6. Redeploy the site (bump the `script.js?v=` number in `index.html`).

Events land as rows in the `events` tab of the Sheet. To update the script
later, edit it in Apps Script and use Deploy -> Manage deployments -> Edit ->
new version (the URL stays the same).
