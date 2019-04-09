const util = require('./Util');
const cache = require('./Cache');
const xtPlayerDanmu = require('./Danmaku');
const XtPlayerSubtitle = require('./Subtitle');
const XtPlayerHtml = require('./Build');
const Logger = require('./Logger');
class XtPlayer{

    constructor(element,options){
        let live = this;
        this.info = {
            author:"幻音い",
            website:"https://www.acgxt.com",
            version:"1.2.0",
            project:"https://xtplayer.acgxt.com"
        }
        this.el = $(element);
        this._build = new XtPlayerHtml(this);
        this._video = this.el.children('video');
        this._options = options;
        this._isInit = false;
        //解析视频格式
        this._initOptions();
        live.setLoading(true);
        live._initVideo();
        live._initEvent();
        live._initKey();
    }
    _initOptions(){
        this._isOpenRightMenu = false;
        this._isOpenSettingMenu = false;
        this._isOpenVolume = false;
        this._isVideoFullScreen = false;
        this._videoLoader = typeof(this._options.loader)=='undefined'?null:this._options.loader;
        //视频品质列表
        this._videoQuality = typeof(this._options.quality)=='undefined'?[]:this._options.quality;

        //视频长宽
        this._videoWidth = typeof(this._options.width)=='undefined'?null:this._options.width;
        this._videoHeight = typeof(this._options.height)=='undefined'?null:this._options.height;
        //是否预载入
        this._videoPreload = typeof(this._options.preload)=='undefined'?false:this._options.preload;
        //预览图
        this._videoPoster = typeof(this._options.poster)=='undefined'?null:this._options.poster;
        //视频资源地址
        this._videoSrc = typeof(this._options.src)=='undefined'?null:this._options.src;
        //是否洗脑循环
        this._videoLoop = typeof(this._options.loop)=='undefined'?false:this._options.loop;
        //是否自动播放
        this._videoAutoPlay = typeof(this._options.autoplay)=='undefined'?false:this._options.autoplay;        
        this._videoPreSubtitle = typeof(this._options.presubtitle)=='undefined'?false:this._options.presubtitle;        
        this._videoVolume = typeof(this._options.volume)=='undefined'?1:this._options.volume;        

        //视频默认比例
        let scale = {w:16,h:9};

        if(this._videoWidth==null&&this._videoHeight==null){

        }else if(this._videoHeight=='auto'&&!isNaN(this._videoWidth)){
            this._videoHeight = this._videoWidth/scale.w*scale.h;
        }else if(this._videoWidth=='auto'&&!isNaN(this._videoHeight)){
            this._videoWidth = this._videoHeight/scale.w*scale.h;
        }else{
            this._videoWidth = 800;
            this._videoHeight = this._videoWidth/scale.w*scale.h;
        }
        this.setWidth(this._videoWidth);
        this.setHeight(this._videoHeight);
        this.getVideo().src = this._videoSrc;
        //弹幕初始化
        this._danmu = new xtPlayerDanmu(this);
        let danmuEnable = cache.get("videoDanmu");
        if(typeof(danmuEnable)!='undefined'){
            //载入弹幕类配置
            this.setDanmu(danmuEnable);
        }else{
            if(typeof(this._options.danmaku)!='undefined'){
                let danmuConfig = this._options.danmaku;
                //载入弹幕是否启用
                if(typeof(danmuConfig.enable)!='undefined'){
                    if(danmuConfig.enable===true){
                        this.setDanmu(true);
                    }else{
                        this.setDanmu(false);
                    }
                }else{
                    //默认启用弹幕
                    this.setDanmu(true);
                }
            }else{
                this.setDanmu(this._videoDanmuEnable);
            }
        }




        if(this._videoPoster!=null)this.getVideo().poster = this._videoPoster;
        let autoplay = cache.get("videoAutoPlay");
        if(typeof(autoplay)!='undefined'){
            this.setAutoPlay(autoplay);
        }else{
            this.setAutoPlay(this._videoAutoPlay);
        }
        let loop = cache.get("videoLoop");
        if(typeof(loop)!='undefined'){
            this.setLoop(loop);
        }else{
            this.setLoop(this._videoLoop);
        }

        let preload = cache.get("videoPreload");
        if(typeof(preload)!='undefined'){
            this.setPreload(preload);
        }else{
            this.setPreload(this._videoPreload);
        }

        let presubtitle = cache.get("videoPreSubtitle");
        if(typeof(presubtitle)!='undefined'){
            this.setPresubtitle(presubtitle);
        }else{
            this.setPresubtitle(this._videoPreSubtitle);
        }

        //字幕初始化
        this._subtitle = new XtPlayerSubtitle(this);

        let subtitle = cache.get("videoSubtitle");
        if(typeof(subtitle)!='undefined'){
            this.setSubtitle(subtitle);
        }else{
            if(typeof(this._options.subtitle)!='undefined'){
                let subtitleConfig = this._options.subtitle;
                if(typeof(subtitleConfig.enable)!='undefined'){
                    if(subtitleConfig.enable===true){
                        this.setSubtitle(true);
                    }else{
                        this.setSubtitle(false);
                    }
                }else{
                    this.setSubtitle(true);
                }
            }else{        
                this.setSubtitle(this._videoSubtitle);
            }


        }

        
        let volume = cache.get("videoVolume");
        if(!isNaN(volume)){
            this.setVolume(volume);
        }else{
            this.setVolume(this._videoVolume);
        }
        //读取清晰列表
        if(this._videoQuality.length!=0){
            $(".xt-player-quality").fadeIn(0);
            for(let i in this._videoQuality){
                let item = this._videoQuality[i];
                this.el.find(".xt-player-quality .xt-player-quality-list").append(`<li xt-src="${item.src}" xt-loader="${item.loader}">${item.name}</li>`);
            }
        }
        

        
        this._isInit = true;
    }
    _loaderVideo(src,loader){
        loader = typeof (loader)=='undefined'?'default':loader;
        if(typeof(this._flvPlayer)!='undefined'&&this._flvPlayer!=null){
            this._flvPlayer.detachMediaElement();
            this._flvPlayer.destroy();
            this._flvPlayer = null;
        }

        switch (loader) {
            case 'hls':
                if (typeof (Hls) == 'undefined') {
                    Logger.error("缺少Hls.js");
                    break;
                }
                if (!Hls.isSupported()) {
                    Logger.error("浏览器暂不支持Hls.js");
                    break;
                }
                Logger.debug(`使用hls.js加载视频`);
                let hlsPlayer = new Hls();
                hlsPlayer.loadSource(src);
                hlsPlayer.attachMedia(this.getVideo());
                hlsPlayer.on(Hls.Events.MANIFEST_PARSED, function () {
                    // Logger.debug('load');
                });
                break;
            case 'flv':
                if (typeof (flvjs) == 'undefined') {
                    Logger.error("缺少flv.js");
                    break;
                }
                if (!flvjs.isSupported()) {
                    Logger.error("浏览器暂不支持flv.js");
                    break;
                }
                Logger.debug(`使用flv.js加载视频`);
                this._flvPlayer = flvjs.createPlayer({
                    type: 'flv',
                    url: src
                });
                this._flvPlayer.attachMediaElement(this.getVideo());
                this._flvPlayer.load();
                break;
            default:
                this.getVideo().src = src;
                Logger.debug(`使用浏览器默认加载视频`);
                break;
        }
        this._danmu.setDanmuStatus(false);

    }
    //初始化视频,解析视频
    _initVideo(){
        let live = this;
        //Loader载入视频
        this._loaderVideo(this.getVideo().src, this._videoLoader);
        this.getVideo().addEventListener("loadstart",function(){
            Logger.debug("开始加载视频");
        });
        this.getVideo().addEventListener("canplay",function(){
            Logger.debug("可以播放视频了");
            live.setLoading(false);
            live._initProgress();
        });
        this.getVideo().addEventListener("seeking",function(){
            Logger.debug("开始寻找");
            // live.pause();
        });
        this.getVideo().addEventListener("seeked",function(){
            Logger.debug("寻找完成");
            live._danmu.clearDanmu();
            // live.play();
        });
        this.getVideo().addEventListener("ended",function(){
            Logger.debug("视频播放完成");
            live.seek(0);
            live.pause();  
        });
        
        this.getVideo().addEventListener("error",function(){
            Logger.error("视频播放发生错误,请检查视频数据");
            live.showToast("视频播放发生错误");
        });
        //播放不代表开始播放
        this.getVideo().addEventListener("play",function(){
            Logger.debug("视频播放");
            live.el.find(".xt-icon-play").fadeOut(0).siblings('.xt-icon-pause').fadeIn(0);
        });
        this.getVideo().addEventListener("pause",function(){
            Logger.debug("视频暂停");
            live.el.find(".xt-icon-pause").fadeOut(0).siblings('.xt-icon-play').fadeIn(0);
            live._danmu.setDanmuStatus(false);
        });
        this.getVideo().addEventListener("playing",function(){
            Logger.debug("缓冲完成,开始播放");
            live.setLoading(false);
            live._danmu.setDanmuStatus(true);
            live._initProgress();
        });
        this.getVideo().addEventListener("volumechange",function(e){
            let volume = live.getVideo().volume;
            if(volume>=0.6){
                live.el.find(".xt-icon-volume").addClass("xt-icon-volume3").removeClass("xt-icon-volume1").removeClass("xt-icon-volume2");
            }else if(0>=volume){
                live.el.find(".xt-icon-volume").addClass("xt-icon-volume1").removeClass("xt-icon-volume2").removeClass("xt-icon-volume3");
            }else{
                live.el.find(".xt-icon-volume").addClass("xt-icon-volume2").removeClass("xt-icon-volume3").removeClass("xt-icon-volume1");
            }
            live.el.find(".xt-player-volume-progress-item").css({
                height:volume*100+"%"
            });
        });
        
        this.getVideo().addEventListener("progress",function(e){
            Logger.debug("正在下载资源");
        });

        this.getVideo().addEventListener("waiting",function(){
            Logger.debug("缓冲中");
            live.setLoading(true);
            live._danmu.setDanmuStatus(false);
        });
        
        setInterval(() => {
            //鼠标静止监听
            try{
                let liveTime = Math.ceil(new Date().getTime()/1000);
                if(typeof(live._lastMove)!='undefined'){
                    if(liveTime>live._lastMove+3){
                        live.el.find(".xt-player-action").css('opacity',0);
                    }
                }
            }catch(e){

            }
            try{
                //缓冲条多块处理
                for(let i =0;i<live.getVideo().buffered.length;i++){
                    let cacheStart = live.getVideo().buffered.start(i);
                    let cacheEnd = live.getVideo().buffered.end(i);
                    let left = cacheStart/live.getDuration()*100;
                    let per = (cacheEnd-cacheStart)/live.getDuration()*100;
                    let classId = `.progress-cache-item[data-index=${i}]`;
                    if(live.el.find(".progress-cache-list").find(classId).length==0){
                        live.el.find(".progress-cache-list").append(`<div class="progress-cache-item" data-index="${i}"></div>`)
                    }
                    live.el.find(classId).css({
                        left:left+"%",
                        width:per+"%"
                    });
                }
            }catch(e){
                Logger.debug(e.message);
            }
        }, 1000);
    }
    _initEvent(){
        let live = this;
        //注册播放
        this.el.find(".xt-icon-play").click(function(){
            live.play();
        });
        //注册暂停
        this.el.find(".xt-icon-pause").click(function(){
            live.pause();
        });
        this.el.find(".xt-player-video,.xt-player-danmaku").click(function(){
            //判断是否打开右键菜单或设置菜单
            if(live._isOpenRightMenu==false&&live._isOpenVolume==false&&live._isOpenSettingMenu==false){
                if(live.getVideo().paused){
                    live.play();
                }else{
                    live.pause();
                }
            }
        });
        //注册控制显示
        this.el.find(".xt-player-action").hover(function(){
            $(this).css('opacity',1);
        })
        this.el.hover(function(){
            live.el.find(".xt-player-action").css('opacity',1);
        });
        //注册点击跳转
        this.el.find(".xt-player-action .top").click(function(e){
            let per = (e.offsetX/$(this).width()*100);
            let currentTime = live.getVideo().duration*per/100;
            live.seek(currentTime);
            live.play();
        });
        this.el.find(".xt-icon-volume").click(function(e){
            e.stopPropagation();
            if(live._isOpenVolume==true){
                live._setVolumeStatus(false);
            }else{
                live._setVolumeStatus(true);
            }
        });
        this.el.find(".xt-player-volume *").click(function(e){
            e.stopPropagation();
        });
        //音量滑块
        this.el.find(".xt-player-volume-progress-item").click((e)=>{
            let warp = live.el.find(".xt-player-volume-progress");
            let move = live.el.find(".xt-player-volume-progress-item");
            let parentTop = warp.offset().top;
            let liveTop = move.offset().top;
            let diffTop = liveTop-parentTop;
            let clickTop = diffTop+e.offsetY;
            let per = ((clickTop/(warp.height())*100)-100);
            if(0>per){
                per = Math.abs(per);
            }else{
                per = 0;
            }
            per = Math.round(per);
            let volume = Math.round(per)/100;
            live.setVolume(volume);
        });
        this.el.find(".xt-player-volume-progress-item-btn").click((e)=>{
            e.stopPropagation();
        });
        this.el.find(".xt-player-volume-progress").click(function(e){
            if(e.target.className=='xt-player-volume-progress-item')return;
            let move = $(this).find(".xt-player-volume-progress-item");
            let warp = move.parent(".xt-player-volume-progress");
            let per = ((e.offsetY/($(this).height()-5)*100)-100);
            if(0>per){
                per = Math.abs(per);
            }else{
                per = 0;
            }
            per = Math.round(per);
            let volume = Math.round(per)/100;
            live.setVolume(volume);
        });
        this.el.find(".xt-player-volume-progress-item-btn").mousedown(function(e){
            let btn = $(this);
            let move = btn.parent(".xt-player-volume-progress-item");
            let warp = move.parent(".xt-player-volume-progress");
            var y = e.clientY - btn.offset().top;
            live.el.find(".xt-player-volume-controller").bind("mousemove",function(ev){
                $(this).stop();
                var offsets = $(this).offset(),
                    yy = ev.clientY - y-offsets.top,
                    h = warp.height();
                if(0>=yy)yy = 0;
                if(yy>=h) yy = h;
                let per = ((yy/warp.height()*100)-100);
                if(0>per){
                    per = Math.abs(per);
                }else{
                    per = 0;
                }
                per = Math.round(per);
                move.css("height",per+"%");
                let volume = Math.round(per)/100;
                live.setVolume(volume);
            });
        });
        //拖动滑块
        this.el.find(".xt-player-action .top .xt-player-progress").mousedown(function(e){
            let btn = $(this);
            let move = btn.find(".progress-item");
            let x = e.clientX - btn.offset().left;
            live.el.bind("mousemove",function(ev){
                $(this).stop();
                let offsets = $(this).offset(),
                move_x = ev.clientX - offsets.left,
                w = $(this).width();
                if(0>move_x||move_x>w)return false;
                let per = (move_x/$(this).width()*100);
                let currentTime = live.getVideo().duration*per/100;
                live.seek(currentTime);
                move.css({width:per+"%"});
                $(this).find('.progress-time').css({left:per+"%"});
                $(this).find('.progress-time').fadeIn(0);
                $(this).find('.progress-time').text(util.parseToTime(currentTime));
            });
        });
        $(document).mouseup(function(){
            live.el.unbind("mousemove");
            live.el.find(".xt-player-volume-controller").unbind("mousemove");
            live.hideToast();
        });
        //注册滑动时间
        this.el.find(".xt-player-action .top").mousemove(function(e){
            let per = (e.offsetX/$(this).width()*100);
            if(e.offsetY>0){
                let diffWidth1 = $(this).find('.progress-time').width() / 2;
                let diffWidth2 = $(this).width() - e.offsetX;
                let currentTime = live.getVideo().duration*per/100;
                if (diffWidth1 >= e.offsetX || diffWidth1 >= diffWidth2) {
                    $(this).find('.progress-time').css({
                        marginLeft: `-${diffWidth1}px`
                    });
                }else{
                    $(this).find('.progress-time').css({
                        left: (per) + "%",
                        marginLeft: `-${diffWidth1}px`
                    });
                }
                $(this).find('.progress-time').fadeIn(0);
                $(this).find('.progress-time').text(util.parseToTime(currentTime));
            }else{
                $(this).find('.progress-time').fadeOut(0);
            }
        });
        this.el.find(".xt-player-action .top").mouseleave(function(){
            $(this).find('.progress-time').fadeOut(0);
        });
        //增加右键菜单打开
        this.getVideo().oncontextmenu = function(e){
            e.preventDefault();
            live.el.find(".xt-right").css({
                left:e.offsetX+"px",
                top:e.offsetY+"px"
            });
            live.el.find(".xt-right").fadeIn(0);
            live._isOpenRightMenu = true;
        }
        this.el.find(".xt-player-danmu")[0].oncontextmenu = function(e){
            e.preventDefault();
            live.el.find(".xt-right").css({
                left:e.offsetX+"px",
                top:e.offsetY+"px"
            });
            live.el.find(".xt-right").fadeIn(0);
            live._isOpenRightMenu = true;
        }
        //设置开关
        this.el.find(".xt-player-btn-toggle-item").click(function(){
            live._setToggleEvent($(this).parent(".xt-player-btn-toggle"));
        });
        this.el.find(".xt-player-btn-toggle").click(function(){
            live._setToggleEvent($(this));
        });
        this.el.find(".xt-player-setting .xt-icon-setting").click(function(e){
            e.stopPropagation();
            if(live._isOpenSettingMenu){
                live._setSettingStatus(false);
            }else{
                live._setSettingStatus(true);
            }
        });
        this.el.find(".xt-player-setting *").click(function(e){
            e.stopPropagation();
        });
        //窗口全屏
        this.el.find(".xt-player-window-screen").click(function(){
            if(live.el.hasClass('xt-player-window-full')){
                live.cancelWindowFullScreen();
            }else{
                live.setWindowFullScreen();
            }
        });
        this.el.find(".xt-player-screen > i").click(function(){
            if(live._isVideoFullScreen){
                live.cancelFullScreen();
            }else{
                live.setFullScreen();
            }
        });
        this.el.find(".double_speed em").click(function(){
            let speed = $(this).attr('data-speed');
            console.log('set',speed);
            live.setSpeed(speed);
        });
        //发送弹幕
        this.el.find(".inputDanmu").keydown(function(e){
            if(e.keyCode!=13)return;
            let text = $(this).val();
            if(text==""||text.length==0){
                live.showToast("发送的弹幕内容呢?",2000,true);
                return;
            }
            live._danmu.send(text,"#FFFFFF");
            $(this).val('');
        });
        this.el.find(".sendDanmu").click(function(){
            let text = String(live.el.find(".inputDanmu").val());
            if(text==""||text.length==0){
                live.showToast("发送的弹幕内容呢?",2000,true);
                return;
            }
            live._danmu.send(text,"#FFFFFF");
            live.el.find(".inputDanmu").val('')
        });
        
        $(window).mousemove(()=>{
            live._lastMove = Math.ceil(new Date().getTime()/1000);
        });
        this.el.find(".xt-player-quality").hover(function(){
            $(this).find(".xt-player-quality-list").css('opacity', 1);
        },function(){
            $(this).find(".xt-player-quality-list").css('opacity',0);
        });
        this.el.find(".xt-player-quality-list li").click(function(){
            let src = $(this).attr('xt-src');
            let loader = $(this).attr('xt-loader');
            let name = $(this).text();
            if(typeof(src)=='undefined'){
                live.showToast("无效的视频",2000);
                return;
            }
            $(this).parent(".xt-player-quality-list").siblings("span").text(name);
            live._loaderVideo(src, loader);
        });
        this.el.find(".xt-player-setting-controller").mouseleave(function (e) {
            if(e.relatedTarget!=null)live._setSettingStatus(false);
        });
        this.el.find(".xt-player-volume-controller").mouseleave(function (e) {
            if(e.relatedTarget!=null)live._setVolumeStatus(false);
        });
        this.el.find(".xt-player").mouseleave(function (e) {
            // if(e.relatedTarget!=null)live.el.find(".xt-player-action").css('opacity',0);
        });
        
        $(window).click(function(){
            live._lastMove = Math.ceil(new Date().getTime()/1000);
            //菜单关闭
            if(live._isOpenRightMenu==true){
                live.el.find(".xt-right").fadeOut(0);
                live._isOpenRightMenu = false;
            }
            if(live._isOpenVolume==true){
                live._setVolumeStatus(false);
            }
            //设置关闭
            if(live._isOpenSettingMenu==true){
                live._setSettingStatus(false);
            }
        });
        $(window).resize(function(e){
            if(live.el.width()>=$(window).width()&&live.el.height()>=$(window).height()){
                live._videoFullScreenChange(true);
            }else{
                
                live._videoFullScreenChange(false);
            }
        });
    }
    _setToggleEvent(el){
        let type = el.attr('data-type');
        let flag = el.hasClass('active')?false:true;
        switch(type){
            case "loop":this.setLoop(flag);break;
            case "preload":this.setPreload(flag);break;
            case "autoplay":this.setAutoPlay(flag);break;
            case "presubtitle":this.setPresubtitle(flag);break;
            case "danmu":this.setDanmu(flag);break;
            case "subtitle":this.setSubtitle(flag);break;
        }
    }
    _videoFullScreenChange(flag){
        if(typeof(flag)=='undefined'){
            let element = document.fullscreenElement || document.mozFullscreenElement || document.webkitFullscreenElement; 
            if(element){
                this._isVideoFullScreen = true;
                this.el.find(".xt-player-screen > i").addClass('xt-icon-screen-min').removeClass('xt-icon-screen-max');
            }else{
                this._isVideoFullScreen = false;
                this.el.find(".xt-player-screen > i").addClass('xt-icon-screen-max').removeClass('xt-icon-screen-min');
            }
        }else{
            
            if(flag===true){
                this._isVideoFullScreen = true;
                this.el.find(".xt-player-screen > i").addClass('xt-icon-screen-min').removeClass('xt-icon-screen-max');
            }else{
                this._isVideoFullScreen = false;
                this.el.find(".xt-player-screen > i").addClass('xt-icon-screen-max').removeClass('xt-icon-screen-min');
            }
        }
        
    }
    _initProgress(){
        setTimeout(()=>{
            let per = parseInt(this.getCurrentTime())/parseInt(this.getDuration())*100;
            this.el.find(".xt-player-progress .progress-item").css({
                width:per+"%"
            });
            this.el.find(".xt-player-current-time").text(util.parseToTime(this.getCurrentTime()));
            this.el.find(".xt-player-count-time").text(util.parseToTime(this.getDuration()));
            if(!this.getVideo().paused){
                this._initProgress();
            }
        },1000);
    }
    _initKey(){
        let live = this;
        $(window).keydown(function(e){
            switch(e.keyCode){
                case 38://top
                e.preventDefault();
                live.setVolume(live.getVideo().volume+0.01);
                break;
                case 40://bottom
                e.preventDefault();
                    live.setVolume(live.getVideo().volume-0.01);
                break;
                case 37://left
                e.preventDefault();
                    live.seek(live.getCurrentTime()-5);
                break;
                case 39://right
                e.preventDefault();
                    live.seek(live.getCurrentTime()+5);
                break;
                case 32:
                e.preventDefault();
                    if(live.getVideo().paused){
                        live.play();
                    }else{
                        live.pause();
                    }
                break;
            }
        });
    }
    /**
     * 窗口全屏
     */
    setWindowFullScreen(){
        this.el.addClass('xt-player-window-full');
    }
    /**
     * 取消窗口全屏
     */
    cancelWindowFullScreen(){
        this.el.removeClass('xt-player-window-full');
    }
    /**
     * 浏览器全屏
     */
    setFullScreen(){
        let el = this.el[0];
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else if (el.mozRequestFullScreen) {
            el.mozRequestFullScreen();
        } else if (el.webkitRequestFullScreen) {
            el.webkitRequestFullScreen();
        }else{
            this.showToast("浏览器不支持全屏模式",2000);
        }
    }
    /**
     * 取消浏览器全屏
     */
    cancelFullScreen(){
        this.cancelWindowFullScreen();
        var fullScreenEnabled = document.fullScreenEnabled || document.webkitFullScreenEnabled || document.mozFullScreenEnabled || document.msFullScreenEnabled;
        var isFullScreen = document.fullScreenElement || document.webkitFullScreenElement || document.mozFullScreenElement || document.msFullScreenElement;
        if (fullScreenEnabled === undefined || fullScreenEnabled) {
            if (isFullScreen === undefined) {
            if (document.exitFullScreen) {
                document.exitFullScreen();
            } else if (document.webkitExitFullScreen) {
                document.webkitExitFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullScreen) {
                document.msExitFullScreen();
            } else if (document.msCancelFullScreen) {
                document.msCancelFullScreen();
            } else {
                this.showToast("浏览器不支持退出全屏,请按ESC退出",2000);
            }
        } else if (isFullScreen !== null) {
            if (document.exitFullScreen) {
                document.exitFullScreen();
            } else if (document.webkitExitFullScreen) {
                document.webkitExitFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullScreen) {
                document.msExitFullScreen();
            } else if (document.msCancelFullScreen) {
                document.msCancelFullScreen();
            } else {
                this.showToast("浏览器不支持退出全屏,请按ESC退出",2000);
            }
            }
        }else{
            this.showToast("浏览器不支持退出全屏,请按ESC退出",2000);
        }
    }
    setVolume(volume){
        if(isNaN(volume)) volume = 1;
        if(volume>=1) volume = 1;
        if(0>volume) volume = 0;
        cache.set("videoVolume",volume);
        this.getVideo().volume = volume;
        if(this._isInit){
            this.showToast(`音量${Math.ceil(volume*100)}%`);
        }

        if(volume>=0.6){
            this.el.find(".xt-icon-volume").addClass("xt-icon-volume3").removeClass("xt-icon-volume1").removeClass("xt-icon-volume2");
        }else if(0>=volume){
            this.el.find(".xt-icon-volume").addClass("xt-icon-volume1").removeClass("xt-icon-volume2").removeClass("xt-icon-volume3");
        }else{
            this.el.find(".xt-icon-volume").addClass("xt-icon-volume2").removeClass("xt-icon-volume3").removeClass("xt-icon-volume1");
        }
        this.el.find(".xt-player-volume-progress-item").css({
            height:volume*100+"%"
        });

    }
    setSpeed(speed){
        if(isNaN(speed)){
            speed = 1;
        }
        speed = new Number(speed).toFixed(1);
        this.getVideo().playbackRate = speed;
        this.showToast(`当前速度${speed}`);
    }
    setLoading(flag){
        if(flag){
            this.el.find(".xt-player-loading").fadeIn(0);
        }else{
            this.el.find(".xt-player-loading").fadeOut(0);
        }
    }
    /**
     * 显示Toast
     * @param {*} msg 显示内容
     * @param {*} showTime 消失时间 
     */
    showToast(msg,showTime,isAnimated){
        let time = 0;
        isAnimated = typeof(isAnimated)=='undefined'?true:isAnimated;
        if(!isNaN(showTime))time = showTime;
        this.el.find(".xt-player-toast").fadeIn(0)
        if(isAnimated){
            this.el.find(".xt-player-toast").addClass("animated bounceIn").removeClass("bounceOut");
        }
        this.el.find(".xt-player-action").css('opacity',1);
        this.el.find(".xt-player-toast").text(msg);
        if(time!=0){
            let id = Math.floor(Math.random()*10000);
            this.el.find(".xt-player-toast").attr('data-index',id);
            setTimeout(()=>{
                this.el.find(`.xt-player-toast[data-index=${id}]`).fadeOut(200);
                // this.el.find(`.xt-player-toast[data-index=${id}]`).addClass("bounceOut animated").removeClass("bounceIn");
            },time);
        }
        
    }
    /**
     * 隐藏Toast
     */
    hideToast(){
        this.el.find(".xt-player-toast").fadeOut(200)
    }
    /**
     * 获取原生Video
     */
    getVideo(){
        return this._video[0];
    }
    /**
     * 获取总时间
     */
    getDuration(){
        return this.getVideo().duration;
    }
    /**
     * 获取当前所在秒数
     */
    getCurrentTime(){
        return this.getVideo().currentTime;
    }
    /**
     * 跳转指定秒数
     * @param {*} s 秒数
     */
    seek(s){
        s = s>this.getDuration()?this.getDuration():s
        this.el.find(".xt-player-progress .progress-item").css({
            width:(s/this.getDuration()*100)+"%"
        });
        this.getVideo().currentTime = s;
    }
    /**
     * 播放
     */
    play(){ 
        this.getVideo().play();
    }
    /**
     * 暂停
     */
    pause(){
        this.getVideo().pause();
    }
    _setToggleActive(name,flag){
        let el = this.el.find(`.xt-player-btn-toggle[data-type=${name}]`);
        if(String(flag)=="true"){
            el.addClass('active');
        }else{
            el.removeClass('active');
        }
    }
    /**
     * 设置重复播放
     * @param {*} flag 
     */
    setLoop(flag){
        this.getVideo().loop = String(flag)=="true"?true:false;
        cache.set("videoLoop",flag);
        this._setToggleActive('loop',flag);
    }
    /**
     * 设置字幕开关
     * @param {*} flag 
     */
    setSubtitle(flag){
        this._subtitle.setEnable(String(flag)=="true"?true:false);
        cache.set("videoSubtitle",flag);
        this._setToggleActive('subtitle',flag);
    }
    /**
     * 设置预加载
     * @param {*} flag 
     */
    setPreload(flag){
        this.getVideo().preload = String(flag)=="true"?true:false;
        cache.set("videoPreload",flag);
        this._setToggleActive('preload',flag);
    }
    /**
     * 设置自动播放
     * @param {*} flag 
     */
    setAutoPlay(flag){
        this.getVideo().autoplay = String(flag)=="true"?true:false;
        cache.set("videoAutoPlay",flag);
        this._setToggleActive('autoplay',flag);
    }
    setDanmu(flag){
        this._danmu.setDanmu(String(flag)=="true"?true:false);
        cache.set("videoDanmu",flag);
        this._setToggleActive('danmu',flag);
    }
    /**
     * 设置防挡字幕(设置后弹幕减少5行)
     * @param {*} flag 
     */
    setPresubtitle(flag){
        this._danmu.setPreSubTitle(String(flag)=="true"?true:false);
        cache.set("videoPreSubtitle",flag);
        this._setToggleActive('presubtitle',flag);
    }
    setWidth(width,unit){
        unit = typeof(unit)=='undefined'?'px':unit;
        this.el.css("width",width+unit);
    }
    setHeight(height,unit){
        unit = typeof(unit)=='undefined'?'px':unit;
        this.el.css("height",height+unit);
    }
    _setSettingStatus(flag){
        flag = String(flag)=="true"?true:false;
        if(flag){
            this.el.find('.xt-player-setting-controller').css('zIndex',0);
            this.el.find('.xt-player-setting-controller').fadeIn(0).addClass("animated zoomIn").removeClass("zoomOut");
            this._isOpenSettingMenu = true;
        }else{
            this.el.find('.xt-player-setting-controller').css('zIndex',0);
            this.el.find('.xt-player-setting-controller').addClass("animated zoomOut").removeClass("zoomIn");
            setTimeout(()=>{
                this.el.find('.xt-player-setting-controller').fadeOut(0);
            },300);
            this._isOpenSettingMenu = false;
        }
    }
    _setVolumeStatus(flag){
        flag = String(flag)=="true"?true:false;
        if(flag===true){
            this.el.find(".xt-player-volume-controller").css('zIndex',200);
            this.el.find(".xt-player-volume-controller").fadeIn(0).addClass("animated zoomIn").removeClass("zoomOut");
            this._isOpenVolume = true;
        }else{
            this.el.find(".xt-player-volume-controller").css('zIndex',0);
            this.el.find(".xt-player-volume-controller").addClass("zoomOut animated");
            setTimeout(()=>{
                this.el.find('.xt-player-volume-controller').fadeOut(0);
            },300);
            this._isOpenVolume = false;
        }
    }
}
module.exports = XtPlayer;