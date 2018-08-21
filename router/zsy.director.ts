import { log } from '../utils/zutil';
import {
    ChangeItem,
    clearPath,
    compareObj,
    routerObjToUrl,
    urlToObj,
} from './zsy.director.utils';

type UrlInfo = {
    path?: string;
    outset?: {
        [key: string]: string;
    };
    param?: {
        [key: string]: string;
    };
};
export type ChangeInfo = {
    type: UrlChangeType;
    key?: string;
    ori_val?: string;
    end_val?: string;
};

export type ChangeListener = (data: ChangeInfo) => void;

export type PathInfo = {
    type: UrlChangeType;
    /** outset改变的name */
    outset_name?: string;
    /** outset改变的key name */
    param_name?: string;
    value: any;
};
/**  路径变化的类型  */
export type UrlChangeType = 'path' | 'outset' | 'param';

export type DirectorMode = 'history' | 'hash' | 'memory';

/**  路由控制  */
export class ZsyDirector {
    private mode: DirectorMode;
    private root;
    private interval: number;
    private is_inited = false;
    private on_change_before_fns = [] as ChangeListener[];
    /** 当前页面所在的地址 */
    private cur_router = {} as UrlInfo;
    constructor(options) {
        this.initConfig(options);
    }
    private initConfig(options) {
        this.mode = (options && options.mode) || 'hash';

        if (this.mode === 'history' && !history.pushState) {
            this.mode = 'hash';
        }

        this.root =
            options && options.root ? '/' + clearPath(options.root) + '/' : '/';
        return this;
    }
    /**  获得当前的页面地址  */
    public getPathInfo() {
        let path = '';
        if (this.mode !== 'memory') {
            const match = window.location.href.match(/#(.*)$/);
            path = match ? match[1] : '';
        } else {
            path = localStorage.getItem('zsy_director_url') || '';
        }

        path = clearPath(path);

        return urlToObj(path);
    }
    public listen(fun?: FuncVoid) {
        if (fun) {
            this.onChange(fun);
        }
        if (this.mode === 'history') {
            window.addEventListener('popstate', e => {
                this.check();
            });
        } else {
            clearInterval(this.interval);
            this.interval = setInterval(this.check.bind(this), 100);
        }
        this.check();
    }
    private check() {
        const cur_url_info = this.getPathInfo();
        const { cur_router, is_inited } = this;

        let change_arr = compareObj(cur_router, cur_url_info);

        /** 初始化时没有要跳转的url, 转到default */
        if (!is_inited && !change_arr.length) {
            change_arr = [
                {
                    end_val: 'default',
                    key: 'path',
                    type: 'add',
                },
            ];
        }
        if (!change_arr.length) {
            /** 没有改变  */
            return;
        }

        this.is_inited = true;

        const { on_change_before_fns } = this;
        const fn_len = on_change_before_fns.length;

        on_change_before_fns.forEach((fun, i) => {
            if (!fun && typeof fun !== 'function') {
                return true;
            }
            for (const change of change_arr) {
                setTimeout(() => {
                    this.runChangeFun(fun, change);
                }, 0);
            }
            if (i === fn_len - 1) {
                this.cur_router = cur_url_info;
            }
        });
        return;
    }
    private runChangeFun(fun: ChangeListener, change_item: ChangeItem) {
        let change_info = {} as ChangeInfo;
        if (change_item.key === 'path') {
            change_info = {
                end_val: change_item.end_val,
                ori_val: change_item.ori_val,
                type: 'path',
            };
        }
        if (change_item.key.indexOf('outset') !== -1) {
            change_info = {
                end_val: change_item.end_val,
                key: change_item.key.replace(/outset(:)*/g, ''),
                ori_val: change_item.ori_val,
                type: 'outset',
            };
        }
        if (change_item.key.indexOf('param') !== -1) {
            change_info = {
                end_val: change_item.end_val,
                key: change_item.key.replace(/param(:)*/g, ''),
                ori_val: change_item.ori_val,
                type: 'param',
            };
        }
        fun(change_info);
    }
    public onChange(fun: ChangeListener) {
        if (!fun || typeof fun !== 'function') {
            return;
        }
        this.on_change_before_fns.push(fun);
    }
    /** 设置当前的页面地址
     * @param replace_state  是否覆盖前一个历史
     * 地址没有意义 跳入default, 这时候 前一个地址还在历史中,
     * 点击后退 还是进入default 原页面
     */
    public navigate(path_info: PathInfo, replace_state?: boolean) {
        const type = path_info.type;
        const url_info = this.getPathInfo();

        switch (type) {
            case 'path':
                url_info.path = path_info.value;
                break;
            case 'outset':
                const outset_name = path_info.outset_name;
                if (outset_name) {
                    url_info.outset = url_info.outset || {};
                    url_info.outset[outset_name] = path_info.value;
                } else {
                    url_info.outset = path_info.value;
                }
                break;
            case 'param':
                const param_name = path_info.param_name;
                if (param_name) {
                    url_info.param = url_info.param || {};
                    url_info.param[param_name] = path_info.value;
                } else {
                    url_info.param = path_info.value;
                }
                break;
            default:
                break;
        }

        let router_str = routerObjToUrl(url_info);
        router_str = clearPath('#/' + router_str);

        switch (this.mode) {
            case 'history':
                const base_url =
                    location.pathname + location.search + clearPath(router_str);
                /** 如果是 默认跳转说明前一个地址没有意义直接覆盖 前一个历史 */
                log('history_change', base_url);
                if (replace_state) {
                    history.replaceState(null, null, base_url);
                } else {
                    history.pushState(null, null, base_url);
                }
                this.check();
                break;
            case 'hash':
                window.location.href =
                    window.location.href.replace(/#(.*)$/, '') + router_str;
                break;
            case 'memory':
                localStorage.setItem('zsy_director_url', router_str);
                break;
        }
    }
}
