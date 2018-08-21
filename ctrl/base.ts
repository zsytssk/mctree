import { BaseEvent } from '../event';
import {
    getCtrlTreePath,
    log,
    logErr,
    queryClosest,
    queryElements,
    queryTop,
} from '../utils/zutil';

export const cmd = {
    added: 'added',
    removed: 'removed',
};
/**  ctrl 的基本类, 所有的事件处理类  */
export class BaseCtrl extends BaseEvent {
    public readonly name: string = 'base_ctrl';
    protected children = [] as BaseCtrl[];
    protected parent: BaseCtrl = null;
    /** 在父元素中的order, 越大余额靠后, 用来处理场景切换, pop始终在最上面 */
    protected link: AnyObj;
    /**  是否是最顶级的ctrl  */
    protected is_top: boolean = false;
    get ctrl_path(): string {
        return getCtrlTreePath(this);
    }
    /**  ctrl 是不是放在ctrl树中  */
    get in_ctrl_tree() {
        const top_ctrl = queryTop(this);
        if (top_ctrl && top_ctrl.is_top) {
            return true;
        }
        return false;
    }
    /**  添加childCtrl  */
    public addChild(childCtrl: BaseCtrl) {
        const child_list = this.children;
        child_list.push(childCtrl);
        childCtrl.parent = this;
        childCtrl.trigger(cmd.added);
    }
    /**  删除childCtrl  */
    public removeChild(childCtrl: BaseCtrl) {
        const child_index = this.children.indexOf(childCtrl);
        if (child_index === -1) {
            return;
        }
        this.children.splice(child_index, 1);
        childCtrl.trigger(cmd.removed);
    }
    public removeChildren() {
        for (let len = this.children.length, i = len - 1; i >= 0; i--) {
            this.children[i].destroy();
        }
        this.children = [];
    }
    public getChildByName(name: string): BaseCtrl {
        for (const child of this.children) {
            if (child.name === name) {
                return child;
            }
        }
        return undefined;
    }
    /**  获得ctrl子元素的个数  */
    public get numChildren(): number {
        return this.children.length;
    }
    /** 报告事件, 传给当前ctrl的父级 包括自己
     * @param event 事件名称
     * @param target 目标ctrl
     * @param data 要传递的数据
     */
    public report(event: string, target?: string | BaseCtrl, data?: AnyObj) {
        if (!this.in_ctrl_tree) {
            logErr(`${this.name} not in ctrl tree`);
            return;
        }
        // ctrl_path是baseCtrl, 而不是字符串
        if (target instanceof BaseCtrl) {
            target.callTrigger(event, data);
            return;
        }
        /**  消息传给ctrl */
        this.passReport(event, target, data);
    }
    /** 向上传递事件
     * @param event 事件名称
     * @param target_path:string 目标ctrl目录树中的地址,类式app::pop_wrap::alert
     * 如果是baseCtrl类, 就直接调用ctrl的相应方法
     * @param data 要传递的数据
     */
    public passReport(event: string, target_path: string, data) {
        // 如果没有指定目标ctrl, 就是向所有的节点广播
        if (!target_path) {
            this.callTrigger(event, data);
            if (this.parent) {
                this.parent.passReport(event, target_path, data);
            }
            return;
        }

        // 目的地是字符串
        if (typeof target_path !== 'string') {
            return;
        }
        const target = queryClosest(this, target_path) as BaseCtrl;
        /**  当前的ctrl就是event_name制定的ctrl  */
        if (!target) {
            return;
        }
        target.callTrigger(event, data);
    }
    /** 广播消息, 事件先找到最顶级的ctrl(包括自己)然后向下查找ctrl_path, 找到就继续相应的绑定函数
     * @param event 事件名称
     * @param target 目标ctrl在目录树中的绝对地址
     * @param data 要传递的数据
     */
    public broadcast(event: string, target?: string | BaseCtrl, data?: AnyObj) {
        const top_ctrl = queryTop(this);
        if (!top_ctrl.is_top) {
            logErr(`${this.name} not in ctrl tree`);
            return;
        }
        top_ctrl.passEmitEvent(event, target, data);
    }
    /** 发射事件, 传给当前ctrl的子集 包括自己
     * @param event 事件名称`
     * @param target 目标ctrl在目录树中的绝对地址
     * @param data 要传递的数据
     */
    public emit(event: string, target?: string | BaseCtrl, data?: AnyObj) {
        if (!this.in_ctrl_tree) {
            logErr(`${this.name} not in ctrl tree`);
            return;
        }

        /**  消息传给ctrl */
        this.passEmitEvent(event, target, data);
    }
    /** 向下传递事件
     * @param event 事件名称
     * @param target:string 目标ctrl目录树中的地址,类式app::pop_wrap::alert
     * 如果是baseCtrl类, 就直接调用ctrl的相应方法
     * @param data 要传递的数据
     */
    public passEmitEvent(event: string, target: string | BaseCtrl, data) {
        // 如果没有指定目标ctrl_path, 就是向所有子节点的节点广播
        if (!target) {
            this.callTrigger(event, data);
            for (const child of this.children) {
                child.passEmitEvent(event, target, data);
            }
            return true;
        }

        // ctrl_path是baseCtrl, 直接触发事件
        if (target instanceof BaseCtrl) {
            target.callTrigger(event, data);
            return true;
        }

        if (typeof target !== 'string') {
            return;
        }
        /**将app::pop_wrap::alert 变成
         * name:pop_wrap name:alert..
         */
        const query_str = target
            .split('::')
            .map(item => {
                return 'name:' + item;
            })
            .join(' ');
        const target_arr = queryElements(this, query_str) as BaseCtrl[];
        if (!target_arr.length) {
            log(`can't find ctrl for ${target}`);
            return;
        }
        for (const target_item of target_arr) {
            target_item.callTrigger(event, data);
        }
    }
    /**
     * @param event 事件名称
     * @param data 要传递的数据
     */
    protected callTrigger(event: string, data: AnyObj) {
        this.trigger(event, data);
    }
    /**  取消所有的事件绑定 从父类Ctrl中删除自己 删除model 删除link */
    public destroy() {
        // 删除所有的子类
        this.removeChildren();
        if (this.parent) {
            this.parent.removeChild(this);
            this.parent = undefined;
        }
        this.link = undefined;
        // 取消所有的事件绑定
        super.destroy();
    }
}
