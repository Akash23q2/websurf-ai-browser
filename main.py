##imports
import asyncio
from scrapper import scrape_case_data
async def main():
    print("Hello from intern-assignment!\n")
    await scrape_case_data(number="1234", year="2020", cnr="DLCT020002162016", case_type="Civil")
    
    


if __name__ == "__main__":
    asyncio.run(main())
    # 
