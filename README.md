# XtPlayer
支持弹幕、字幕的HTML5 播放器(dev)
## Demo地址
https://xtplayer.acgxt.com
## 详细文档地址
https://api.acgxt.com/#/document/xtplayer

## 使用方法

```javascript
    //开启Debug调试
    window.XtPlayerDebug = true;
    
    var xtPlayer = new XtPlayer("#app", {
        //当前播放的视频资源地址
        src: "8.mp4",
        //使用加载器加载视频[hls,flv]需载入前置js(hls.js,flv.js)
        loader: "mp4",
        quality:[//视频品质 v1.2.0以后版本支持
            {
                name:"高清",
                src:"8.mp4",
                loader:"mp4"
            },
            {
                name:"清晰",
                src:"8.mp4",
                loader:"mp4"
            },
            {
                name:"流畅",
                src:"8.mp4",
                loader:"mp4"
            }
        ],
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
        },
        button:{//是否显示底部控件按钮 v1.2.1
			volume:false,//音量
			setting:false,//设置
			windowFullScreen:false,//窗口全屏
			fullScreen:false//全屏
		}
    });
```
## XtPlayer更新日志
### v1.2.1
* 1.修复弹幕在窗口全屏下无法自动变动大小问题
* 2.增加右键画中画模式
* 3.增加手动设置时间跳转
* 4.增加设置中按钮开关显示
### v1.2.0
* 1.增加网页全屏
* 2.增加右键倍速
* 3.增加视频品质选择
* 4.修复已知显示bug
### v1.1.1
* 1.修复进度条滑块显示差距问题
### v1.1.0
* 1.修复部分已知Bug
* 2.增加flv.js加载视频
## v1.0.0
* 基础XtPlayer创建,支持字幕,弹幕