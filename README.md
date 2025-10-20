# Finsight

A stock dashboard built with React and Vite.

## Features

* Search for top 5,000+ US stocks.
* View live pricing and company info.
* Toggle between an interactive chart and a fundamentals view.
* Chart displays historical data with selectable time ranges (1D, 5D, 1Y, etc.).

## Tech Stack

* **Frontend:** React
* **Charting:** Recharts
* **Data APIs:**
    * Financial Modeling Prep
    * Twelve Data
    * Polygon.io

## How to Run Locally

1.  Clone the repo:
    ```bash
    git clone [https://github.com/Noviath61/finsight.git](https://github.com/Noviath61/finsight.git)
    ```
2.  Install packages:
    ```bash
    cd finsight
    npm install
    ```
3.  Set up your API keys:
    * Create a `.env` file in the root.
    * Copy the format from `.env.example` and add your keys.

4.  Start the server:
    ```bash
    npm run dev
    ```
