## imports ##
from playwright.async_api import async_playwright
import re
import time
from captcha_solver import solve_captcha

WEBSITE_URL = "https://services.ecourts.gov.in/ecourtindia_v6/"

## scrapper ##
async def scrape_case_data(number:str='',year:str='',base_url:str=WEBSITE_URL,cnr:str='',
                     case_type:str='') -> str:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=100)
        page = await browser.new_page()
        await page.goto(base_url) #navigate to url
        time.sleep(0.5)
        print(f"\n🔍 Searching... for cnr->{cnr}, type->{case_type}")

        if True:
            # Clear and type in search bar
            search_box = page.locator("#cino")
            await search_box.fill("")            # clear existing text
            await search_box.type(cnr)     # type case
            
            # Wait for captcha image and download bytes
            captcha_element = await page.wait_for_selector("#captcha_image")
            captcha_bytes = await captcha_element.screenshot()
            
            #solve captcha
            # captcha_text=solve_captcha(captcha_bytes)
            captcha_text=input("Enter captcha manually: ") # to see rest behaviour

            # Fill captcha
            await page.fill("input[placeholder='Enter Captcha']", captcha_text)

            # Click search
            await page.click("button:has-text('Search')")
            
            print("✅ Done — results should be displayed now!")
            
            time.sleep(20)
            
            await browser.close()
            return "Success"

#             # Wait a bit to see result
#             await page.wait_for_timeout(5000)
#             page.keyboard.press("Enter") 
#             page.keyboard.press("Enter")   # press enter to search
#             time.sleep(0.5)
#             page.keyboard.press("Enter")   # press enter to search
            
#             # press enter to search

#             # Wait for the next page to load
#             page.wait_for_load_state("networkidle")
#             time.sleep(1)

#             # Extract the <script id="wpi-data">
#             html = page.content()
#             match = re.search(
#                 r'<script id="wpi-data" type="application/json">(.*?)</script>',
#                 html,
#                 re.DOTALL
#             )

#             if match:
#                 json_data = match.group(1).strip()
#                 # print(json_data)
#                 insert_processed_data(json_data)
#                 time.sleep(1)
#                 with open("scraped.txt", "a", encoding="utf-8") as f:
#                     f.write(f"{commodity}:\n{json_data}\n\n")
#                 print(f"✅ Saved data for: {commodity}")
#             else:
#                 print(f"⚠️ No <script id='wpi-data'> tag found for {commodity}")

#             # Go back to main search page
#             page.goto(base_url)
#             time.sleep(2)

#         except Exception as e:
#             print(f"❌ Error scraping {commodity}: {e}")
#             page.goto(base_url)
#             time.sleep(2)

#     browser.close()
#     print("\n🎉 Done! All commodities processed.")

# if __name__ == "__main__":
#     scrape_commodity_data()
