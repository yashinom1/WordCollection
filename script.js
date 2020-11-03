const { Player } = TextAliveApp;
let sw = 0,sh = 0;//画面サイズ　縦：ｓｈ　横：ｓｗ
let particles = [];//パーティクルコンテナ
let app; //pixi app
let bar;
let bar_dx;//pointerとbarとのずれ
let textlist = [];//描画されているコンテナ
let textpos = [];//テキストが生成される横の位置
let pdown = false;//
let keyFlag = 0;//押しているキーのフラグ
let prepos;//一つ前のcharの位置
let precolor;//一つ前のcharの色

let c; //歌詞
let timeoutId = false;

//初期値
const bar_y = 150;//barの高さ
const bar_w = 0.15;//横幅
const bar_h = 15;//縦幅
const barspace = 10;//barの余白
const textspace = 10;
const header = 100;//ヘッダの高さ
const box_x = 20;//テキストのboxsize
const box_y = 20;
const box_ra = 30;
const textspeed = 5.0;//テキストが流れるスピード
const f_size = 40;//フォントサイズ
const text_h = 650;//テキストコンテナの高さ

const colortx =[
    ['0xff0009','0xffb3b5'],//red
    ['0x0009ff','0xb3b5ff'],//blue
    ['0x00f0f0','0xb3fffc'],//bluegreen
    ['0xfff700','0xfffcb3'],//yellow
    ['0xff7700','0xffd6b3'],//orange
    ['0xff0088','0xffb3db']//pink
]


/** 
 *歌詞が作られる位置を決める関数
 *一定幅ごとに歌詞の横位置を決める
 */
function makeposition(){
    let center = sw / 2 - box_ra;
    textpos.push(center);
    
    let i = 1;
    let pos;
    while(1){
        pos = center + (box_ra*2 + textspace*(sw/800)) * i;
        textpos.push(pos);
        pos = center - (box_ra*2 + textspace*(sw/800)) * i;
        textpos.push(pos);
        i++;
        if(pos < 70)
            break;
    }

    textpos.sort(function(a,b){
        return a-b;
    })
    prepos = Math.floor(Math.random()*textpos.length);
    console.log(textpos)
}

/*歌詞の流れる位置を決める関数*/
function decpos(){
    let position = prepos;
        switch(prepos){
            case 0:
                position += 1;
                break;
            case textpos.length-1 :
                position -= 1;
                break;
            default :
                let i = Math.floor(Math.random() *2);
                if(i==0)
                    position += 1;
                else
                    position -= 1;
                break;
        }
    prepos = position;
    return position;
}

/*charが板に当たったときのparticleを作る関数*/
function makeParticle(x,y,color){

    for(i=0;i<2;i++){

        let num = Math.floor(Math.random() * (40 + 1 - 10)) + 10;

        var t = new PIXI.Text('★',
        {
            fontSize: num,
            fill: colortx[color][0] 
        });

        t.x = x-num/2;
        t.y = y-num/2;
        t.vx = app.screen.width * 0.0030 * (Math.random() - 0.5); 
        t.vy = app.screen.width * 0.0030 * (Math.random() - 1);
        t.life = 50;

        particles.push(t);
        app.stage.addChild(t);
    }

    for(i=0;i<2;i++){

        let num = Math.floor(Math.random() * (40 + 1 - 10)) + 10;

        var t = new PIXI.Text('♪',
        {
            fontSize: num,
            fill: colortx[color][0] 
        })

        t.x = x-num/2;
        t.y = y-num/2;
        t.vx = app.screen.width * 0.0030 * (Math.random() - 0.5); 
        t.vy = app.screen.width * 0.0030 * (Math.random() - 1);
        t.life = 50;

        particles.push(t);
        app.stage.addChild(t);
    }
}

/** 
 *板を作る関数
 */
function makebar(){

    bar = new PIXI.Graphics()
    .lineStyle(2,'0xffffff',1)
    .drawRect(sw/2-sw*bar_w,sh-bar_y,sw*2*bar_w,bar_h);

    bar.long = sw*bar_w;
    bar.zIndex=500;

    app.stage.addChild(bar);

    let rect = new PIXI.Rectangle(sw/2-sw*bar_w,sh-bar_y,sw*2*bar_w,sh-bar_y);
    bar.hitArea = rect;
    
    bar.interactive = true;
    bar.buttonMode = true;
    bar.on('pointerdown',pointdown);
    bar.on('pointermove',pointmove);
}  

/**
 * charを囲む図形を描く
 * @param type 形（0:円、1:ダイヤ、2:六角形)
 * @param color 色
 */
function makebox(type,color){
    let box;
    switch(type) {
        case 0:
            box = new PIXI.Graphics()
            .lineStyle(2,colortx[color][1],1)
            .drawCircle(box_x,box_y,box_ra-2)  //円を描く（中心ｘ、中心ｙ、半径）
            break;
        case 1:
            box = new PIXI.Graphics()
            .lineStyle(2,colortx[color][1],1)
            .drawPolygon([
                box_x+box_ra,box_y,
                box_x,box_y-box_ra,
                box_x-box_ra,box_y,
                box_x,box_y+box_ra
            ]);
            break;
        case 2:
            box = new PIXI.Graphics()
            .lineStyle(2,colortx[color][1],1)
            .drawPolygon([
                box_x+box_ra*Math.cos(Math.PI/6),box_y+box_ra*Math.sin(Math.PI/6),
                box_x,box_y+box_ra,
                box_x+box_ra*Math.cos(Math.PI*5/6),box_y+box_ra*Math.sin(Math.PI*5/6),
                box_x+box_ra*Math.cos(Math.PI*7/6),box_y+box_ra*Math.sin(Math.PI*7/6),
                box_x,box_y-box_ra,
                box_x+box_ra*Math.cos(Math.PI*11/6),box_y+box_ra*Math.sin(Math.PI*11/6)
            ]);
            break;
    
        default:
            return false;
    }
    box.zIndex = 100;
    
    return box;
}

/**
 * charのグラデーションを作る
 * @param char 歌詞
 * @param f_wo 単語のはじめの文字かどうか
 */
function maketext(char,f_wo){
    let type;

    //単語の初めの文字なら色を変える
    if(f_wo){
        type = Math.floor(Math.random()*6);
        precolor = type;
    }
    else{
        type = precolor;
    }

    let textstyle = new PIXI.TextStyle({
        fill:[
            colortx[type][1],
            colortx[type][0],
            colortx[type][1]
        ],
        fillGradientStops:[
            0,
            0.3,
            1
        ],
        fontSize: f_size
    });

    let text = new PIXI.Text(char,textstyle);
    return text;
}

/**
 * appに表示される歌詞のコンテナを作る
 * @param char 発声される文字
 * @param f_wo 単語のはじめの文字であるかどうか
 * @param starttime 発声される文字の発声位置
 */
function makechar(char,f_wo,starttime) {
    
    //コンテナ作成
    let charContainer = new PIXI.Container();
    let position = decpos();

    charContainer.x = textpos[position];
    charContainer.y = sh - text_h;
    charContainer.starttime = starttime;
    charContainer.b_type= Math.floor(Math.random()*3);
    
    charContainer.flag = true;//パーティクル用
    charContainer.b_over = true;//barの上に文字があるかどうか
    
    app.stage.addChild(charContainer);

    let text = maketext(char,f_wo);
    charContainer.c_type = precolor;
    let box = makebox(charContainer.b_type,charContainer.c_type);

    charContainer.addChild(box);
    charContainer.addChild(text);

    textlist.push(charContainer);

}

function animation(delta){//アニメーション

    switch(keyFlag) {
        case 1:
            if(bar.x+bar.long < (sw/2-barspace)){
                bar.x += 3;
            }
            break;
        case 2:
            if(bar.x-bar.long > (-sw/2+barspace)){
                bar.x -= 3;
            }
            break;
        default:
            break;
    }

    let bleft = sw/2+bar.x-bar.long;
    let bright = sw/2+bar.x+bar.long;

    for(i=0;i<textlist.length;i++){
        textlist[i].y += textspeed*delta;

        //文字の発声時間を超えたとき
        if(/*textlist[i].y+box_y*2 > sh-bar_y*/ textlist[i].starttime < player.timer.position){
            //文字がbarの横幅を超えないとき
            if(textlist[i].x+box_x>=bleft && textlist[i].x-box_x<=bright){
                //パーティクルの関数を呼んでなくて、barの位置より上に文字がある時
                if(textlist[i].flag && textlist[i].b_over){
                    textlist[i].flag =false;
                    let x = textlist[i].x
                    let color = textlist[i].c_type;
                    app.stage.removeChild(textlist[i]);
                    textlist.splice(i,1);
                    makeParticle(x,sh-bar_y,color);
                    continue;
                }
            }
            textlist[i].b_over = false;
        }
    
        /*文字の高さがappの縦幅を超えたとき
         (appから見えなくなった時に文字を削除する)*/
        if(textlist[i].y+box_y*2 > sh+100){
            app.stage.removeChild(textlist[i]);
            textlist.splice(i,1);
        }
    }

    for(let i=0;i<particles.length;i++){
        const particle = particles[i];
        particle.alpha -= 0.02;
        particle.life -= 1;
        
        particle.x += particle.vx;
        particle.y += particle.vy;
    
        if (particle.life <= 0) {
            // コンテナから削除
            app.stage.removeChild(particle);
            // 配列からも削除(i番目から1個削除)
            particles.splice(i, 1);
        }
    }
}

//barがタッチされたときに呼ばれる
function pointdown(event){
    pdown = true;
    bar_dx = event.data.getLocalPosition(app.stage).x - (bar.x +sw/2);
}

//barがタッチされて動かされているとき
function pointmove(event){
    if(pdown){
        let position = event.data.getLocalPosition(app.stage);
        if((position.x + bar.long - bar_dx < sw - barspace) && (position.x - bar.long - bar_dx > barspace)){
            bar.x = position.x -sw/2 - bar_dx;
        }
    }
}

//barのタッチが解除されたときに呼ばれる
function pointup(event){
    pdown = false;
}

window.addEventListener('load',() =>{
    sw = document.body.clientWidth;
    sh = document.documentElement.clientHeight - header;

    app = new PIXI.Application({
        width: sw,                 // スクリーン(ビュー)横幅 
        height: sh,                // スクリーン(ビュー)縦幅  
        backgroundColor: 0x202020,  // 背景色 16進 0xRRGGBB
        autoDensity: true,
        antialias: true
    });

    let el = document.getElementById('app');
    el.appendChild(app.view);
    
    app.stage.sortableChildren = true;
    app.ticker.add(delta => {animation(delta)});
    
    makebar();
    makeposition();
})

/** 
 * 画面リサイズ時に呼ばれる
 * 画面サイズを取得してステージを作る
 * */
function onresize(){
    player.requestPause();
    if(timeoutId !== false){
        clearTimeout( timeoutId );
    }

    timeoutId = setTimeout(function(){
        sw = document.body.clientWidth;
        sh = document.documentElement.clientHeight - header;
        
        particles = [];//パーティクル、テキストを初期化
        textlist = [];
        textpos = [];
    
        console.log("resize1")
        
        while(app.stage.children[0]){
            app.stage.removeChild(app.stage.children[0]);
        }

        app.renderer.resize(sw,sh);
        makeposition();
        makebar();

    }, 500);
}

/*appの子要素(charcontainer)を消す*/
function removechildren(){
    textlist = [];
    while(app.stage.children[1]){//表示されている板は残す
        app.stage.removeChild(app.stage.children[0]);
    }
    if(app.stage.children[0] == null){
        makebar();
    }
}  

window.addEventListener("keydown", (event) => { this.downHandler(event) },false);
window.addEventListener("keyup", (event) => { this.upHandler(event) },false);
window.addEventListener("pointerup", (event) => { this.pointup(event) },false);
window.addEventListener('resize',() => {this.onresize()},false);

/*キーが押されたときに呼ばれる*/
function downHandler(event) {
    switch(event.key) {
      case 'ArrowRight':
        keyFlag = 1;
        break;
      case 'ArrowLeft':
        keyFlag = 2;
        break;
    }
}

/*キーが離された時に呼ばれる*/
function upHandler(event) {
    keyFlag = 0;
}


const player = new Player({
    app: true,
    mediaElement: document.querySelector("#media")
});

player.addListener({
    onAppReady,
    onAppMediaChange,
    //onVideoReady,
    onTimerReady,
    onTimeUpdate,
    onPlay,
    onPause,  
    onStop,
})

function onAppReady(app){
    if(!app.managed){
      // グリーンライツ・セレナーデ / Omoi feat. 初音ミク
      // - 初音ミク「マジカルミライ 2018」テーマソング
      // - 楽曲: http://www.youtube.com/watch?v=XSLhsjepelI
      // - 歌詞: https://piapro.jp/t/61Y2
      player.createFromSongUrl("http://www.youtube.com/watch?v=XSLhsjepelI");
      
      // ブレス・ユア・ブレス / 和田たけあき feat. 初音ミク
      // - 初音ミク「マジカルミライ 2019」テーマソング
      // - 楽曲: http://www.youtube.com/watch?v=a-Nf3QUFkOU
      // - 歌詞: https://piapro.jp/t/Ytwu
      //player.createFromSongUrl("http://www.youtube.com/watch?v=a-Nf3QUFkOU");
      
      // 愛されなくても君がいる / ピノキオピー feat. 初音ミク
      // - 初音ミク「マジカルミライ 2020」テーマソング
      // - 楽曲: http://www.youtube.com/watch?v=ygY2qObZv24
      // - 歌詞: https://piapro.jp/t/PLR7
      // player.createFromSongUrl("http://www.youtube.com/watch?v=ygY2qObZv24");
    }
    else{
        document.querySelector("#control").className = "disabled";
    }
    /*if (!app.songUrl) {
        player.createFromSongUrl("http://www.youtube.com/watch?v=XSLhsjepelI");
    }*/
}

function onAppMediaChange(){
    overlay.className="";
    control.className="";
    setChar();
}

function onTimerReady(){
    loading.className = "disabled"
    start.className = "indication"
    control.className = "able"
}

function onTimeUpdate(position){
    if (c && c.startTime > position + 2000) {//巻き戻された時
        setChar();
    }

    let f_wo = false;
    let current = c || player.video.firstChar;
    while(current && current.startTime < position + 1600){
        if(c !== current){
            if(current.parent.pos !== 'S'){
                if(current.parent.firstChar === current){
                    f_wo = true;
                }
                console.log(current.text)
                let starttime = current.startTime;
                makechar(current._data.char,f_wo,starttime);
                c = current;
            }
        }
        current = current.next;
    }
}

function onPlay(){
    overlay.className = "disabled";
    const a = document.querySelector('#play');
    a.classList.replace('fa-play-circle','fa-pause-circle');
}

function onPause(){
    const a = document.querySelector('#play');
    a.classList.replace('fa-pause-circle','fa-play-circle')
    setChar();
}

function onStop(){
}

/* 再生位置のcharを探す関数*/
function setChar(){
    control.className="";
    c = null;
    let c_pre;
    let d = player.video.firstChar;
    console.log(d)
    while(d && d.startTime < player.timer.position + 1600){
        c_pre = d;
        d = d.next;
        console.log('resetchar1');
    }
    c = c_pre;//再生位置の一つ前の歌詞を今の歌詞として代入
    control.className="able";
    removechildren();
    
    console.log('resetchar');
}

document.getElementById('play').addEventListener("click",(e) => {
    e.preventDefault();
    if(player){
        if(player.isPlaying){
            player.requestPause();
        }else{
            player.requestPlay();
        }
    }
    return false;
});

document.getElementById('stop').addEventListener("click",(e) =>{
    e.preventDefault();
    console.log('click')
    if(player){
        player.requestStop();
        setTimeout(function(){
            setChar();
        },200)
    }
    return false;
});


