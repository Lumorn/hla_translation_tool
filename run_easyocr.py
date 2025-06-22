#!/usr/bin/env python3
import sys
import numpy as np
import cv2
import torch

try:
    import easyocr
except ModuleNotFoundError:
    sys.stderr.write("EasyOCR nicht installiert. Bitte start_tool.py ausführen.\n")
    sys.exit(1)

def main():
    data = sys.stdin.buffer.read()
    if not data:
        return
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        return
    if img.shape[-1] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
    res = reader.readtext(gray, detail=0, paragraph=True)
    text = " ".join(res).strip()
    print(text)

if __name__ == '__main__':
    main()
