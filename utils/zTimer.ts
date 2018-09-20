import { generateRandomString } from './utils';

/**
 * 像interval一样的重复执行函数, 只是全部通过 requestAnimationFrame 来实现的
 */
type HookFunItem = {
    /**  监听事件  */
    fun: FuncVoid;
    /**  是否执行一次  */
    once: boolean;
    id: string;
    delay: number;
    then: number;
};

const calcGcd = (x: number, y: number) => (!y ? x : calcGcd(y, x % y));
const calcGcdArr = (arr: number[]) => {
    let result;
    for (const item of arr) {
        result = calcGcd(item, result);
    }
    return result;
};

class ZTimer {
    private hooks = [] as HookFunItem[];
    /** 开始执行循环函数
     * fun 每次执行的执行的韩式
     * @param time 传入的间隔
     * @param space_time 间隔的时间间隔
     */
    public loop(fun: FuncVoid, delay: number, once?: boolean) {
        const id = generateRandomString();
        this.hooks.push({
            delay,
            fun,
            id,
            once,
            then: Date.now(),
        });
        this.reRun();
        return id;
    }
    public once(fun, delay) {
        return this.loop(fun, delay, true);
    }
    public clear(id: string) {
        if (!id) {
            return;
        }
        const { hooks } = this;

        for (let len = hooks.length, i = len - 1; i >= 0; i--) {
            const { id: item_id } = hooks[i];
            if (item_id !== id) {
                continue;
            }
            this.hooks.splice(i, 1);
            this.reRun();
            return;
        }
    }
    /** 计算所有interval的最大公约数, 每gcd（最大公约数）次执行一次interval */
    private reRun() {
        Laya.timer.clear(this, this.run);
        const delay_arr = this.hooks.map(item => {
            return item.delay;
        });
        if (!delay_arr.length) {
            return;
        }
        const gcd = calcGcdArr(delay_arr);
        Laya.timer.loop(gcd, this, this.run);
    }
    private run() {
        const hooks = this.hooks;
        const len = hooks.length;
        if (!len) {
            return;
        }
        const now = Date.now();
        for (let i = len - 1; i >= 0; i--) {
            const hook_item = hooks[i];
            const { fun, then, delay, once, id } = hook_item;
            const elapsed = now - then || 0;
            if (elapsed < delay) {
                continue;
            }
            const time = Math.floor(elapsed / delay);

            const new_then = now - (elapsed - time * delay);
            if (typeof fun === 'function') {
                fun(time);
            }
            if (once) {
                this.clear(id);
                continue;
            }
            hook_item.then = new_then;
        }
    }
}

export const zTimer = new ZTimer();
