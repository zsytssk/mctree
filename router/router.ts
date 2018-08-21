import { BaseEvent } from '../event';
import { RouterConfigNode } from './configNode';
import { RouterOutsetCtrl } from './routerOutset';
import { ChangeInfo, PathInfo, ZsyDirector } from './zsy.director';
import { splitPath } from './zsy.director.utils';

/** router切换传给CMD.router_enter的数据结构 */
export type EnterData = {
    router_path: string;
    is_completed: boolean;
};
/** 初始化 */
export type EnterInit = {
    enter_page: string;
};

export const cmd = {
    router_change: 'router_change',
    router_enter: 'router_enter',
    router_leave: 'router_leave',
};

type RouterAction = {
    url: string;
};

/** 路由控制器 */
export class RouterCtrl extends BaseEvent {
    /** director用来设置url, 同时监听url发生变化触发事件 */
    public director: ZsyDirector;
    public is_entered = false;
    /** router 正在进行的处理的列表
     * 每一次 UrlChangeType 的改变
     */
    private change_action: RouterAction;
    public name = 'router';
    private config_node: RouterConfigNode;
    /** 路由控制器 */
    constructor() {
        super();
    }
    public init() {
        const options = {
            mode: 'hash',
        };
        this.director = new ZsyDirector(options);
        this.config_node = new RouterConfigNode({
            path: '/',
        });
    }
    // 初始化
    public startListen() {
        this.director.listen(this.onRouterChange.bind(this));
    }
    /** 添加路由配置  */
    public addConfig(config, outset_ctrl: RouterOutsetCtrl, path: string) {
        const { config_node } = this;
        const path_config_node = config_node.findNodeByPath(splitPath(path));
        path_config_node.createChildByConfig(config, outset_ctrl);

        this.handleChangeAction();
        return path_config_node.removeChildren.bind(path_config_node);
    }
    private onRouterChange(change_info: ChangeInfo) {
        /** 主路径的修改  */
        if (change_info.type === 'path') {
            this.trigger(cmd.router_change, {
                next_path: change_info.end_val,
                prev_path: change_info.ori_val,
            });

            this.change_action = {
                url: change_info.end_val,
            };

            this.handleChangeAction();
            return;
        }
        /** 其他路径的修改  */
        if (change_info.type === 'outset') {
            return;
        }
        /** 参数的修改  */
        if (change_info.type === 'param') {
            return;
        }
    }
    /**
     * 路由主路劲的变化的时候 处理相应的页面逻辑
     * @param next_path 下一个(将要的变化)路径地址
     */
    private handleChangeAction() {
        if (!this.change_action) {
            return;
        }
        const { config_node } = this;

        const next_path_map = splitPath(this.change_action.url);
        const next_config_node = config_node.findNodeByPath(next_path_map);

        if (next_config_node === config_node) {
            this.navigate('default', true);
            return;
        }
        const redirect_node = next_config_node.redirect_node;
        if (redirect_node) {
            this.navigate(redirect_node.abs_path, true);
            return;
        }
        /** 离开已经进入的... */
        config_node.leaveFlow(next_config_node);
        /** 进入router后, 重置change_action */
        next_config_node.enterBackTrack().then(() => {
            this.change_action = undefined;
        });
    }
    /**
     * 跳转
     * @param path 要跳转的路径或者对象信息
     * @param replace_state 是否覆盖前一个历史
     */
    public navigate(path: string | PathInfo, replace_state?: boolean) {
        /** 只有字符串, 路径修改  */
        if (typeof path === 'string') {
            this.director.navigate(
                {
                    type: 'path',
                    value: path,
                },
                replace_state,
            );
            return;
        }

        this.director.navigate(path, replace_state);
    }
}
