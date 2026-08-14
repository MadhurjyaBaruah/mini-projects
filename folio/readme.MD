# Folio

A minimalist reading log. Track the books that shape you.

Built as part of the [mini-projects](../) collection.

---

## Live Demo

**🔗 [Open Live Website](https://madhurjyabaruah.github.io/mini-projects/folio/)**

_or click the preview below._

[![Website Preview](https://api.microlink.io/?url=https://madhurjyabaruah.github.io/mini-projects/folio/&screenshot=true&meta=false&embed=screenshot.url)](https://madhurjyabaruah.github.io/mini-projects/folio/)

## What it does

Folio is a clean, browser-based reading tracker. Log every book you are currently reading, have finished, or want to pick up next. Record your progress, leave a short note, give it a star rating, and watch your shelf grow over time.

No account required. No data leaves your browser. Everything is stored locally.

---

## Features

- Log books with title, author, genre, status, reading progress, star rating, and a personal note
- Three reading statuses: Want to Read, Reading, and Finished
- Drag a progress slider for books you are currently reading
- Rate finished books from one to five stars
- Filter the shelf by status using the tab bar
- Search across titles and authors in real time
- Sort by date added, title, author, or star rating
- Live stats: books in progress, finished, on the list, and total tracked
- Edit or remove any entry
- Keyboard shortcuts: Escape to close dialogs, Enter to save from the form

---

## How to use

1. Click **add book** in the top right corner
2. Enter the title and author (both required)
3. Choose a genre and a reading status
4. If the status is **Reading**, drag the slider to your current page percentage
5. If the status is **Finished**, leave an optional star rating and a personal note
6. Click **save book**

To edit a book, hover the card and click **edit**. To remove it, click **remove** and confirm.

Use the filter tabs and search bar at the top to find any book on your shelf.

---

## Tech

Plain HTML, CSS, and JavaScript. No frameworks, no build tools, no dependencies.

Works on GitHub Pages without any configuration. Just open `index.html`.

Data is stored in `localStorage` under the key `folio_books_v1`. Clearing your browser storage will clear your shelf. There is no export feature yet.

---

## Color palette

| Name  | Hex       | Used for                          |
|-------|-----------|-----------------------------------|
| Cream | `#FAF6EA` | Page background, form inputs      |
| Pale  | `#E4F1AF` | Reading badge, progress track, hover states |
| Teal  | `#5DB996` | Progress fill, stars, reading accent |
| Green | `#108B4F` | Primary actions, brand, Finished badge |

---

## Typography

Body and UI text uses **DM Sans**, loaded from Google Fonts.

Single accent words in headings and labels use **Cormorant Garamond italic**, also from Google Fonts. The accent font appears on one or two words at a time, never a full sentence. This creates a typographic contrast between the neutral sans-serif and the expressive serif that reads as emphasis rather than a style mismatch.

---

## File structure

```
folio/
  index.html   page structure and markup
  style.css    all styles and layout
  app.js       data logic, rendering, event handling
  README.md    this file
```

---

## Part of mini-projects

Folio is one tool in a collection of small, focused browser utilities. Each project is self-contained and runs without a server.

View the full collection at the repository root.
