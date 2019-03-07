class Cache{

    static set(name,value){
        localStorage.setItem(`xtPlayer_${name}`,value);
    }
    static get(name){
        let data = localStorage.getItem(`xtPlayer_${name}`);
        if(data==null){
            return undefined;
        }else{
            return data;
        }
    }
    static remove(name){
        localStorage.removeItem(`xtPlayer_${name}`);
    }
}

module.exports = Cache;