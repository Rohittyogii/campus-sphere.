import asyncio
import os
import sys

from backend.services.rag_service import rag_service

async def main():
    print("Testing Campus Sphere RAG System...")
    query = "What is the Innovate To Elevate club about?"
    print(f"\nQ: {query}")
    answer = await rag_service.get_answer(query)
    print(f"\nA: {answer}\n")

    query = "Tell me about the cyber security open elective"
    print(f"\nQ: {query}")
    answer = await rag_service.get_answer(query)
    print(f"\nA: {answer}\n")

if __name__ == "__main__":
    asyncio.run(main())
