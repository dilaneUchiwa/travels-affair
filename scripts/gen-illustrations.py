#!/usr/bin/env python3
"""Génère les illustrations originales de démonstration (villes, hôtels, transports, voitures, activités, logos de compagnies).
Remplacez-les par de vraies photos : téléversement depuis l'administration, ou `node scripts/fetch-photos.mjs`."""
import random, os
W, H = 1200, 800
OUT = "public/img/p"
def svg(body, defs=""):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice"><defs>{defs}</defs>{body}</svg>'
def sky(c1, c2, sun=None, stars=False):
    d = f'<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#sky)"/>'
    if sun: b += f'<circle cx="{sun[0]}" cy="{sun[1]}" r="{sun[2]}" fill="{sun[3]}" opacity=".9"/><circle cx="{sun[0]}" cy="{sun[1]}" r="{sun[2]*1.8}" fill="{sun[3]}" opacity=".15"/>'
    return d, b
def clouds(seed=1, n=5, op=.85):
    r = random.Random(seed); s = ""
    for _ in range(n):
        x, y, sc = r.randint(50, 1050), r.randint(60, 300), r.uniform(.7, 1.5)
        s += f'<g transform="translate({x} {y}) scale({sc})" fill="#fff" opacity="{op}"><ellipse cx="0" cy="0" rx="70" ry="22"/><ellipse cx="-35" cy="8" rx="45" ry="18"/><ellipse cx="42" cy="6" rx="50" ry="19"/></g>'
    return s
def hills(color, y, amp, seed, op=1):
    r = random.Random(seed); pts = [(0, y)]
    x = 0
    while x < W + 100:
        x += r.randint(120, 260); pts.append((x, y - r.randint(0, amp)))
    d = f"M0 {H} L0 {y} " + " ".join(f"Q{(pts[i][0]+pts[i+1][0])//2} {min(pts[i][1],pts[i+1][1])-amp//3} {pts[i+1][0]} {pts[i+1][1]}" for i in range(len(pts)-1)) + f" L{W} {H} Z"
    return f'<path d="{d}" fill="{color}" opacity="{op}"/>'
def skyline(base, colors, seed, minh=120, maxh=380, win="#ffe9a8", lit=.35):
    r = random.Random(seed); s = ""; x = -10
    while x < W:
        w, h = r.randint(55, 120), r.randint(minh, maxh); c = r.choice(colors)
        s += f'<rect x="{x}" y="{base-h}" width="{w}" height="{h}" fill="{c}"/>'
        for wy in range(base-h+16, base-12, 26):
            for wx in range(x+10, x+w-14, 20):
                if r.random() < lit: s += f'<rect x="{wx}" y="{wy}" width="9" height="12" fill="{win}" opacity=".85"/>'
        x += w + r.randint(0, 6)
    return s
def ground(color, y): return f'<rect x="0" y="{y}" width="{W}" height="{H-y}" fill="{color}"/>'
def palm(x, y, s=1, c="#1f6b45"):
    leaves = "".join(f'<path d="M0 0 Q{40*s*dx} {-30*s} {90*s*dx} {10*s+j*8}" stroke="{c}" stroke-width="{7*s}" fill="none" stroke-linecap="round"/>' for dx in (-1, 1) for j in range(3))
    return f'<g transform="translate({x} {y})"><path d="M0 {260*s} Q{12*s} {130*s} 0 0" stroke="#7a5a3a" stroke-width="{12*s}" fill="none" stroke-linecap="round"/><g>{leaves}<path d="M0 0 Q0 {-50*s} {10*s} {-70*s}" stroke="{c}" stroke-width="{7*s}" fill="none"/></g></g>'
def tree(x, y, s=1, c="#2e7d4f"):
    return f'<g transform="translate({x} {y}) scale({s})"><rect x="-6" y="0" width="12" height="60" fill="#6b4a2f"/><circle cx="0" cy="-20" r="46" fill="{c}"/><circle cx="-30" cy="5" r="32" fill="{c}"/><circle cx="32" cy="8" r="34" fill="{c}"/></g>'
def label(txt): return ""  # volontairement sans texte : l'illustration doit rester neutre

def save(name, body, defs=""):
    open(f"{OUT}/{name}.svg", "w").write(svg(body, defs))

# ---------- Villes ----------
def city(name, sky_c, sun, far, near, landmark="", ground_c="#2a3a4a", seed=1, base=620):
    d, b = sky(*sky_c, sun=sun)
    b += clouds(seed, 4)
    b += hills(far, base-120, 120, seed+1, .9)
    b += skyline(base, near, seed, 100, 340)
    b += landmark
    b += ground(ground_c, base)
    b += f'<rect x="0" y="{base}" width="{W}" height="6" fill="#00000022"/>'
    save(name, b, d)

eiffel = '<g transform="translate(600 150)" fill="#3b2f2f"><path d="M-8 0 L8 0 L14 120 L-14 120Z"/><path d="M-14 120 L14 120 L52 380 L26 380 L0 250 L-26 380 L-52 380Z"/><rect x="-24" y="118" width="48" height="10"/><rect x="-52" y="372" width="104" height="10"/><path d="M-26 380 Q0 300 26 380" fill="#d9c9a7"/><path d="M0 -40 L2 0 L-2 0Z"/></g>'
atomium = '<g transform="translate(600 280)" fill="#c9d3e0" stroke="#7f8da0" stroke-width="3">' + "".join(f'<circle cx="{x}" cy="{y}" r="34"/>' for x, y in [(0,-110),(-80,-30),(80,-30),(-80,90),(80,90),(0,150),(0,20)]) + '<path d="M0 -110 L-80 -30 M0 -110 L80 -30 M-80 -30 L-80 90 M80 -30 L80 90 M-80 90 L0 150 M80 90 L0 150 M-80 -30 L80 90 M80 -30 L-80 90" stroke-width="12" fill="none"/></g>'
mosque = '<g transform="translate(700 190)"><rect x="-70" y="30" width="140" height="330" fill="#f1ead9"/><rect x="-70" y="30" width="140" height="22" fill="#2f8f83"/><rect x="-80" y="20" width="160" height="16" fill="#d9cfb6"/><path d="M-50 20 L0 -50 L50 20Z" fill="#2f8f83"/><rect x="-3" y="-90" width="6" height="50" fill="#d4a73a"/><circle cx="0" cy="-95" r="8" fill="#d4a73a"/><rect x="-330" y="250" width="260" height="110" fill="#f1ead9"/><path d="M-310 250 Q-200 150 -90 250Z" fill="#f1ead9" stroke="#d9cfb6" stroke-width="3"/></g>'
istanbul = '<g transform="translate(600 210)" fill="#e9dcc2"><path d="M-170 220 Q0 40 170 220Z"/><path d="M-250 250 Q-190 150 -130 250Z"/><path d="M130 250 Q190 150 250 250Z"/><rect x="-330" y="40" width="22" height="260"/><rect x="308" y="40" width="22" height="260"/><path d="M-336 40 L-319 -30 L-302 40Z" fill="#b84c3e"/><path d="M302 40 L319 -30 L336 40Z" fill="#b84c3e"/><rect x="-270" y="250" width="540" height="70"/><circle cx="0" cy="40" r="10" fill="#d4a73a"/></g>'
addis = '<g fill="#8a6a4a">' + "".join(f'<path d="M{x} 620 L{x+90} {460-h} L{x+180} 620Z"/>' for x, h in [(-40,0),(260,60),(560,20),(820,50)]) + '</g>'
douala = '<g><rect x="760" y="360" width="26" height="260" fill="#cfd8e3"/><rect x="820" y="330" width="34" height="290" fill="#b9c6d6"/><rect x="900" y="400" width="28" height="220" fill="#d9e1ea"/></g><g stroke="#37526d" stroke-width="5" fill="none"><path d="M0 560 Q600 520 1200 560"/></g><g fill="#c4553a"><path d="M120 640 l130 0 -20 36 -90 0z"/><rect x="170" y="590" width="6" height="50" fill="#37526d"/><path d="M176 592 l50 28 -50 0z" fill="#fff"/></g>'
yaounde = hills("#4c8a5c", 560, 90, 31, 1) + '<g fill="#e6dcc6">' + "".join(f'<rect x="{x}" y="{520-h}" width="46" height="{h}"/>' for x, h in [(180,90),(240,140),(300,80),(880,120),(940,170),(1000,100)]) + '</g>'

city("city-paris", ("#7fb1e6", "#f7d9b0"), (220, 190, 60, "#fff4cf"), "#9fb6d4", ["#cfc7bb", "#bfb6a8", "#d9d1c4", "#a9a094"], eiffel, "#3d4a5a", 3)
city("city-bruxelles", ("#8fb0d6", "#f2d6c4"), (980, 180, 55, "#fff1c9"), "#a3b3cc", ["#b0764f", "#a06a46", "#c28a62", "#8d5b3b"], atomium, "#3b4552", 5)
city("city-casablanca", ("#6fb6e8", "#fbe3b9"), (200, 170, 62, "#fff0bf"), "#a8c4de", ["#f2ede2", "#e6dfd0", "#ffffff", "#d6cfbd"], mosque, "#3d5a6e", 7)
city("city-istanbul", ("#f4a870", "#fbe0b5"), (980, 300, 70, "#ffe08a"), "#b8a6a0", ["#d9c6a5", "#cdb792", "#e5d4b4", "#bfa781"], istanbul, "#2f4d66", 9)
city("city-douala", ("#ffb36b", "#ffe2b0"), (220, 330, 80, "#fff2c2"), "#c79e7b", ["#9aa7b4", "#8795a3", "#b2bcc7", "#7a8794"], douala, "#1f6f8b", 11)
save("city-yaounde", *(lambda d, b: (b + clouds(13, 4) + yaounde + skyline(620, ["#cdd6c4", "#bcc7b2", "#e2e6d6", "#a8b59b"], 15, 90, 260) + ground("#2d5a3a", 620), d))(*sky("#7cc0e8", "#f6ecd0", sun=(980, 190, 56, "#fff2bd"))))
save("city-addis", *(lambda d, b: (b + clouds(17, 4) + hills("#b79a74", 520, 140, 19) + hills("#8a6a4a", 590, 80, 21) + skyline(640, ["#d9cdb8", "#cbbd9f", "#ece3cf", "#b9a98a"], 23, 80, 240) + ground("#4d6b3a", 640), d))(*sky("#6aaee0", "#fbe6c0", sun=(200, 200, 58, "#fff0b8"))))
save("city-kribi", *(lambda d, b: (b + clouds(25, 3) + hills("#2f8f6a", 470, 90, 27) + f'<rect y="500" width="{W}" height="300" fill="#2aa7c9"/><path d="M0 560 Q300 520 600 560 T1200 560 V800 H0Z" fill="#43bfd9" opacity=".7"/><path d="M0 660 Q300 620 600 660 T1200 660 V800 H0Z" fill="#7fd6e6" opacity=".6"/><path d="M0 700 Q300 670 600 700 T1200 700 V800 H0Z" fill="#f3dfae"/>' + palm(180, 430, 1.2) + palm(980, 440, 1.0), d))(*sky("#6bc6f0", "#f9ecc9", sun=(900, 170, 58, "#fff3b8"))))

# ---------- Hôtels ----------
def hotel(name, tall=True, style="modern", c="#cdd7e4", acc="#2c62ad", seed=1):
    d, b = sky("#78b9ee", "#f8e8c8", sun=(1000, 170, 56, "#fff3c0")); b += clouds(seed, 4)
    b += hills("#8fb59a", 520, 90, seed+1, .8)
    b += ground("#3f7a52", 640) + '<rect x="0" y="640" width="1200" height="160" fill="#3f7a52"/>'
    if style == "modern":
        b += f'<rect x="300" y="170" width="600" height="470" fill="{c}"/><rect x="300" y="170" width="600" height="26" fill="{acc}"/>'
        for r in range(5):
            for q in range(8):
                b += f'<rect x="{325+q*72}" y="{215+r*80}" width="46" height="52" fill="#7fb0d8"/><rect x="{325+q*72}" y="{215+r*80}" width="46" height="26" fill="#a8cfee" opacity=".7"/>'
        b += f'<rect x="520" y="560" width="160" height="80" fill="{acc}"/><rect x="535" y="575" width="130" height="65" fill="#e8f3fb"/>'
        b += '<rect x="80" y="670" width="330" height="90" rx="40" fill="#4cc3e8"/><rect x="95" y="682" width="300" height="66" rx="32" fill="#8ad8f0"/>' + palm(120, 400, 1.0) + palm(1060, 400, 1.1)
    elif style == "villa":
        b += f'<rect x="280" y="360" width="640" height="280" fill="{c}"/><path d="M250 360 L600 200 L950 360Z" fill="{acc}"/><rect x="520" y="480" width="160" height="160" fill="#7a5a3a"/>'
        for x in (330, 420, 720, 810): b += f'<rect x="{x}" y="420" width="60" height="70" fill="#9fd0ee"/><rect x="{x-8}" y="490" width="76" height="8" fill="#fff"/>'
        b += palm(160, 400, 1.1) + palm(1040, 410, 1.0) + tree(1100, 560, .8)
    else:
        b += f'<rect x="330" y="170" width="540" height="470" fill="{c}"/><path d="M310 170 L360 110 L840 110 L890 170Z" fill="{acc}"/>'
        for r in range(4):
            for q in range(5):
                b += f'<rect x="{370+q*95}" y="{210+r*100}" width="52" height="76" fill="#8fb7d6"/><rect x="{362+q*95}" y="{286+r*100}" width="68" height="8" fill="#2a2f3a"/>'
        for x in (400, 560, 720): b += f'<rect x="{x}" y="75" width="22" height="48" fill="#8a5a45"/>'
        b += '<rect x="560" y="560" width="80" height="80" fill="#3a2a22"/>' + tree(180, 560, 1.0, "#5a8f4f") + tree(1030, 560, 1.0, "#5a8f4f")
    save(name, b, d)
hotel("hotel-akwa", style="modern", c="#d9dfe8", acc="#2c62ad", seed=31)
hotel("hotel-palmiers", style="villa", c="#f3e3c6", acc="#c4553a", seed=33)
hotel("hotel-rive-gauche", style="paris", c="#e4d8c3", acc="#4a5d73", seed=35)

# ---------- Transports ----------
def road_scene(name, vehicle, sky_c=("#86c3ee", "#fbe9c8"), seed=1):
    d, b = sky(*sky_c, sun=(960, 190, 54, "#fff2bd")); b += clouds(seed, 4)
    b += hills("#7cab8b", 520, 100, seed+1) + hills("#4e8a63", 580, 70, seed+3)
    b += '<rect y="600" width="1200" height="200" fill="#4a5361"/><rect y="596" width="1200" height="8" fill="#6f7a89"/>' + "".join(f'<rect x="{x}" y="688" width="90" height="10" fill="#f4f1e6"/>' for x in range(20, 1200, 170))
    b += vehicle
    save(name, b, d)
bus = '<g transform="translate(250 450)"><rect width="640" height="190" rx="22" fill="#e9eef5"/><rect y="110" width="640" height="80" rx="0" fill="#2c62ad"/><rect width="640" height="22" rx="10" fill="#d4dde9"/>' + "".join(f'<rect x="{30+i*100}" y="34" width="78" height="64" rx="8" fill="#7fb0d8"/>' for i in range(6)) + '<rect x="548" y="34" width="70" height="120" rx="8" fill="#5f98c8"/><circle cx="130" cy="192" r="38" fill="#222"/><circle cx="130" cy="192" r="16" fill="#9aa5b3"/><circle cx="500" cy="192" r="38" fill="#222"/><circle cx="500" cy="192" r="16" fill="#9aa5b3"/><rect x="620" y="140" width="22" height="30" fill="#ffd45c"/></g>'
train = '<g transform="translate(120 440)">' + "".join(f'<g transform="translate({i*320} 0)"><rect width="300" height="170" rx="20" fill="{"#e9eef5" if i else "#2c62ad"}"/><rect y="100" width="300" height="40" fill="#c4553a" opacity=".9"/>' + "".join(f'<rect x="{22+j*68}" y="30" width="50" height="52" rx="6" fill="#7fb0d8"/>' for j in range(4)) + '<circle cx="60" cy="176" r="18" fill="#222"/><circle cx="240" cy="176" r="18" fill="#222"/></g>' for i in range(3)) + '</g>'
shuttle = '<g transform="translate(330 470)"><path d="M0 120 L0 40 Q0 20 24 20 L380 20 Q430 20 450 70 L480 110 Q500 120 500 150 L500 170 L0 170Z" fill="#f4f6fa"/><rect y="120" width="500" height="50" fill="#2c62ad"/>' + "".join(f'<rect x="{26+i*90}" y="42" width="72" height="56" rx="8" fill="#7fb0d8"/>' for i in range(4)) + '<path d="M392 42 L430 42 Q452 60 462 96 L392 96Z" fill="#5f98c8"/><circle cx="110" cy="172" r="34" fill="#222"/><circle cx="110" cy="172" r="14" fill="#9aa5b3"/><circle cx="390" cy="172" r="34" fill="#222"/><circle cx="390" cy="172" r="14" fill="#9aa5b3"/><rect x="480" y="110" width="22" height="22" fill="#ffd45c"/></g>'
road_scene("transport-bus", bus, seed=41)
road_scene("transport-train", train, seed=43)
road_scene("transport-shuttle", shuttle, ("#ffb978", "#ffe6b8"), seed=45)

# ---------- Voitures ----------
def car_scene(name, body, c1="#86c3ee", c2="#fbe9c8", seed=1):
    d, b = sky(c1, c2, sun=(980, 190, 54, "#fff2bd")); b += clouds(seed, 3)
    b += hills("#9dbb9f", 540, 90, seed+1, .8) + '<rect y="600" width="1200" height="200" fill="#434b57"/><rect y="596" width="1200" height="8" fill="#6a7482"/>'
    b += '<ellipse cx="600" cy="690" rx="360" ry="22" fill="#00000030"/>' + body
    save(name, b, d)
def wheels(x1, x2, y, r=48): return "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#1c2128"/><circle cx="{x}" cy="{y}" r="{r*.55}" fill="#c3ccd8"/><circle cx="{x}" cy="{y}" r="{r*.18}" fill="#6a7482"/>' for x in (x1, x2))
yaris = '<g><path d="M250 560 L290 470 Q310 440 350 440 L760 440 Q810 440 840 480 L910 540 Q950 550 950 590 L950 650 L250 650Z" fill="#e8553d"/><path d="M340 458 L760 458 Q790 458 810 485 L850 535 L330 535Z" fill="#b8e0f7"/><rect x="555" y="456" width="10" height="82" fill="#e8553d"/><rect x="250" y="600" width="700" height="18" fill="#c43f2a"/><rect x="900" y="560" width="46" height="26" rx="6" fill="#ffe08a"/>' + wheels(380, 800, 650) + '</g>'
suv = '<g><path d="M220 560 L250 440 Q262 410 300 410 L820 410 Q860 410 880 450 L930 540 Q980 550 980 600 L980 660 L220 660Z" fill="#2e3b4e"/><path d="M290 430 L810 430 Q835 430 850 455 L880 530 L280 530Z" fill="#a9d3ee"/><rect x="470" y="428" width="9" height="102" fill="#2e3b4e"/><rect x="660" y="428" width="9" height="102" fill="#2e3b4e"/><rect x="220" y="610" width="760" height="20" fill="#202b3a"/><rect x="930" y="568" width="48" height="28" rx="6" fill="#ffe08a"/><rect x="290" y="395" width="480" height="12" rx="6" fill="#8793a3"/>' + wheels(370, 830, 660, 56) + '</g>'
minibus = '<g><path d="M180 580 L180 410 Q180 380 215 380 L860 380 Q905 380 930 430 L990 540 Q1020 555 1020 600 L1020 665 L180 665Z" fill="#f4f6fa"/><rect x="180" y="560" width="840" height="60" fill="#2c62ad"/>' + "".join(f'<rect x="{215+i*130}" y="410" width="100" height="90" rx="8" fill="#9fcdec"/>' for i in range(5)) + '<path d="M870 410 L905 410 Q930 430 950 480 L990 540 L870 540Z" fill="#7fb0d8"/><rect x="975" y="575" width="44" height="26" rx="6" fill="#ffe08a"/>' + wheels(350, 830, 665, 50) + '</g>'
car_scene("car-yaris", yaris, seed=51); car_scene("car-landcruiser", suv, "#ffb978", "#ffe6b8", 53); car_scene("car-minibus", minibus, seed=55)

# ---------- Activités ----------
d, b = sky("#78c0ea", "#e9f4d9", sun=(1000, 140, 48, "#fff6c9"))
b += clouds(61, 3) + hills("#2f7d57", 360, 130, 63) + hills("#245f43", 430, 90, 65)
b += '<path d="M470 300 L720 300 L760 640 L430 640Z" fill="#cfe9f5"/>' + "".join(f'<path d="M{500+i*45} 300 L{490+i*48} 640" stroke="#fff" stroke-width="{10-i}" opacity=".85"/>' for i in range(5))
b += '<ellipse cx="595" cy="650" rx="260" ry="60" fill="#8ed4ea"/><ellipse cx="595" cy="650" rx="190" ry="34" fill="#c6eef6" opacity=".8"/><rect y="680" width="1200" height="120" fill="#2e6b4c"/>' + tree(180, 560, 1.4) + tree(1020, 580, 1.3, "#25704a") + tree(330, 600, 1.0, "#3a8a58")
save("activity-lobe", b, d)
d, b = sky("#8fc3ee", "#f8e6cf", sun=(220, 180, 54, "#fff3c6")); b += clouds(71, 4) + hills("#a9bfa6", 520, 70, 73, .8)
b += skyline(620, ["#cfc7bb", "#bfb6a8", "#d9d1c4"], 75, 90, 240) + eiffel.replace('translate(600 150)', 'translate(940 190) scale(.8)') + '<rect y="620" width="1200" height="180" fill="#8c8f95"/><rect y="700" width="1200" height="6" fill="#ffffff55"/>'
b += '<g transform="translate(330 500)" stroke="#1f2a38" stroke-width="9" fill="none" stroke-linecap="round"><circle cx="0" cy="140" r="62"/><circle cx="260" cy="140" r="62"/><path d="M0 140 L90 40 L200 40 L260 140 M90 40 L130 140 L0 140 M130 140 L200 40" stroke="#e8553d"/><path d="M200 40 L190 10 L225 10 M80 40 L65 20 L100 20"/></g><circle cx="470" cy="520" r="34" fill="#f2c9a0"/><path d="M450 560 L500 560 L520 640 L470 650Z" fill="#2c62ad"/>'
save("activity-paris-velo", b, d)

# ---------- Logos de compagnies (monogrammes originaux, à remplacer par les vrais logos via l'admin) ----------
AIR = {"air-france": ("AF", "#002157", "#e30613"), "brussels-airlines": ("BA", "#1f3f8f", "#e30613"), "royal-air-maroc": ("RAM", "#c1272d", "#00674f"), "turkish-airlines": ("TK", "#c8102e", "#ffffff"), "ethiopian": ("ET", "#0b7a3b", "#f1b800"), "camair-co": ("CO", "#0a7d3b", "#f2c500")}
for k, (code, c1, c2) in AIR.items():
    open(f"public/img/airlines/{k}.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="{c1}"/><path d="M0 84 Q60 56 120 84 L120 96 Q60 70 0 96Z" fill="{c2}"/><text x="60" y="62" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="{34 if len(code)<3 else 28}" fill="#fff">{code}</text></svg>')
print("ok")
