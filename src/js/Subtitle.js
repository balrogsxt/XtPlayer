const util = require('./Util');
const Logger = require('./Logger');
class Subtitle{

    constructor(xtPlayer){
        this.xtPlayer = xtPlayer;
        this.el = this.xtPlayer.el.find(".xt-player-subtitle");
        this._loadSubtitle();
        this._subTitleThread();
    }
    setEnable(flag){
        this._subtitleEnable = flag;
        if(flag===false){
            this.el.fadeOut(0);
        }
    }
    //载入字幕API
    _loadSubtitle(){
        this._subtitleList = [];
        let live = this;
        if(typeof(this.xtPlayer._options.subtitle)!='undefined'){
            let config = this.xtPlayer._options.subtitle;
            //载入字幕接口
            if(typeof(config.api)!='undefined'){
                let subtitleAPI = config.api;
                util.httpGet(subtitleAPI,{},r=>{
                    if(r.status==200){
                        try{
                            if(typeof(r.data)!='object'){
                                JSON.parse(r.data);
                            }
                            live._subtitleList = r.data;
                            Logger.debug(`字幕获取成功,一共${live._subtitleList.length}条字幕`);
                        }catch(e){
                            live.xtPlayer.showToast("字幕载入失败",2000);
                            Logger.debug("字幕文件格式错误"+e.message);
                        }
                    }else{
                        live.xtPlayer.showToast("字幕载入失败",2000);
                        Logger.debug("字幕文件载入异常"+r.status);
                    }
                },e=>{
                    live.xtPlayer.showToast("字幕载入失败",2000);
                    Logger.error("字幕载入失败"+JSON.stringify(e));
                });
            }
        }
    }
    _getText(s){
        for(let i in this._subtitleList){
            let item = this._subtitleList[i];
            if(s>=item.start&&item.end>=s){
                return item.text;
            }
        }
        return null;
    }
    _subTitleThread(){
        setInterval(() => {
            let liveTime = Math.ceil(this.xtPlayer.getCurrentTime());
            if(this._subtitleEnable==true){
                let text = this._getText(liveTime);
                if(text!=null){
                    this.setText(text);
                }else{
                    this.el.fadeOut(0);
                }
            }
            
        }, 1000);
    }
    //显示字幕
    setText(text){
        let st = this.el.find(".xt-player-subtitle-text");
        st.text(text);
        this.el.fadeIn(0);
        let width = st.width();
        this.el.css({
            marginLeft:`-${width/2}px`
        });
    }

}


module.exports = Subtitle;