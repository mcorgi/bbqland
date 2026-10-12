# Images

Web-optimized copies of the owner's photos (from the shared Drive folder).
Full size is `photos/name.jpg` (max 2200px); `name-sm.jpg` is the ~960px
version used on phones and for small tiles. Some photos only ship the `-sm`
size because they're only shown small.

Re-export from originals with ImageMagick:

```bash
magick original.HEIC -auto-orient -colorspace sRGB -resize '2200x2200>' -strip -quality 80 -interlace Plane photos/name.jpg
magick photos/name.jpg -resize '960x960>' -quality 78 photos/name-sm.jpg
```

| File              | Shows                                         | Used on                               |
|-------------------|-----------------------------------------------|---------------------------------------|
| `beef-stone`      | Sliced beef on volcanic stone, lime           | About banner, social share image      |
| `a5-wagyu`        | Marbled wagyu on stone                        | Home "Premium beef"                   |
| `beef-tongue`     | Thick-cut beef tongue on stone                | About "Our Standard", Home Instagram  |
| `grill-steak`     | Steak on the brass-ringed grill               | Home "Our Standard", About motto, Menu|
| `grill-enoki`     | Brisket-wrapped enoki on the grill            | Closing banners, Home Instagram       |
| `brisket-enoki`   | B11 brisket-wrapped enoki, plated             | About story, Menu                     |
| `set-spread`      | Top-down signature set around the grill       | Home sets, Menu sets                  |
| `pork-jowl`       | P03 Berkshire pork jowl                       | Menu                                  |
| `mashed-potato`, `beef-tartare`, `fried-tofu`, `kimchi`, `pork-belly` | Kitchen dishes | Menu, Home Instagram |
| `sauces`          | Dipping sauce & seasoning guide (graphic)     | Menu "For the grill"                  |
| `dining-room`, `booths`, `aisle`, `bar`, `booth-sunset`, `window-counter`, `life-is-good` | Interior | "The Room" galleries |
| `storefront`      | Storefront & sign                             | Reservations                          |

Logos in `logo/` (`seal-v2.png`, `wordmark-v2-black.png`, `wordmark-v2-white.png`)
were cut from the clean logo artwork in the owner's reference page.

The hero video (`/media/hero-*.mp4`) is the two grilling clips (IMG_2135 then
IMG_2022) joined with a crossfade, silent. `hero-wide` is a 4:3 center crop for
desktop; `hero-tall` is the full vertical clip for phones.
