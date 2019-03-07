class Logger{

    static info(msg){
        console.info(`[XtPlayer]`,msg);
    }
    static debug(msg){
        if(typeof(window.XtPlayerDebug)!='undefined'){
            if(window.XtPlayerDebug==true){
                console.log(`[XtPlayer] ${msg}`);
            }
        }
    }
    static error(msg){
        console.error(`[XtPlayer]`,msg);
    }

}
module.exports = Logger;