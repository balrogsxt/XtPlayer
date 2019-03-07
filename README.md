# XtPlayer
支持弹幕、字幕的HTML5 播放器(dev)
# 示例网址
https://xtplayer.acgxt.com

##使用方法

```javascript
    window.XtPlayerDebug = true;
    var xp = new XtPlayer("#app", {
    src: "8.mp4",//视频资源地址
    width: 800,//宽度
    height: 'auto',//auto为自动高度
     //初始化时的预览图
    poster: "https://static.acgxt.com/logo6.png",
    //是否自动播放[用户记忆储存]
    autoplay: false,
    //是否预先加载[用户记忆储存]
    preload: true,
    //是否洗脑循环[用户记忆储存]
    loop: false,
    //使用加载器加载视频[hls,flv]需载入前置js(hls.js,flv.js)
    loader: "mp4",
    //默认音量0-1
    volume: 1,
    //弹幕配置
    danmaku: {
        //是否默认显示弹幕[用户记忆储存]
        enable: true,
        //弹幕获取接口 格式[{text:'xxx',color:'xxxx',time:1}]
        api: "https://xtplayer.acgxt.com/getDanmu.php",
         //弹幕接收接口
        send: "https://xtplayer.acgxt.com/sendDanmu.php",
       //单行弹幕密集间距(默认5)
        dense: 5,
        //同屏弹幕最大数量(默认500)
        screenMax: 500,
        //弹幕透明度(默认1)
        opacity: 1,
        //弹幕文字大小(默认18)[不建议修改]
        fontSize: 18,
        //弹幕移动速度(默认1)
        move: 1 
    },
    subtitle: {
        //是否默认显示字幕[用户记忆储存]
        enable: true,
         //字幕接口 格式[{text: "字幕内容",start:"开始秒数",end:"结束秒数"}]
        api: "https://xtplayer.acgxt.com/subtitle.php"
    }
});
```