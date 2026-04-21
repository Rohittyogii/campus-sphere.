# library_preprocess.py
# Preprocessing script for library books data
# Run: python library_preprocess.py
import pandas as pd
import numpy as np

# ---------- CONFIG ----------
INPUT_PATH = "data/Library_Books.xlsx"   # or .csv
SHEET = 0                           # if Excel: sheet index or name
TITLE_COL = "title"
AUTHOR_COL = "author"
EDITION_COL = "editionstatement"
PUBLISHER_COL = "publishercode"
YEAR_COL = "year"
ITEMCALL_COL = "itemcallnumber"
BARCODE_COL = "barcode"
AVAIL_COL = "availability_status"
# -----------------------------

# --- 1) Load file (Excel or CSV)
if INPUT_PATH.lower().endswith((".xls", ".xlsx")):
    df = pd.read_excel(INPUT_PATH, sheet_name=SHEET, dtype=str)
else:
    df = pd.read_csv(INPUT_PATH, dtype=str)

# normalize column names (safe)
df.columns = [c.strip() for c in df.columns]
# ensure required columns exist (will raise KeyError if not)
for col in [TITLE_COL, AUTHOR_COL, EDITION_COL, PUBLISHER_COL, YEAR_COL, ITEMCALL_COL, BARCODE_COL, AVAIL_COL]:
    if col not in df.columns:
        print(f"Warning: column '{col}' not found in input. Adjust config if needed.")

# fillna for safe operations
df = df.fillna("").astype(str)

# lowercase normalized fields for grouping
def norm(s):
    return s.strip().lower()

df["_title_norm"] = df[TITLE_COL].apply(norm)
df["_author_norm"] = df[AUTHOR_COL].apply(norm)
df["_edition_norm"] = df[EDITION_COL].apply(norm)
df["_pub_norm"] = df[PUBLISHER_COL].apply(norm)
df["_year_norm"] = df[YEAR_COL].apply(lambda x: x.strip())

# ---------- A: Quantity per unique TITLE ----------
qty_by_title = df.groupby("_title_norm").size().rename("quantity").reset_index()
# keep one representative original title (first)
rep_title = df.groupby("_title_norm")[TITLE_COL].first().reset_index()
qty_by_title = qty_by_title.merge(rep_title, on="_title_norm")[["_title_norm", "title", "quantity"]]

# Save to CSV
qty_by_title.sort_values("quantity", ascending=False).to_csv("quantity_by_title.csv", index=False)

print("Top 20 titles by physical copies (quantity):")
print(qty_by_title.sort_values("quantity", ascending=False).head(20).to_string(index=False))

# ---------- B: How many different EDITIONS per TITLE ----------
editions_per_title = df.groupby("_title_norm")["_edition_norm"].nunique().rename("num_editions").reset_index()
# list example editions per title (up to 10 samples)
editions_samples = df.groupby("_title_norm")["_edition_norm"].unique().rename("edition_list").reset_index()
editions_summary = editions_per_title.merge(editions_samples, on="_title_norm")
editions_summary = editions_summary.merge(rep_title, on="_title_norm")[["_title_norm","title","num_editions","edition_list"]]

editions_summary.sort_values("num_editions", ascending=False).to_csv("editions_per_title.csv", index=False)
print("\nTitles with most editions:")
print(editions_summary.sort_values("num_editions", ascending=False).head(20).to_string(index=False))

# ---------- C: Create master_books (unique book record) ----------
# Define a unique_key that preserves edition/publisher/year to avoid merging different editions
df["_unique_key"] = df["_title_norm"] + "||" + df["_author_norm"] + "||" + df["_edition_norm"] + "||" + df["_pub_norm"] + "||" + df["_year_norm"]

master = df.groupby("_unique_key").agg(
    title=(TITLE_COL, "first"),
    author=(AUTHOR_COL, "first"),
    editionstatement=(EDITION_COL, "first"),
    publishercode=(PUBLISHER_COL, "first"),
    copyrightdate=(YEAR_COL, "first"),
    itemcallnumber=(ITEMCALL_COL, "first"),
    quantity=("barcode", "count")   # total physical copies for this unique book
).reset_index(drop=False)

# generate a stable internal book_id
master = master.reset_index().rename(columns={"index":"book_id"})  # numeric book_id starting from 0
master["book_id"] = master["book_id"].astype(int) + 1

master.to_csv("master_books.csv", index=False)
print(f"\nmaster_books created: {len(master)} unique book records (grouped by title+author+edition+publisher+year).")

# ---------- D: Build barcodes table ----------
barcodes = df[[BARCODE_COL, "_unique_key", AVAIL_COL]].copy()
# map unique_key -> book_id
key_to_bid = master.set_index("_unique_key")["book_id"].to_dict()
barcodes["book_id"] = barcodes["_unique_key"].map(key_to_bid)
barcodes = barcodes.rename(columns={BARCODE_COL:"barcode", AVAIL_COL:"availability_status"})[["barcode","book_id","availability_status"]]
barcodes.to_csv("barcodes.csv", index=False)
print(f"barcodes saved: {len(barcodes)} rows (should equal original rows).")

# ---------- E: Quick stats you asked about ----------
total_entries = len(df)
unique_titles = df["_title_norm"].nunique()
unique_authors = df["_author_norm"].nunique()
unique_itemcall = df[ITEMCALL_COL].nunique()
unique_publishers = df["_pub_norm"].nunique()
unique_years = df["_year_norm"].nunique()
unique_books_grouped = len(master)

print("\n---- QUICK STATS ----")
print(f"Total rows: {total_entries}")
print(f"Unique titles (normalized): {unique_titles}")
print(f"Unique authors: {unique_authors}")
print(f"Unique itemcallnumbers: {unique_itemcall}")
print(f"Unique publishers (publishercode): {unique_publishers}")
print(f"Unique years: {unique_years}")
print(f"Unique grouped books (title+author+edition+publisher+year): {unique_books_grouped}")

# ---------- F: Category assignment (two lightweight options) ----------
# Option 1: Rule-based keyword mapping (fast, transparent)
keyword_map = {
    "computer": "Computer Science",
    "program": "Computer Science",
    "algorithm": "Computer Science",
    "mechanics": "Mechanical Engineering",
    "thermo": "Mechanical Engineering",
    "civil": "Civil Engineering",
    "survey": "Civil Engineering",
    "physics": "Science",
    "chemistry": "Science",
    "math": "Mathematics",
    "economics": "Economics",
    "management": "Management",
    "law": "Law",
    "english": "Language",
    "graphics": "Computer Graphics",
    "electrical": "Electrical Engineering",
    "electronics": "Electronics",
}
def map_category_by_keyword(title):
    t = title.lower()
    for k,v in keyword_map.items():
        if k in t:
            return v
    return "General"

master["category_keyword"] = master["title"].fillna("").apply(map_category_by_keyword)

# Option 2: TF-IDF + KMeans clustering (for unlabeled grouping)
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.cluster import KMeans
    sample_texts = master["title"].fillna("").astype(str).values
    tfidf = TfidfVectorizer(max_features=2000, stop_words="english")
    X = tfidf.fit_transform(sample_texts)
    # choose k ~ sqrt(n) or small fixed number; here pick 25 clusters for exploration
    n_clusters = min(25, max(5, int(np.sqrt(len(master)))))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10).fit(X)
    master["cluster_label"] = kmeans.labels_
except Exception as e:
    print("skipped TF-IDF clustering (sklearn not available).", e)
    master["cluster_label"] = -1

# save master with categories/clusters
master.to_csv("master_books_with_categories.csv", index=False)
print("\nmaster_books_with_categories.csv saved (includes category_keyword and cluster_label).")

# ---------- G: Helpful reporting examples ----------
# Titles with highest number of copies
top_titles = qty_by_title.sort_values("quantity", ascending=False).head(30)
top_titles.to_csv("top_titles_by_quantity.csv", index=False)

# Titles that have >1 edition
multi_edition = editions_summary[editions_summary["num_editions"]>1]
multi_edition.to_csv("titles_with_multiple_editions.csv", index=False)

print("\nSaved reports:")
print(" - top_titles_by_quantity.csv")
print(" - titles_with_multiple_editions.csv")
print(" - master_books.csv / master_books_with_categories.csv")
print(" - barcodes.csv")
print(" - quantity_by_title.csv")
print(" - editions_per_title.csv")

