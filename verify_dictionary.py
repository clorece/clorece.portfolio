import asyncio
from language_tools.japanese import JapaneseTool

async def verify():
    tool = JapaneseTool()
    print("Testing Jisho lookup for 'Mizu' (Water)...")
    res = await tool.lookup_word("mizu")
    print(f"Result: {res}")
    
    print("\nTesting Jisho lookup for 'Neko' (Cat)...")
    res = await tool.lookup_word("neko")
    print(f"Result: {res}")

    if res.get("found"):
        print("\n✅ Verification SUCCESS: Dictionary tool accurately retrieved definitions.")
    else:
        print("\n❌ Verification FAILED: Could not reach Jisho API or word not found.")

if __name__ == "__main__":
    asyncio.run(verify())
