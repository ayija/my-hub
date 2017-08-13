
Array.prototype.max = function() {
  return Math.max.apply(null, this);
};
Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
Object.prototype.clone = function(){
    return JSON.parse(JSON.stringify(this));
}
if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

var conf = {
    init:function(){
        this.list = {
            rainbowColor:[
                {name:'orange',color:'#F59678'}
                ,{name:'yellow',color:'#FFF879'}
                ,{name:'green',color:'#72CA7E'}
                ,{name:'blue',color:'#8DDAF8'}
                ,{name:'indigo',color:'#4695D0'}
                ,{name:'violet',color:'#926AB1'}
                ,{name:'red',color:'#F35E64'}
            ]
            ,tetrisBody:[
                {name:'t',pattern:[
                    [0,1,0],
                    [1,1,1],
                    [0,0,0]
                ]}
                ,{name:'o',pattern:[
                    [1,1],
                    [1,1]
                ]}
                ,{name:'s',pattern:[
                    [0,1,1],
                    [1,1,0],
                    [0,0,0]
                ]}
                ,{name:'z',pattern:[
                    [1,1,0],
                    [0,1,1],
                    [0,0,0]
                ]}
                ,{name:'l',pattern:[
                    [0,1,0],
                    [0,1,0],
                    [0,1,1]
                ]}
                ,{name:'j',pattern:[
                    [0,1,0],
                    [0,1,0],
                    [1,1,0]
                ]}
                ,{name:'i',pattern:[
                    [0,1,0,0],
                    [0,1,0,0],
                    [0,1,0,0],
                    [0,1,0,0]
                ]}
            ]
            ,snakeBody:[
                {name:'i',pattern:[
                    [1],
                    [1],
                    [1],
                    [1],
                    [1]
                ]}
            ]
        };
        this.general = [
            {
                name: 'tetris'
                ,grid:20
                ,gutter:1
                ,tilex:14
                ,tiley:20
                ,fps:16
                ,moveDelay:8
                ,caterpillarInertia:false
                ,updateInertia:false
                ,circularBound:false
                ,forbidRotate:false
                ,forbidOpposite:false
                ,forbidMoveUp:true
                ,collideAsObsWithoutObs:40
                ,collideAsObsWithObs:38
                ,collideTypeToOver:2
                ,aggregateObstacle:true
                ,aggregatePlayer:false
                ,randomFillObstacle:false
            }
            ,{
                name: 'snake'
                ,grid:20
                ,gutter:1
                ,tilex:20
                ,tiley:20
                ,fps:20
                ,moveDelay:2
                ,caterpillarInertia:true
                ,updateInertia:true
                ,circularBound:true
                ,forbidRotate:true
                ,forbidOpposite:true
                ,forbidMoveUp:false
                ,collideAsObsWithoutObs:-1
                ,collideAsObsWithObs:-1
                ,collideTypeToOver:3
                ,aggregateObstacle:false
                ,aggregatePlayer:true
                ,randomFillObstacle:true
            }
        ];
        this.player = [
            {
                name: 'tetris'
                ,bodylist: this.list.tetrisBody
                ,bodyidx: -1
                ,colorlist: this.list.rainbowColor
                ,coloridx: -1
                ,margin: null
                ,pos:{x: this.general[0].tilex/2-this.general[0].gutter
                    ,y: -2}
                ,inertia: 40
            }
            ,{
                name: 'snake'
                ,bodylist: this.list.snakeBody
                ,bodyidx: -1
                ,colorlist: this.list.rainbowColor
                ,coloridx: -1
                ,margin: null
                ,pos:{x: this.general[1].tilex/2-this.general[1].gutter
                    ,y: this.general[1].tiley/2-this.general[1].gutter}
                ,inertia: 38
            }
        ];

        var newGeneral = [];
        for(i=0;i<this.general.length;i++)
            newGeneral.push( Object.assign(this.general[i], this.player[i] ) );
        this.general = newGeneral;
    }
    ,getAppPreset(){
        var id = oct.getAppId();
        if(id<conf.getPresetSize())
            return this.general[id];
    }
    ,getPreset(id){
        if(id<conf.getPresetSize())
            return this.general[id];
    }
    ,getPresetSize(){
        return this.general.length;
    }
}

var model = {
    init:function(){
        if (!localStorage.ayijaRecord) {
            console.log('Creating ayija game records...');
            var recordArr = [];
            for(i=0;i<conf.getPresetSize();i++)
                recordArr.push({score:0});
            localStorage.ayijaRecord = JSON.stringify(recordArr);
        }
        this.player = {
            body: []
            ,color: "blue"
            ,margin: null
            ,pos:{x: null
                ,y: null}
            ,inertia: null
        };
        this.obstacle = [];
        this.score = 0;
        this.initObstacle();
        this.initPlayer(); //player will be generated from obstacles
    }
    ,getPlayer:function(){
        return this.player;
    }
    ,getObstacle:function(){
        return this.obstacle;
    }
    ,getScore:function(){
        return this.score;
    }
    ,getRecord:function(idx){
        var record = JSON.parse(localStorage.ayijaRecord);
        if(idx==null) return record;
        return record[idx];
    }
    ,getAppPreset:function(){
        return conf.getAppPreset();
    }
    ,initPlayer:function(){
        var appPreset = this.getAppPreset();
        //init a default player without body
        var player = (this.getPlayer()).clone();
        var coloridx = appPreset.coloridx==-1?Math.floor(Math.random()*appPreset.colorlist.length):appPreset.coloridx;
        player.color = appPreset.colorlist[coloridx].color;
        player.inertia = appPreset.inertia;
        player.pos = {x:appPreset.pos.x, y:appPreset.pos.y};
        this.setPlayer(player);

        //tbc: to decoupling
        //update the player body
        var bodyidx = appPreset.bodyidx==-1?Math.floor(Math.random()*appPreset.bodylist.length):appPreset.bodyidx;
        var body = appPreset.bodylist[bodyidx].pattern;
        oct.changePlayerBody(body, player.pos);
    }
    ,initObstacle:function(){
        var appPreset = this.getAppPreset();
        var obs = [];
        for(i=0;i<appPreset.tiley;i++){
            obs[i]=[];
            for(j=0;j<appPreset.tilex;j++)
                obs[i][j]=0;
        }
        
        if(appPreset.randomFillObstacle){
            var coloridx = appPreset.coloridx==-1?Math.floor(Math.random()*appPreset.colorlist.length):appPreset.coloridx;
            obs[Math.floor(Math.random()*appPreset.tilex)][Math.floor(Math.random()*appPreset.tiley)]=appPreset.colorlist[coloridx].color;        
        }
            
        this.setObstacle(obs);
    }
    ,setPlayer:function(obj,tgt){
        //update player
        if(tgt==null) this.player = obj;
        //update player's property
        else this.player[tgt] = obj;
    }
    ,setObstacle:function(obs,src,mode){
        //add obstacle by comparing with player
        if(mode!=null&&mode=='remove')
            for(i=0;i<src.length;i++)
                obs.unshift(obs.splice(src[i],1)[0].fill(0));
        //add obstacle by comparing with player
        else if(mode!=null&&mode=='add')
            for(i=0;i<src.body.length;i++)
                for(j=0;j<src.body[i].length;j++)
                    if( src.body[i][j]
                        && src.body[i][j].y<obs.length&&src.body[i][j].y>=0
                        && src.body[i][j].x<obs[0].length&&src.body[i][j].x>=0
                    )
                        obs[src.body[i][j].y][src.body[i][j].x]=src.color;
        
        //regular replacement update
        this.obstacle = obs;
    }
    ,changeScore:function(score){
        this.score = score;
    }
    ,changeRecord:function(record,idx){
        if(idx==null)
            localStorage.ayijaRecord = JSON.stringify(record);
        else{
            var records = this.getRecord();
            records[idx] = record;
            localStorage.ayijaRecord = JSON.stringify(records);
        } 
    }
}
var oct = {
    init:function(){
        this.appState = 1;
        this.currAppId = 0;
        this.moveDelay = 0;

        conf.init();
        model.init();
        view.init();

        this.createEventListener();
        this.createFrameThread();
    }
    ,createEventListener:function(){
        document.addEventListener("keydown",this.respondKeydown);
    }
    ,createFrameThread:function(){
        setInterval(function(){
            oct.changeMoveDelay();
            oct.respondAppState();
        },1000/this.getAppPreset().fps);
    }
    ,getMoveDelay(){
        return this.moveDelay;
    }
    ,changeMoveDelay(){
        var moveDelay = this.moveDelay+1;
        if(moveDelay==conf.getAppPreset().moveDelay) moveDelay = 0;
        this.moveDelay = moveDelay;
    }
    ,getPlayer:function(){
        return model.getPlayer();
    }
    ,getObstacle:function(){
        return model.getObstacle();
    }
    ,getScore:function(){
        return model.getScore();
    }
    ,getRecord:function(){
        return model.getRecord( this.getAppId() );
    }
    ,getAppState:function(){
        return this.appState;
    }
    ,getAppId:function(){
        return this.currAppId;
    }
    ,getAppPreset:function(){
        return conf.getAppPreset();
    }
    ,respondAppState:function(){
        if(this.getAppState()==1 && document.hasFocus())
            this.changeAppState('active');
        else if(this.getAppState()==1 && !document.hasFocus())
            this.changeAppState('suspend');
    }
    ,respondKeydown:function(event){
        var appPreset = oct.getAppPreset();
        //press space to continue
        if(event.keyCode==32){
            event.preventDefault();
            if(oct.getAppState()==-1) oct.changeAppState('activate');
            else if(oct.getAppState()==0) oct.changeAppState('active');
            else if(oct.getAppState()==1) oct.changeAppState('suspend');
        }
        //press enter/shift to rotate
        else if(!appPreset.forbidRotate&&(event.keyCode==13||event.keyCode==16)){
            event.preventDefault();

            var pattern = oct.getPlayer();
            oct.changePlayerBody( oct.getRotationOfMatrix(pattern.body), pattern.pos );
        }
        //joystick move
        else if(event.keyCode<=40&&event.keyCode>=37){
            event.preventDefault();

            if(appPreset.updateInertia) oct.changePlayerInertia(event.keyCode);
            else oct.changePlayerPos(event.keyCode);
        }
        //app switch
        else if(event.keyCode>=49&&event.keyCode<=50)
            oct.changeAppId(event.keyCode-48-1);
    }
    ,respondCollide:function(type){
        var appPreset = this.getAppPreset();
        //if encounter collision, apply the collision rules
        //obstacle collision (type 1)
        if(type==1){
            if(appPreset.aggregateObstacle) {
                this.setObstacle(this.getObstacle(),this.getPlayer(),'add');
                var rowIdxs = this.getRowsOfFilledObstacle(this.getObstacle());
                this.changeScore(rowIdxs.length);
                this.setObstacle(this.getObstacle(),rowIdxs,'remove');
            }
            else this.initAppObstacle();

            if(appPreset.aggregatePlayer) {
                this.changeScore(1);
                this.changePlayerBody(this.getPlayer().body, this.getPosNext(this.getPlayer().inertia, this.getPlayer().pos), 'append');
            }
            else this.initAppPlayer();
        }
        //Normally self collision (type 3) and top-boundary-and-obstacle collison (type 2)
        else if(type==appPreset.collideTypeToOver) this.changeAppState('destroy');
    }
    ,getCollideWithAppAll:function(pos,playerLite,obs){
        var appPreset = this.getAppPreset();
        if( (isCollided = this.isCollidedWithAppObs(pos,playerLite,obs))>0 ) return isCollided;
        
        if( appPreset.circularBound ) return false;

        //add hit-obstacle to the collision conditions alongside hit-boundary
        if(appPreset.collideAsObsWithObs!=this.isCollideWithAppBound(pos,playerLite.margin))
            return this.isCollideWithAppBound(pos,playerLite.margin);
        
        return false;
    }
    ,isCollideWithAppBound:function(pos,margin){
        var appPreset = this.getAppPreset();
        if(pos.x+margin.x1>appPreset.tilex-1) return 39;
        if(pos.x+margin.x0<0) return 37;
        if(pos.y+margin.y0<0) return 38;
        if(pos.y+margin.y1>appPreset.tiley-1) return 40;

        return false;
    }
    ,isCollidedWithAppObs:function(pos,playerLite,obs){
        var appPreset = this.getAppPreset();
        //collide condition A&B: the obstacle and the boundary-as-obstacle
        var boundDir = this.isCollideWithAppBound(pos,playerLite.margin);
        //collide condition C: the body pattern
        var m = this.getPosOfMatrix(playerLite.body, pos, appPreset.caterpillarInertia?"caterpillar":null);
        //collide condition D: the body position
        var collideBodyAsObs = appPreset.caterpillarInertia && this.isCollideWithMatrix(pos, playerLite.body);

        for(i=0;i<m.length;i++)
            for(j=0;j<m[i].length;j++)
                if( m[i][j]!=0 )
                    if (
                        appPreset.collideAsObsWithoutObs==boundDir
                        || (
                        m[i][j].y<obs.length&&m[i][j].y>=0
                        && m[i][j].x<obs[0].length&&m[i][j].x>=0
                        && obs[m[i][j].y][m[i][j].x]!=0
                        )
                    )
                        if(appPreset.collideAsObsWithObs==boundDir)
                            return 2;
                        else return 1;
                    else if( collideBodyAsObs )
                        return 3;
        return false;
    }
    ,isCollideWithMatrix:function(pos,m){
        for(i=0;i<m.length;i++)
            for(j=0;j<m[i].length;j++)
                if( m[i][j]!=0 
                    && m[i][j].y==pos.y 
                    && m[i][j].x==pos.x
                )
                return true;
        return false;
    }
    ,isCollideWithOppDir:function(keycode,newKeycode){
        var keySum = keycode+newKeycode;
        return (keySum==76||keySum==78);
    }
    ,initAppPlayer:function(){
        model.initPlayer(this.getAppId());
    }
    ,initAppObstacle:function(){
        model.initObstacle(this.getAppId());
    }
    ,setPlayer:function(obj,tgt){
        model.setPlayer(obj,tgt);
    }
    ,setObstacle:function(obs,src,mode){
        model.setObstacle(obs,src,mode);
    }
    ,changePlayerBody:function(m,pos,append){
        if(append!=null&&append){
            m.unshift([pos]);
            //update the latest pointer of position
            this.setPlayer(pos, 'pos');
        } 
        var inertia = this.getPlayer().inertia;
        var obs = this.getObstacle();
        //position pointer will not be considered as next position during getCollideWithAppAll()
        var nextPos = this.getPosNext(inertia,pos);
        //the body-position matrix is based on a body-pattern matrix normally
        //if the matrix has appended a new element, it does not need to recalculate from the pattern
        var pattern = {body:null, margin:null};
        pattern.body = this.getPosOfMatrix(m, pos, append?'caterpillar':'pattern');
        pattern.margin = this.getMarginOfMatrix(m);

        var isCollided = this.getCollideWithAppAll(nextPos, pattern, obs);
        if(!isCollided){
            this.setPlayer(pattern.body, 'body');
            this.setPlayer(pattern.margin, 'margin');
        }
        else {
            //console.log("changePlayerBody Collided: "+isCollided);
            //ignore obstacle collisions
            if(isCollided>1) this.respondCollide(isCollided);
        }
    }
    ,changePlayerPos:function(keycode){
        var appPreset = this.getAppPreset();
        var player = this.getPlayer();
        var nextPos = this.getPosNext(keycode, player.pos);
        var obs = this.getObstacle();

        var isCollided = this.getCollideWithAppAll(nextPos, player, obs);

        if(!isCollided){
            var nextBody = this.getPosOfMatrix(player.body, nextPos, appPreset.caterpillarInertia?"caterpillar":"pattern");
            this.setPlayer(nextPos,'pos');
            this.setPlayer(nextBody,'body');
        }
        else{
            //console.log("changePlayerPos Collided: "+isCollided);
            //only apply to nature movement. if manual movement, just ignore it
            if(isCollided>=1 && keycode==player.inertia)
                this.respondCollide(isCollided);
        }
    }
    ,changePlayerInertia:function(keycode){
        var appPreset = this.getAppPreset();
        var inertia = this.getPlayer().inertia;
        
        //disable backward
        if(!appPreset.forbidOpposite || !this.isCollideWithOppDir(inertia,keycode))
            this.setPlayer(keycode,'inertia');
        //else console.log("changePlayerInertia Collided:"+isCollided);
    }
    ,changeScore:function(score){
        model.changeScore(score+this.getScore());
    }
    ,changeRecord:function(id){
        //score comparison
        var curr = this.getRecord().score;
        var next = this.getScore();
        
        if(curr==null || next > curr)
            model.changeRecord({score:next}, id==null?this.getAppId():id);
    }
    ,changeAppState:function(state){
        switch(state){
            case 'activate':
                this.appState=1;
                this.moveDelay=0;
                model.init();
                view.init();
                break;
            case 'suspend':
                this.appState=0;
                view.render();
                break;
            case 'active':
                this.appState=1;
                //always attempt to move to the next position by the inertia
                //console.log(this.getMoveDelay())
                if(this.getMoveDelay()==0)
                    this.changePlayerPos(this.getPlayer().inertia)
                view.render();
                break;
            case 'destroy':
                this.appState=-1;
                this.changeRecord();
                view.render();
                break;
            default:
                this.appState=-1;
                this.changeRecord();
                view.render();
            ;
        }
    }
    ,changeAppId:function(id){
        this.currAppId = id;
        if(id<conf.getPresetSize()){
            this.changeRecord(id);
            this.changeAppState('activate');
        }
        else console.log("app does not exist!")
    }
    ,getRowsOfFilledObstacle:function(m){
        var rows = [];
        for(i=0;i<m.length;i++){
            for(j=0;j<m[i].length;j++)
                if(m[i][j]==0)
                    break;
            if(j == m[i].length) rows.push(i);
        }

        return rows;
    }
    ,getPosNext:function(keycode,pos){
        var appPreset = this.getAppPreset();
        var nextPos = (pos).clone();

        if(appPreset.forbidMoveUp && keycode==38) keycode = -1;

        //behaviors of the keycode
        switch (keycode){
            case 38:
                nextPos.y--;
                break;
            case 40:
                nextPos.y++;
                break;
            case 37:
                nextPos.x--;
                break;
            case 39:
                nextPos.x++;
                break;
            default:
                ;
        }

        if(appPreset.circularBound) nextPos = this.getPosCircular(nextPos);

        return nextPos;
    }
    ,getPosCircular:function(pos){
        var appPreset = this.getAppPreset();
        if(pos.x>=appPreset.tilex) pos.x=0;
        if(pos.x<0) pos.x=appPreset.tilex-1;
        if(pos.y>=appPreset.tiley) pos.y=0;
        if(pos.y<0) pos.y=appPreset.tiley-1;
        return pos;
    }
    ,getRotationOfMatrix:function(m,anticlock){
        m = m.clone();
        var n=m.length;
        for (var i=0; i<n/2; i++) {
            for (var j=i; j<n-i-1; j++) {
                var tmp=m[i][j];
                if(anticlock){
                    m[i][j]=m[j][n-i-1];
                    m[j][n-i-1]=m[n-i-1][n-j-1];
                    m[n-i-1][n-j-1]=m[n-j-1][i];
                    m[n-j-1][i]=tmp;
                }
                else{
                    m[i][j]=m[n-j-1][i];
                    m[n-j-1][i]=m[n-i-1][n-j-1];
                    m[n-i-1][n-j-1]=m[j][n-i-1];
                    m[j][n-i-1]=tmp;
                }
            }
        }
        return m;
    }
    ,getMarginOfMatrix:function(m){
        var arr_i = [];var arr_j = [];
        for(i=0;i<m.length;i++)
            for(j=0;j<m[i].length;j++)
                if(m[i][j]){
                    arr_i.push(i);
                    arr_j.push(j);
                }
        return {x0:arr_j.min(),y0:arr_i.min(),x1:arr_j.max(),y1:arr_i.max()};
    }
    ,getPosOfMatrix(m,pos,bodyAs){
        m = m.clone();

        //in caterpillar move, the body is a direct-result of positions and it will no longer considered as a body-pattern
        if(bodyAs!=null&&bodyAs=='caterpillar'){
            //tbc: take first columns only
            m.unshift([pos]);
            m.pop();
        }
        //in regular move, the whole body-position matrix will be based on the body-pattern matrix by passing position-of-origin as well
        else if(bodyAs==null||bodyAs=='pattern')
            for(i=0;i<m.length;i++)
                for(j=0;j<m[i].length;j++)
                    if( m[i][j] )
                        m[i][j]={x:pos.x+j, y:pos.y+i};
        return m;
    }
}
var view = {
    init:function(){
        var appPreset = conf.getAppPreset();
        this.canv = document.getElementById("gc");
        this.w = appPreset.tilex*appPreset.grid;
        this.h = appPreset.tiley*appPreset.grid;
        this.canv.width = this.w;
        this.canv.height = this.h;

        this.ctx = this.canv.getContext("2d");
        this.render();
    }
    ,render:function(){
        switch(oct.getAppState()){
            case 1:
                view.renderActive();
                break;
            case 0:
                view.renderSuspend();
                break;
            case -1:
                view.renderDestroy();
                break;
            default:
                break;
        }
    }
    ,renderPlayer:function(){
        var player = oct.getPlayer();
        view.renderMatrix(player.body,'pos',player.color);
    }
    ,renderObstacle:function(){
        var obs = oct.getObstacle();
        view.renderMatrix(obs);
    }
    ,renderAppInfo:function(){
        var score = oct.getScore();
        var best = oct.getRecord().score;
        
        this.ctx.font = "12px courier";
        this.ctx.fillStyle="#0000aa";
        this.ctx.fillText("Score: "+score,4,14);            
        this.ctx.textAlign = "right";      
        this.ctx.fillText("Best Score: "+best, this.canv.width-4, 14);
        this.ctx.textAlign = "start";
    }
    ,renderActive:function(){
        var appPreset = conf.getAppPreset();
        //paint bg
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0,0,this.canv.width-appPreset.gutter,this.canv.height-appPreset.gutter)

        view.renderObstacle();
        view.renderPlayer();
        view.renderAppInfo();
    }
    ,renderSuspend:function(){
        var appPreset = conf.getAppPreset();
        grd=this.ctx.createLinearGradient(0,this.canv.width*0.2,this.canv.width,this.canv.width*0.8);
        grd.addColorStop(0.000, 'rgba(255, 255, 255, 0.800)');
        grd.addColorStop(1.000, 'rgba(204, 204, 204, 0.800)');
        this.ctx.fillStyle = grd;
        this.ctx.fillRect(0,0,this.canv.width-appPreset.gutter,this.canv.height-appPreset.gutter)

        grd=this.ctx.createLinearGradient(0,0,this.canv.width,0);
        grd.addColorStop("0","magenta");
        grd.addColorStop("0.5","blue");
        grd.addColorStop("1.0","red");
        this.ctx.font = "30px courier";
        this.ctx.fillStyle="#0000aa";
        this.ctx.fillText("PAUSED",this.canv.width/2-60,this.canv.height/2-15);

        this.ctx.font = "14px courier";
        this.ctx.fillStyle="#0000aa";
        this.ctx.fillText("(Press SPACE to resume)",this.canv.width/2-100,this.canv.height/2+10);
    }
    ,renderDestroy:function(){
        var appPreset = conf.getAppPreset();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.800)';
        this.ctx.fillRect(0,0,this.canv.width-appPreset.gutter,this.canv.height-appPreset.gutter)

        this.ctx.font = "30px Futura";
        this.ctx.fillStyle="white";
        this.ctx.fillText("GAME OVER",this.canv.width/2-90,this.canv.height/2-15);

        this.ctx.font = "14px courier";
        this.ctx.fillStyle="white";
        this.ctx.fillText("(Press SPACE to restart)",this.canv.width/2-100,this.canv.height/2+10);
    }
    ,renderMatrix:function(m,pos,color){
        for(i=0;i<m.length;i++)
            for(j=0;j<m[i].length;j++)
                if(m[i][j]!=0)
                    view.renderTiles(
                        pos==null?j:m[i][j].x
                        ,pos==null?i:m[i][j].y
                        ,color==null?m[i][j]:color
                        ,"#0000aa");
    }
    ,renderTiles:function(x,y,color,border){
        var grid = conf.getAppPreset().grid,
            gutter = conf.getAppPreset().gutter;
        this.ctx.fillStyle=border;
        this.ctx.fillRect(x*grid,y*grid,grid-gutter,grid-gutter);
        this.ctx.fillStyle=color;
        this.ctx.fillRect(x*grid,y*grid,grid-gutter-gutter-gutter,grid-gutter-gutter-gutter);
    }
}
oct.init();
