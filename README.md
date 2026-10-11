# Food Waste Prediction and Prevention System

A simple academic project using plain HTML, CSS, JavaScript, and base R.

## Features

- Meal prediction form for attendance, menu popularity, day type, holiday, temperature, and rainfall.
- Predicted consumption, recommended preparation, expected surplus, and waste-risk classification.
- Analytics view with historical waste summaries.
- Dataset management view with CSV import and export.
- Reports view with model metrics and prevention recommendations.
- R model training script using ordinary least-squares regression.

## Run it

1. Install R and ensure `Rscript` is available on your PATH.
2. Open PowerShell in this folder.
3. Run:

   ```powershell
   Rscript .\R\train_model.R
   ```

   This reads `data\sample_meals.csv` and creates `web\model.json`.

4. Start the simple local server:

   ```powershell
   .\run_server.bat
   ```

5. Open `http://localhost:8000/web/index.html` in a browser.

The prediction page uses the coefficients written by R. If `model.json` has not been generated, the page shows a clear setup message instead of silently using hardcoded values.

## Train with your own data

Replace `data\sample_meals.csv` with a CSV containing these columns:

```text
meal_date,meal_type,attendance,popularity,day_type,holiday,temperature,rainfall,prepared_kg,consumed_kg,wasted_kg
```

Then run the training command again.

The R script also writes:

- `web\model.json` — coefficients, averages, and metrics used by the website.
- `data\predictions.csv` — historical predictions and risk labels.

## Notes

This is intentionally framework-free. The browser is the user interface, and R remains the inspectable analysis and prediction engine. Historical outcome fields are optional on the prediction form because they are recorded after a meal and must not leak into a future forecast.
