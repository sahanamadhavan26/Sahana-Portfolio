"""Generate a professional 1200x630 LinkedIn portfolio preview, no phone image."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math

W,H=1200,630
im=Image.new("RGB",(W,H),"#faf9f6")
d=ImageDraw.Draw(im)
navy="#10182b"; ink="#131720"; muted="#555d6c"; blue="#476cf1"
d.rectangle((735,0,W,H),fill=navy)
d.ellipse((1050,420,1450,820),fill="#18264a")
def font(size,bold=False):
    paths=(["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"] if bold else ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"])
    return ImageFont.truetype(paths[0],size)
def txt(x,y,s,size,color,bold=False):
    d.text((x,y),s,font=font(size,bold),fill=color)
def rounded(rect,fill,r=18,outline=None,width=1):
    d.rounded_rectangle(rect,radius=r,fill=fill,outline=outline,width=width)
txt(55,95,"PRODUCT MANAGER PORTFOLIO",17,"#737a89")
txt(55,146,"Sahana Madhavan",48,ink,True)
txt(55,242,"Enterprise SaaS, AI features from concept",23,muted)
txt(55,279,"to launch, and data-driven product decisions.",23,muted)
tags=[("Product","#e7edff","#315be3"),("AI","#f0e7ff","#7343d9"),("Analytics","#e2f4ef","#087e68"),("Customer Success","#fff0e6","#b95a21")]
x=55
for label,bg,fg in tags:
    w=int(d.textlength(label,font=font(17,True)))+32
    rounded((x,500,x+w,541),bg,20)
    txt(x+16,509,label,17,fg,True)
    x+=w+11
# Dashboard: illustrative UI, with grounded synthetic Product Pulse figures.
rounded((766,45,1167,268),"#1b2b50",23,outline="#3a5388",width=2)
txt(789,66,"PRODUCT PULSE",16,"#b7c6ed",True)
txt(789,97,"Activation & Retention",20,"#ffffff",True)
bars=[48,66,59,82,97,75,112]
for i,h in enumerate(bars):
    xx=803+i*49
    rounded((xx,231-h,xx+30,231),["#6e63ec","#597cf3","#3d91f5","#2cc4aa"][i%4],5)
d.line((792,234,1142,234),fill="#425374",width=2)
rounded((761,290,947,410),"#ffffff",16)
txt(778,305,"TOTAL USERS",13,"#566174",True)
txt(778,332,"6,000",32,navy,True)
txt(778,376,"Synthetic dataset",12,"#607084")
rounded((965,290,1167,410),"#ffffff",16)
txt(982,305,"ACTIVATION",13,"#566174",True)
txt(982,332,"53.6%",32,navy,True)
txt(982,376,"Product Pulse",12,"#607084")
rounded((761,429,1167,586),"#1b2b50",18,outline="#3a5388",width=2)
txt(784,447,"PRODUCT PROCESS",15,"#dce5ff",True)
steps=[("Discover","#9c75f5"),("Prioritize","#518df8"),("Build","#36c9ae"),("Launch","#ffd164")]
for i,(label,color) in enumerate(steps):
    cx=807+i*105
    if i<3: d.line((cx+10,510,cx+105,510),fill="#49638f",width=5)
    d.ellipse((cx-9,501,cx+9,519),fill=color)
    txt(cx-29,536,label,13,"#ffffff")
out=Path("assets/img/og-image.png")
out.parent.mkdir(parents=True,exist_ok=True)
im.save(out,optimize=True)
print("Generated",out,im.size)
