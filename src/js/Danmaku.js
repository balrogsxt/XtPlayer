const util = require('./Util');
const Logger = require('./Logger');
class Danmu{

    constructor(xtPlayer){
        this.el = xtPlayer.el;
        this.xtPlayer = xtPlayer;
        this.canvas = this.el.find(".xt-player-danmu")[0];
        this._danmuSpeed = 100;//毫秒级弹幕
        this._danmuDense = 5;//弹幕密集,值越大,间距越大
        this._danmuScreenMaxSize = 500;//同屏弹幕最大值,多余的将被丢弃
        this._danmuOpacity = 1;//弹幕透明度
        this.ctx = this.canvas.getContext('2d');
        this._danmuLineHeight = 28;
        this._danmuFontSize = 18;
        this._danmuRunningSpeed = 10;
        this._danmuRunningMove = 1;
        this._danmuSendApi = null;//弹幕发送API
        let live = this;
        this._init();
        $(window).resize(function(e){
            live._init();//canvas跟随变动
        });

        //载入弹幕库配置
        this._initDanmuOptions();

        //运行时弹幕库
        this._runningdanmaku = [];
        this._danmakuThread = 0;
        this._danmuRunningThread = 0;
        this._startDanmuThread();
    }
    _init(){
        this.canvas.width = this.el.width();
        this.canvas.height = this.el.height();
        this.clearDanmu();
    }
    _parseDanmu(data){
        let danmaku = {};
        for(let i in data){
            let item = data[i];
            if(typeof(danmaku[item.time])=='undefined'){
                danmaku[item.time] = [];
            }
            danmaku[item.time].push({
                text:item.text,
                color:item.color
            });
        }
        this._danmaku = danmaku;
        Logger.debug(`弹幕解析完成一共${data.length}条弹幕`);
    }
    _initDanmuOptions(){
        this._danmaku = {};
        let live = this;
        if(typeof(this.xtPlayer._options.danmaku)!='undefined'){
            let config = this.xtPlayer._options.danmaku;
            //载入弹幕库
            if(typeof(config.api)!='undefined'){
                let danmuAPI = config.api;
                util.httpGet(danmuAPI,{},r=>{
                    if(r.status==200){
                        try{
                            if(typeof(r.data)!='object'){
                                JSON.parse(r.data);
                            }
                            let danmaku = r.data;
                            //解析弹幕数据
                            Logger.debug("获取成功,开始解析弹幕数据");
                            live._parseDanmu(danmaku);
                        }catch(e){
                            live.xtPlayer.showToast("弹幕载入失败",2000);
                            Logger.debug("弹幕载入失败"+e.message);
                        }
                    }else{
                        live.xtPlayer.showToast("弹幕载入失败",2000);
                        Logger.debug("弹幕载入失败"+r.status);
                    }
                },e=>{
                    live.xtPlayer.showToast("弹幕载入失败",2000);
                    Logger.error("弹幕库载入失败"+JSON.stringify(e));
                });
            }
            //弹幕发送接口
            if(typeof(config.send)!='undefined'){
                $(".xt-player-danmu .xt-player-damuku-warp").fadeIn(0);
                $(".xt-player-send-danmu .sendDanmu").fadeIn(0);
                this._danmuSendApi = config.send;
            }
            //弹幕密集
            if(typeof(config.dense)!='undefined'&&!isNaN(config.dense)){
                this._danmuDense = config.dense;
            }
            //同屏弹幕最大值
            if(typeof(config.screenMax)!='undefined'&&!isNaN(config.screenMax)){
                this._danmuScreenMaxSize = config.screenMax;
            }
            //弹幕透明度
            if(typeof(config.opacity)!='undefined'&&!isNaN(config.opacity)){
                this._danmuOpacity = config.opacity;
            }
            //弹幕字体大小
            if(typeof(config.fontSize)!='undefined'&&!isNaN(config.fontSize)){
                this._danmuFontSize = config.fontSize;
            }
            //弹幕移动速度
            if(typeof(config.move)!='undefined'&&!isNaN(config.move)){
                this._danmuRunningMove = config.move;
            }
        }
    }
    send(text,color){
        if(text==""||text.length==0)return;
        let liveTime = parseFloat(parseFloat(this.xtPlayer.getCurrentTime().toFixed(1))+0.1);
        if(typeof(this._danmaku[liveTime])!='object'){
            this._danmaku[liveTime] = [];
        }
        this._danmaku[liveTime].push({
           text:text,
           color:color,
           isLive:true,//true时本次不触发
           isSelf:true
        });
        this._runningdanmaku.push({
            text:text,
            color:color,
            left:this.canvas.width,
            time:liveTime,
            line:this._getRunningDanmuLine(),
            isSelf:true
        });
        if(this._danmuSendApi!=null){
            let live = this;
            util.httpPost(this._danmuSendApi,{
                text:text,
                color:color,
                time:liveTime
            },r=>{
                Logger.debug("弹幕发送完成,服务器请自行处理");
            },e=>{
                console.error("弹幕发送接口异常",e);
                live.xtPlayer.showToast("弹幕发送失败~",2000);
            });
        }
    }
    //获取当前运行时弹幕最合适的一行
    _getRunningDanmuLine(insert){
        //当前视频时间
        let liveTime = Math.floor(this.xtPlayer.getCurrentTime());
        //计算1秒钟移动多少px
        let lineDanmu = {};
        let maxLine = Math.floor(this.canvas.height/this._danmuLineHeight);
        //判断是否开启防挡字幕
        let isPreSubTitle = this.__config_presubtitle==true?true:false;
        if(isPreSubTitle)maxLine = maxLine-5;
        //获取当前运行时弹幕库所处行数
        for(let line in this._runningdanmaku){
            let item = this._runningdanmaku[line];
            if(typeof(lineDanmu[item.line])=='undefined'){
                lineDanmu[item.line] = [];
            }
            lineDanmu[item.line].push(item);
        }
        let noneLine = maxLine+1;//默认最大行数+1,代表没有可用的弹幕行了
        //检测可用弹幕行
        for(let line=0;line<=maxLine;line++){
            if(typeof(lineDanmu[line])!='undefined'){
                let list = lineDanmu[line];
                //该列存在弹幕列表,需要一个一个判断是否可用
                let isOk = true;
                for(let i in list){
                    let item = list[i];//弹幕数据
                    let left = item.left;//当前距离
                    let countWidth = this.canvas.width;//总体宽度
                    let width = this.ctx.measureText(item.text).width+this._danmuDense;//弹幕文字占用宽度
                    let diffMove = countWidth-left;//已经移动的距离
                    if(!(diffMove>=width))isOk = false;
                }
                if(isOk)return line;
            }else{
                return line;
            }
        }
        return noneLine;
    }
    _danmuShow(text,color,left,line,isLive,position){
        line = (parseInt(line)+1);
        let maxLine = Math.floor(this.canvas.height/this._danmuLineHeight);
        //判断是否开启防挡字幕
        let isPreSubTitle = this.__config_presubtitle==true?true:false;
        if(isPreSubTitle){
            maxLine = maxLine-5;
        }
        if(line>maxLine){
            line = line%maxLine==0?1:(line%maxLine)+1;
            return;
        }
        if(0>line)return;
        this.ctx.font= this._danmuFontSize+"px 微软雅黑";
        this.ctx.globalAlpha = this._danmuOpacity;
        this.ctx.fillStyle = `${color}`;
        let top = this._danmuLineHeight*line+5;
        this.ctx.fillText(text,left,top-this._danmuFontSize/2);
        let margin = 5;
        if(isLive){
            this.ctx.strokeStyle = "#ffffff";
            this.ctx.strokeRect(left-margin,top-this._danmuLineHeight,this.ctx.measureText(text).width+margin*2,this._danmuLineHeight);
        }
    }
    //清空运行时的弹幕池
    clearDanmu(){
        this._runningdanmaku = [];
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }
    //设置弹幕运行状态
    setDanmuStatus(flag){
        this._danmuRunningStatus = flag;
    }
    //设置弹幕透明度
    setDanmuOpacity(value){
        if(isNaN(value))value = 1;
        if(value>=1)value = 1;
        if(0>=value)value=0;
        this._danmuOpacity = value;
    }
    //设置弹幕开关
    setDanmu(flag){
        this.__config_danmu = flag;
        //关闭弹幕时,清空弹幕池
        if(flag===false){
            this._closeDanmuThread();//关闭弹幕线程
            this.clearDanmu();//清空运行时弹幕池
        }else{
            this._startDanmuThread();
        }
    }
    //设置弹幕防挡字幕
    setPreSubTitle(flag){
        this.__config_presubtitle = flag;
        //由于运行时弹幕池全部处于以计算好的行数,关闭防挡字幕时清空运行时弹幕池,不然...
        if(flag===false)this.clearDanmu();
    }
    _closeDanmuThread(){
        if(this._danmakuThread!=0){
            clearTimeout(this._danmakuThread);
            this._danmakuThread = 0;
        }
        if(this._danmuRunningThread!=0){
            clearTimeout(this._danmuRunningThread);
            this._danmuRunningThread = 0;
        }
    }
    _startDanmuThread(){
        this._closeDanmuThread();
        //全局弹幕库处理
        this._danmakuThread = setInterval(() => {
            if(this._danmuRunningStatus){
                let liveTime = this.xtPlayer.getCurrentTime().toFixed(1);
                if(typeof(this._danmaku[liveTime])=='object'){
                    for(let i in this._danmaku[liveTime]){
                        let item = this._danmaku[liveTime][i];
                        if(typeof(item.isLive)!='undefined'){
                            if(item.isLive==true){
                                this._danmaku[liveTime][i].isLive = false;
                                continue;
                            }
                        }
                        let line = this._getRunningDanmuLine(item.text);
                        if(this._danmuScreenMaxSize>this._runningdanmaku.length){
                            this._runningdanmaku.push({
                                text:item.text,
                                color:item.color,
                                left:this.canvas.width,
                                time:liveTime,
                                line:line,
                                isSelf:typeof(item.isSelf)=='undefined'?false:item.isSelf
                            });
                        }
                    }
                }
            }
        },this._danmuSpeed);
        //运行时弹幕库处理
        this._danmuRunningThread = setInterval(() => {
            if(this._danmuRunningStatus&&this.__config_danmu){
                this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
                let tmpdanmaku = [];
                for(let i in this._runningdanmaku){
                    let danmu = this._runningdanmaku[i];
                    let danmuLeft = danmu.left - this._danmuRunningMove;
                    let danmuLine = danmu.line;
                    let danmiTime = danmu.time;
                    let isSelf = typeof(danmu.isSelf)=='undefined'?false:danmu.isSelf;
                    if(0-this.ctx.measureText(danmu.text).width>danmuLeft)continue;
                    this._danmuShow(danmu.text,danmu.color,danmuLeft,danmuLine,isSelf);
                    tmpdanmaku.push({
                        text:danmu.text,
                        color:danmu.color,
                        left:danmuLeft,
                        line:danmuLine,
                        time:danmiTime,
                        isSelf:isSelf
                    });
                }
                this._runningdanmaku = tmpdanmaku;
            }
        },this._danmuRunningSpeed);
    }


}

module.exports = Danmu;