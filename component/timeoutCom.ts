import { callFunc } from '../utils/utils';

class TimeOut {
    /**储存所有的timetimeout interval 在destroy的时候清除*/
    protected timeout_list: number[] = [];
    protected interval_list: number[] = [];
    constructor() {}
    /**
     * 创建setTimeout, destroy时自动清除
     * @param fun 执行函数
     * @param time 延迟时间
     */
    protected createTimeout(fun: FuncVoid, time: number) {
        let time_out = setTimeout(() => {
            callFunc(fun);
            this.clearTimeout(time_out);
        }, time);
        this.timeout_list.push(time_out);
        return time_out;
    }
    /**
     * 创建setInterval
     * @param fun 执行函数
     * @param time 时间间隔
     */
    protected createInterval(fun: Function, time: number) {
        let interval = setInterval(fun, time);
        this.interval_list.push(interval);
        return interval;
    }
    /**清除time_out setinterval*/
    protected clearTimeout(time_out) {
        let timeout_list = this.timeout_list;
        let interval_list = this.interval_list;

        let index = timeout_list.indexOf(time_out);
        if (index != -1) {
            const time_out = timeout_list.splice(index, 1)[0];
            clearTimeout(time_out);
            return;
        }

        index = interval_list.indexOf(time_out);
        if (index != -1) {
            const interval = interval_list.splice(index, 1)[0];
            clearInterval(interval);
            return;
        }
    }
    /**清除time_out setinterval*/
    protected clearAllTimeout() {
        let timeout_list = this.timeout_list;
        let interval_list = this.interval_list;
        const all_list = timeout_list.concat(interval_list);
        for (let len = all_list.length, i = len - 1; i >= 0; i--) {
            this.clearTimeout(timeout_list[i]);
        }
        this.timeout_list = [];
        this.interval_list = [];
    }
    public destroy() {
        this.clearAllTimeout();
    }
}
