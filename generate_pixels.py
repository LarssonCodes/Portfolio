import os

def create_svg(filename, grid, pixel_size=20, color_map=None):
    if color_map is None:
        color_map = {
            '0': 'transparent',
            '1': '#000000', # Black outline
            '2': '#FF0000', # Red (Ghost, Heart, Cherries)
            '3': '#FFFFFF', # White
            '4': '#0000FF', # Blue
            '5': '#00FF00', # Green
            '6': '#884400', # Brown (Stem)
            '7': '#FF00FF', # Magenta/Purple
            '8': '#00FFFF', # Cyan
        }
    
    height = len(grid) * pixel_size
    width = len(grid[0]) * pixel_size
    
    svg_content = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" shape-rendering="crispEdges">\n'
    
    for y, row in enumerate(grid):
        for x, char in enumerate(row):
            if char in color_map and color_map[char] != 'transparent':
                svg_content += f'  <rect x="{x*pixel_size}" y="{y*pixel_size}" width="{pixel_size}" height="{pixel_size}" fill="{color_map[char]}" />\n'
                
    svg_content += '</svg>'
    
    with open(filename, 'w') as f:
        f.write(svg_content)

# 1. Ghost
ghost_grid = [
    "0000011111100000",
    "0000112222110000",
    "0001222222221000",
    "0012222222222100",
    "0122112221122210",
    "0121331213312210",
    "1221341213412221",
    "1221331213312221",
    "1222112221122221",
    "1222222222222221",
    "1222222222222221",
    "1222222222222221",
    "1222222222222221",
    "1221222122212221",
    "1210121012101210",
    "0100010001000100"
]

# 2. Cherries
cherries_grid = [
    "0000000000111000",
    "0000000001666100",
    "0000000016661000",
    "0000000166610000",
    "0000001666100000",
    "0001111661111000",
    "0012222112222100",
    "0122332122332210",
    "1223332123332221",
    "1222222122222221",
    "1222222122222221",
    "0122221012222210",
    "0011110001111100",
]

# 3. Potion
potion_grid = [
    "0000001111000000",
    "0000001331000000",
    "0000001331000000",
    "0000011331100000",
    "0000113333110000",
    "0001133333311000",
    "0011222222221100",
    "0112222222222110",
    "0122322222222210",
    "1223322222222221",
    "1223222222222221",
    "1222222222222221",
    "0122222222222210",
    "0011111111111100"
]

# 4. Heart
heart_grid = [
    "000111000111000",
    "001222101222100",
    "012223212222210",
    "012233222222210",
    "012222222222210",
    "001222222222100",
    "000122222221000",
    "000012222210000",
    "000001222100000",
    "000000121000000",
    "000000010000000"
]

# 5. Abstract (Alien)
abstract_grid = [
    "0000111111110000",
    "0001555555551000",
    "0015555555555100",
    "0155115555115510",
    "1551331551331551",
    "1551311551311551",
    "1555115555115551",
    "1555555555555551",
    "0155511111155510",
    "0015510000155100",
    "0001100000011000"
]

os.makedirs('assets/images', exist_ok=True)
create_svg('assets/images/ghost.svg', ghost_grid, 25)
create_svg('assets/images/cherries.svg', cherries_grid, 25)
create_svg('assets/images/potion.svg', potion_grid, 25)
create_svg('assets/images/heart.svg', heart_grid, 25)
create_svg('assets/images/abstract.svg', abstract_grid, 25)
print("SVGs created successfully!")
