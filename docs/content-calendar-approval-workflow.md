# Content Calendar Approval Workflow

## Where content is stored

Primary seed data lives in:

- `src/_data/contentCalendar.json`

This file contains week groups with content items across channels (`email`, `linkedin`, `blog`, `x`) and editable fields:

- `id`
- `channel`
- `title`
- `body`
- `project`
- `date`
- `status` (`draft`, `pending-approval`, `approved`, `scheduled`, `sent-published`)
- `metadata` (JSON object)
- `rejectionNotes` (optional)

## Runtime persistence (admin edits)

The admin page now reads/writes to:

- `/.netlify/functions/content-calendar-data`

Function file:

- `src/netlify/functions/content-calendar-data.js`

Persistence behavior:

1. **GET**
   - Reads `content-calendar` from Netlify Blobs store `admin-data`.
   - If blob is missing or Blobs are not configured, falls back to `src/_data/contentCalendar.json`.
2. **PUT**
   - Saves full `{ weeks: [...] }` state to Netlify Blobs key `content-calendar`.
   - If Blobs are not configured, request still succeeds with `persisted: false`, and UI keeps local state in browser `localStorage`.

## Approval/editing flow in UI

Page:

- `src/admin/content-calendar.njk`

Workflow:

1. **Unified Approval Queue** shows only `pending-approval` items for Email, LinkedIn, Blog, and X.
2. **Preview/Edit** opens modal pane.
3. Editor allows updates to:
   - title
   - body
   - metadata JSON
   - channel/project/date/status
4. **Approve** sets status to `approved`.
5. **Reject** sets status back to `draft` and stores optional reject notes.
6. **Filters** allow channel + status filtering across all content.

## Notes

- UI is mobile-safe (responsive card list + modal).
- No sticky/fixed navigation was added.
- No purple/violet/indigo color tokens are used in this page.
