const importMap = {
    "imports": {
        "pixi.js": "https://esm.sh/pixi.js@7.4.2",
        "@pixi/core": "https://esm.sh/@pixi/core@7.4.2",
        "@pixi/mesh": "https://esm.sh/@pixi/mesh@7.4.2",
        "@pixi/assets": "https://esm.sh/@pixi/assets@7.4.2",
        "@pixi/display": "https://esm.sh/@pixi/display@7.4.2",
        "@pixi/graphics": "https://esm.sh/@pixi/graphics@7.4.2",
        "@pixi/events": "https://esm.sh/@pixi/events@7.4.2",
        "@pixi/text": "https://esm.sh/@pixi/text@7.4.2",
        "@esotericsoftware/spine-pixi-v7": "https://esm.sh/@esotericsoftware/spine-pixi-v7@4.2.95?external=@pixi/core,@pixi/mesh,@pixi/assets,@pixi/display,@pixi/graphics,@pixi/events,@pixi/text"
    }
};
const im = document.createElement('script');
im.type = 'importmap';
im.textContent = JSON.stringify(importMap);
document.head.appendChild(im);
