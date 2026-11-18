# Mavs Airsoft: Online Shop Demo

This is a clickable demo of an online ordering system for Mavs Airsoft. Angelou Fiel built it to pitch the idea to Boss Mavs.

## What's inside
- **Shop:** 415 sample products with their real names, prices and photos, taken from the Mavs Airsoft Google Drive catalog. You can search, filter by category, brand/type, price and stock, and sort the list. Items that are sold out carry a badge.
- **Product view:** a large photo, quantity picker, Add to cart, a "Copy inquiry for Messenger" button, and more items from the same brand.
- **Cart and checkout:** asks for the customer's details, delivery method (pickup, LBC or J&T), payment (GCash, bank transfer or cash on pickup) and the 18+ / valid-ID confirmation. It creates an order number and copies the order text so the customer can paste it into Messenger.
- **Track order:** shows the order status timeline (Pending → Confirmed → Paid → Packed → Shipped/Ready → Completed).
- **Admin preview:** shows sales KPIs, lets you change an order's status, and lets you mark items sold out or available.

> Demo only: orders and stock changes are saved only in the visitor's own browser (localStorage).
> The real system would use PHP + MySQL, an admin login, and a full import of all 3,000+ Drive photos.

## Put it online with GitHub Pages (free link to send Boss Mavs)
1. Go to github.com and create a new **public** repository named `mavs-airsoft-demo`.
2. Click **Add file → Upload files**, then drag in **everything inside this folder**: `index.html`, the `assets` folder and this README. Click **Commit changes**.
3. Open **Settings → Pages**. Under "Branch", choose `main` and `/ (root)`, then click **Save**.
4. Wait 1–2 minutes. Your link will be: `https://angeloufiel.github.io/mavs-airsoft-demo/`

## Open it on your computer
Double-click `index.html`. Product photos load from Google Drive, so you need internet.

## Notes
- Photos are loaded straight from the Drive files, so they only show while the Drive folder stays shared as "Anyone with the link".
- Prices are the ones written in the photo filenames as of November 2026.
