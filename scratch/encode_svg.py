import base64

svg = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>
  <rect x='0' y='0' width='100' height='12.5' fill='rgb(128,128,128)'/>
  <rect x='0' y='12.5' width='100' height='12.5' fill='rgb(255,128,128)'/>
  <rect x='0' y='25' width='100' height='12.5' fill='rgb(0,128,128)'/>
  <rect x='0' y='37.5' width='100' height='12.5' fill='rgb(210,128,128)'/>
  <rect x='0' y='50' width='100' height='12.5' fill='rgb(40,128,128)'/>
  <rect x='0' y='62.5' width='100' height='12.5' fill='rgb(240,128,128)'/>
  <rect x='0' y='75' width='100' height='12.5' fill='rgb(20,128,128)'/>
  <rect x='0' y='87.5' width='100' height='12.5' fill='rgb(128,128,128)'/>
</svg>"""

encoded = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
print("BASE64_START")
print(encoded)
print("BASE64_END")
