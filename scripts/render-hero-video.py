"""Render the original MindQuest artwork as a seamless 8-second cinemagraph.
Requirements: Python 3, Pillow, ffmpeg. No network calls, runtime renderer or audio.
Original raster remains untouched; displacement, eyelids and light are video layers.
Run from the repository root: python3 scripts/render-hero-video.py
"""
import math, random, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'apps/web/public/videos'; OUT.mkdir(parents=True,exist_ok=True)
W,H,FPS,DURATION=1280,854,24,8
S=W/1536
base=Image.open(ROOT/'apps/web/public/images/curiosity-kingdom.png').convert('RGB').resize((W,H),Image.Resampling.LANCZOS)
TAU=math.tau

def field(x,y,t):
    """Periodic mesh displacement: anchored breathing, tail, water and floating books."""
    x/=S;y/=S; p=TAU*t/DURATION
    def g(cx,cy,rx,ry):return math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2)*2)
    owl=g(1120,640,145,200)
    fox=g(1320,590,150,230)
    tail=g(1470,690,105,135)
    fall=g(1078,560,100,110)+g(838,594,35,135)
    def floating(cx,cy,rx,ry):
        radius=((x-cx)/rx)**2+((y-cy)/ry)**2
        return math.exp(-(radius**3)*1.2)
    book=floating(1354,174,95,86)+floating(710,252,90,80)+floating(882,215,48,50)+floating(1440,278,110,85)
    saturn=floating(895,77,145,94)
    moon=floating(1265,58,50,48)
    violet=floating(950,161,36,39)
    sky=g(350,170,520,340)
    dx=(x-1120)*.012*math.sin(p)*owl+(x-1320)*.008*math.sin(p+.8)*fox+6*math.sin(p)*tail+1.8*math.sin(p*4+y/21)*fall+11*math.cos(p)*book+13*math.sin(p)*saturn-9*math.sin(p)*moon+8*math.sin(p+.5)*violet+8*math.sin(p)*sky
    dy=2.2*math.sin(p)*owl+1.7*math.sin(p+.8)*fox+2*math.sin(p+.4)*tail+1.1*math.sin(p*4+y/19)*fall+21*math.sin(p)*book+9*math.cos(p)*saturn+12*math.sin(p)*moon+8*math.cos(p+.5)*violet+4*math.cos(p)*sky
    return dx*S,dy*S

# Stable target rectangles; sample source quadrilaterals each frame.
rects=[(x,y,min(W,x+32),min(H,y+32)) for y in range(0,H,32) for x in range(0,W,32)]
rng=random.Random(421)
particles=[(rng.uniform(750,1510)*S,rng.uniform(220,900)*S,rng.uniform(.7,1.8)*S,rng.random(),rng.choice([1,2])) for _ in range(42)]
# Light texture rendered once; only its intensity changes over the loop.
portal=Image.new('RGB',(W,H));d=ImageDraw.Draw(portal)
for r in range(70,0,-2):
    strength=int((1-r/72)*28)
    d.ellipse(((1096-r*.65)*S,(420-r)*S,(1096+r*.65)*S,(420+r)*S),fill=(strength,int(strength*.63),int(strength*.2)))
portal=portal.filter(ImageFilter.GaussianBlur(9))

def blink(t,center):
    distance=(t-center+DURATION/2)%DURATION-DURATION/2
    return .5+.5*math.cos(math.pi*distance/.16) if abs(distance)<.16 else 0

def eyelid(frame,cx,cy,rx,ry,amount,t,colour,fur):
    if amount<.025:return
    dx,dy=field(cx*S,cy*S,t)
    left=round((cx-rx)*S-dx);top=round((cy-ry)*S-dy)
    width=round(rx*2*S);height=round(ry*2*S)
    mask=Image.new('L',(width,height));m=ImageDraw.Draw(mask)
    m.ellipse((0,0,width-1,height-1),fill=255)
    cover=Image.new('L',(width,height));ImageDraw.Draw(cover).rectangle((0,0,width,height*amount),fill=255)
    mask=ImageChops.multiply(mask,cover).filter(ImageFilter.GaussianBlur(.6))
    texture=base.crop(tuple(round(v*S) for v in fur)).resize((width,height),Image.Resampling.BICUBIC)
    texture=Image.blend(texture,Image.new('RGB',(width,height),colour),.32)
    frame.paste(texture,(left,top),mask)
    if amount>.85:
        line=ImageDraw.Draw(frame)
        line.arc((left+width*.1,top+height*.34,left+width*.9,top+height*.73),0,180,fill=tuple(int(c*.34) for c in colour),width=max(1,round(2*S)))

encoder=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'mindquest-kingdom.mp4')],stdin=subprocess.PIPE)
try:
    for index in range(FPS*DURATION):
        t=index/FPS;p=TAU*t/DURATION;mesh=[];samples={}
        for box in rects:
            x0,y0,x1,y1=box;quad=[]
            for x,y in [(x0,y0),(x0,y1),(x1,y1),(x1,y0)]:
                if (x,y) not in samples:samples[(x,y)]=field(x,y,t)
                dx,dy=samples[(x,y)];quad.extend((x+dx,y+dy))
            mesh.append((box,quad))
        frame=base.transform((W,H),Image.Transform.MESH,mesh,Image.Resampling.BILINEAR)
        owl_blink=max(blink(t,2.2),blink(t,6.1))
        eyelid(frame,1082,587,25,28,owl_blink,t,(130,83,174),(1056,544,1106,556))
        eyelid(frame,1148,598,26,28,owl_blink,t,(130,83,174),(1122,553,1174,565))
        fox_blink=blink(t,4.45)
        eyelid(frame,1264,502,17,20,fox_blink,t,(204,111,42),(1254,469,1287,480))
        eyelid(frame,1328,515,24,20,fox_blink,t,(214,124,50),(1308,479,1354,490))
        light=portal.point(lambda value:int(value*(.55+.45*math.sin(p*2))))
        frame=ImageChops.screen(frame,light)
        overlay=Image.new('RGBA',(W,H));paint=ImageDraw.Draw(overlay)
        for cx,cy,r,offset,speed in particles:
            phase=(t/DURATION*speed+offset)%1
            alpha=int(math.sin(math.pi*phase)**2*150)
            x=cx+8*S*math.sin(TAU*phase);y=cy-45*S*phase
            paint.ellipse((x-r,y-r,x+r,y+r),fill=(255,222,145,alpha))
        # Slow, seamless shooting stars and twinkling constellations in the upper sky.
        for offset in [0,.5]:
            phase=(t/DURATION+offset)%1
            alpha=int(math.sin(math.pi*phase)**6*200)
            hx=(1480-620*phase)*S;hy=(25+270*phase)*S
            for trail in range(14):
                fade=alpha*(1-trail/14)
                paint.line((hx+trail*4*S,hy-trail*1.7*S,hx+(trail+1)*4*S,hy-(trail+1)*1.7*S),fill=(195,221,255,int(fade)),width=2)
            paint.ellipse((hx-2,hy-2,hx+2,hy+2),fill=(240,247,255,alpha))
        for j in range(12):
            sx=(650+(j*97)%820)*S;sy=(30+(j*43)%245)*S
            alpha=int((.5+.5*math.sin(p*2+j))**3*150)
            paint.line((sx-3,sy,sx+3,sy),fill=(255,231,177,alpha),width=1)
            paint.line((sx,sy-3,sx,sy+3),fill=(255,231,177,alpha),width=1)
        # Moving highlights confined to the falling-water bands.
        for x,y0,y1,width in [(836,500,650,13),(1072,501,631,12),(1111,504,612,9),(635,716,782,8)]:
            for j in range(5):
                phase=(t/DURATION*4+j/5)%1;y=y0+(y1-y0)*phase
                alpha=int(math.sin(math.pi*phase)**2*52)
                paint.line(((x+math.sin(phase*TAU)*2)*S,y*S,(x+width*.2)*S,(y+12)*S),fill=(185,234,255,alpha),width=max(1,round(width*.15*S)))
        frame=Image.alpha_composite(frame.convert('RGBA'),overlay).convert('RGB')
        # A gentle camera push and orbit completes the cinematic depth movement.
        zoom=1.035+.010*math.sin(p)
        size=(round(W*zoom),round(H*zoom))
        frame=frame.resize(size,Image.Resampling.BICUBIC)
        left=round((size[0]-W)/2+8*math.sin(p));top=round((size[1]-H)/2+5*math.cos(p))
        frame=frame.crop((left,top,left+W,top+H))
        encoder.stdin.write(frame.tobytes())
        if index%48==0:print(f'Rendered {index}/{FPS*DURATION} frames',flush=True)
finally:
    encoder.stdin.close()
if encoder.wait()!=0:raise SystemExit('Video encoding failed')
commands=[
 ['-i',str(OUT/'mindquest-kingdom.mp4'),'-an','-c:v','libvpx-vp9','-crf','34','-b:v','0','-cpu-used','4','-row-mt','1',str(OUT/'mindquest-kingdom.webm')],
 ['-i',str(OUT/'mindquest-kingdom.mp4'),'-vf','scale=768:512','-an','-c:v','libx264','-preset','medium','-crf','26','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'mindquest-kingdom-mobile.mp4')],
 ['-i',str(OUT/'mindquest-kingdom.mp4'),'-frames:v','1','-q:v','80',str(OUT/'mindquest-kingdom-poster.webp')],
]
for command in commands:subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*command],check=True)
for path in sorted(OUT.glob('mindquest-kingdom*')):print(f'{path.name}: {path.stat().st_size/1024:.0f} KiB')
