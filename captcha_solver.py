## imports ##
import cv2
import pytesseract
import numpy as np

## captcha solver Implementation##
def solve_captcha(img_bytes:bytes) -> str:
    # Load image 
    np_arr=np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) # Convert to grayscale  
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV) # Apply threshold
    captcha_text = pytesseract.image_to_string(thresh, config='--psm 7').strip() # OCR
    print(f"Captcha Text: {captcha_text}")
    return captcha_text

# if __name__ == "__main__":
#     captcha_text = solve_captcha()
#     print(captcha_text)
