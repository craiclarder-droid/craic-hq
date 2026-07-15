# Craic HQ

A local-first stock, production, traceability and HACCP app.

## Included
- Finished stock
- Ingredients and packaging
- Deliveries and supplier batch codes
- Production runs with automatic batch codes
- Ingredient/packaging deduction
- Finished stock addition
- Customers and orders
- Batch allocation to customers
- Automatic stock movement audit trail
- Traceability search
- Cleaning, pest, calibration, complaint, corrective-action, recall and market logs
- JSON backup/import
- Offline PWA support

## Important limitation
This build stores data in the browser on one device. Export backups regularly.
Live cloud sync is not connected because it requires an external database account and credentials.

## Run on a computer
1. Unzip the folder.
2. Open a terminal in the folder.
3. Run:
   python3 -m http.server 8000
4. Open http://localhost:8000

## Install on iPhone
The app must first be hosted over HTTPS. Upload the folder to a free static host such as GitHub Pages or Cloudflare Pages, then open it in Safari and use Share → Add to Home Screen.

## First use
1. Open Ingredients & Packaging and enter current stock.
2. Record each new delivery with supplier batch code.
3. Add customers.
4. Record production runs.
5. Complete orders by selecting the exact finished batch supplied.
6. Use Traceability to search a batch end-to-end.
7. Export a backup after each production day.
