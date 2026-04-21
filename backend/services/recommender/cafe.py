"""
Campus Sphere — Cafe Recommender
===================================
Algorithm: Popularity-based + student favorite preference matching.
  1. If student has fav_cafe_item → find similar items in same category
  2. Fallback: return available items (cheapest, most popular by category)
  3. Build meal combos from different categories
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.models.cafe import CafeItem
from backend.models.student import Student
from backend.services.recommender.engine import clean_text, tfidf_top_matches


COMBO_RULES = [
    ("Beverages", "Snacks"),
    ("Meals", "Beverages"),
    ("Meals", "Desserts"),
    ("Snacks", "Desserts"),
]


async def recommend_cafe(db: AsyncSession, student: Student) -> dict:
    """
    Returns:
    - top_picks: personalized top-5 items (available only)
    - combos: 2 suggested meal combo pairings
    """
    all_items: list[CafeItem] = (await db.execute(select(CafeItem))).scalars().all()

    # Only recommend available items
    available = [i for i in all_items if (i.availability_status or '').lower() == 'available']
    if not available:
        available = all_items  # Fallback to all if none are available

    # ─────────────────────────────────────────────
    # 1. Personalized picks based on fav_cafe_item
    # ─────────────────────────────────────────────
    fav = student.fav_cafe_item
    if fav and str(fav).strip().lower() not in ('nan', '', 'none'):
        fav_clean = clean_text(fav)
        item_docs = [clean_text(f"{i.item_name} {i.category or ''}") for i in available]
        matches = tfidf_top_matches(fav_clean, item_docs, available, top_k=5)
        top_picks = [
            {
                "itemid": i.itemid,
                "item_name": i.item_name,
                "category": i.category,
                "price": i.price,
                "availability_status": i.availability_status,
                "reason": f"Based on your favourite: {fav}"
            }
            for i, score in matches
        ]
    else:
        # Popularity fallback: cheapest available per category (simulate popularity)
        seen = {}
        for item in sorted(available, key=lambda x: x.price):
            cat = item.category or 'Other'
            if cat not in seen:
                seen[cat] = item
        top_picks = [
            {
                "itemid": i.itemid,
                "item_name": i.item_name,
                "category": i.category,
                "price": i.price,
                "availability_status": i.availability_status,
                "reason": "Most popular in category"
            }
            for i in seen.values()
        ]

    # ─────────────────────────────────────────────
    # 2. Build meal combos from category combinations
    # ─────────────────────────────────────────────
    # Build category index for available items
    cat_index: dict[str, list[CafeItem]] = {}
    for item in available:
        cat = (item.category or 'Other').strip()
        cat_index.setdefault(cat, []).append(item)

    combos = []
    for cat_a, cat_b in COMBO_RULES:
        items_a = cat_index.get(cat_a, [])
        items_b = cat_index.get(cat_b, [])
        if items_a and items_b:
            a = sorted(items_a, key=lambda x: x.price)[0]   # Pick cheapest
            b = sorted(items_b, key=lambda x: x.price)[0]
            combos.append({
                "name": f"{a.item_name} + {b.item_name}",
                "items": [
                    {"item_name": a.item_name, "price": a.price, "category": a.category},
                    {"item_name": b.item_name, "price": b.price, "category": b.category},
                ],
                "total_price": round(a.price + b.price, 2),
                "combo_type": f"{cat_a} & {cat_b} Combo"
            })
        if len(combos) >= 3:
            break

    return {
        "top_picks": top_picks[:5],
        "combos": combos
    }
