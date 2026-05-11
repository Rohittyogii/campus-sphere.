
import sys
import os
import csv
import asyncio
from sqlalchemy.future import select

# Add project root to path
sys.path.append(os.getcwd())

from backend.database.session import AsyncSessionLocal
from backend.models.iro import IROContent

async def import_iro_data():
    csv_path = "data/ncu_international_relations_sections_columns.csv"
    if not os.path.exists(csv_path):
        print(f"❌ Error: {csv_path} not found.")
        return

    print(f"📖 Reading {csv_path}...")
    
    async with AsyncSessionLocal() as session:
        # 1. Clear existing data (optional but recommended for a clean import)
        # Uncomment if you want to replace existing data
        # await session.execute(delete(IROContent))
        
        # 2. Read and insert
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            # Column mapping (CSV name -> Model field)
            mapping = {
                "About IRO": "about_iro",
                "Main Objectives": "main_objectives",
                "Global Partners": "global_partners",
                "Global Learning Pathways": "global_learning_pathways",
                "FAQs": "faqs",
                "Student Testimonials": "student_testimonials",
                "Our Vision for Global Academic Advancement": "vision",
                "Campus Connection": "campus_connection",
                "Contact": "contact"
            }
            
            count = 0
            for row in reader:
                obj_data = {}
                for csv_col, model_col in mapping.items():
                    val = row.get(csv_col, "")
                    if val and val.strip().lower() == "nan":
                        val = ""
                    obj_data[model_col] = val
                
                # Only insert if there's at least some data
                if any(obj_data.values()):
                    content = IROContent(**obj_data)
                    session.add(content)
                    count += 1
            
            await session.commit()
            print(f"✅ Successfully imported {count} rows into iro_content.")

if __name__ == "__main__":
    asyncio.run(import_iro_data())
