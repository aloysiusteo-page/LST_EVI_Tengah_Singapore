import asyncio
import aiohttp
import pandas as pd
from tqdm.asyncio import tqdm_asyncio

# -----------------------------
# Configuration
# -----------------------------
STATION_ID = "S44"  # Nanyang Avenue
API_URL = "https://api.data.gov.sg/v1/environment/air-temperature"
PERIODS = [
    ("2016-05-01", "2017-06-30"),  # Period 1: before deforestation
    ("2024-05-01", "2025-06-30")   # Period 2: after deforestation
]

# -----------------------------
# Async helper function
# -----------------------------
async def fetch_day(session, date_str, station_id):
    """Fetch one day's readings for a station."""
    params = {"date": date_str}
    try:
        async with session.get(API_URL, params=params) as resp:
            resp.raise_for_status()
            data = await resp.json()
        records = []
        for item in data.get("items", []):
            ts = item.get("timestamp")
            for r in item.get("readings", []):
                if r.get("station_id") == station_id and r.get("value") is not None:
                    records.append({"timestamp": ts, "value": r.get("value")})
        return records
    except Exception as e:
        print(f"Error fetching {date_str}: {e}")
        return []

async def fetch_all_dates(dates, station_id, concurrency=16):
    """Fetch multiple days concurrently with progress tracking."""
    timeout = aiohttp.ClientTimeout(total=90)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        tasks = [fetch_day(session, d, station_id) for d in dates]
        results = []
        for coro in tqdm_asyncio.as_completed(tasks, total=len(tasks), desc="Downloading days"):
            res = await coro
            results.append(res)
    flat_list = [r for daily in results for r in daily]
    return pd.DataFrame(flat_list)

# -----------------------------
# Main workflow
# -----------------------------
async def main():
    dates = []
    for start, end in PERIODS:
        dates.extend(pd.date_range(start, end).strftime("%Y-%m-%d"))

    print(f"Fetching data for station {STATION_ID} (Nanyang Avenue) for both periods...")
    df = await fetch_all_dates(dates, STATION_ID)

    if df.empty:
        print("No data retrieved. Exiting.")
        return

    # Convert timestamps and compute daily mean
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df.set_index("timestamp", inplace=True)
    daily_avg = df.resample("D")["value"].mean()

    # -----------------------------
    # Outlier filtering (remove <0.5 and >99.5 percentile)
    # -----------------------------
    lower, upper = daily_avg.quantile([0.005, 0.995])
    before_count = len(daily_avg)
    daily_avg = daily_avg[(daily_avg >= lower) & (daily_avg <= upper)]
    after_count = len(daily_avg)
    print(f"Applied outlier filter: kept {after_count}/{before_count} days "
          f"(range {lower:.2f} °C – {upper:.2f} °C)")

    # Slice into periods and build outputs
    daily_data = pd.DataFrame()
    summary = []
    for start, end in PERIODS:
        series = daily_avg[start:end].rename(f"{start}_to_{end}")
        daily_data = pd.concat([daily_data, series], axis=1)
        summary.append({
            "period": f"{start} to {end}",
            "mean_temp": series.mean()
        })

    # Save results
    daily_data.to_csv("temperature_S44_daily_filtered.csv", index_label="date")
    summary_df = pd.DataFrame(summary)
    summary_df.to_csv("temperature_S44_summary_filtered.csv", index=False)

    print("✅ Saved daily CSV: temperature_S44_daily_filtered.csv")
    print("✅ Saved summary CSV: temperature_S44_summary_filtered.csv")
    print(summary_df)

# -----------------------------
# Runner for scripts and notebooks
# -----------------------------
def run_async(coro):
    try:
        asyncio.run(coro)
    except RuntimeError as e:
        if "running event loop" in str(e):
            import nest_asyncio
            nest_asyncio.apply()
            loop = asyncio.get_event_loop()
            loop.run_until_complete(coro)
        else:
            raise

if __name__ == "__main__":
    run_async(main())
