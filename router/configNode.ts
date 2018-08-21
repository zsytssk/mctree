import { BaseCtrl } from '../ctrl/base';
import { SceneCtrl } from '../ctrl/scene';
import { isClosest, logErr } from '../utils/zutil';
import { RouterOutsetCtrl } from './routerOutset';
import { splitPath } from './zsy.director.utils';

export type RouterConfig = RouterConfigItem[];
type RouterConfigItem = {
    redirect_to?: string;
    outset_ctrl?: BaseCtrl;
    path: string;
    ctrl_creator?: typeof BaseCtrl;
};

type LeaveType = 'need_break' | 'continue';
/**路由配置node节点
 * 整个router的配置都是一个个的RouterConfigNode节点, 这样我可以随时添加删除
 * 一个配置做成这个样子是应该很浪费的, 我目前没有想到更好的方法去组织
 */
export class RouterConfigNode {
    public ctrl_creator: typeof BaseCtrl;
    public outset_ctrl: BaseCtrl;
    public instance_ctrl: SceneCtrl;
    private path: string;
    private children = [] as RouterConfigNode[];
    public parent: RouterConfigNode;
    private redirect_to: string;
    private entered = false;
    constructor(config: RouterConfigItem) {
        this.ctrl_creator = config.ctrl_creator;
        this.outset_ctrl = config.outset_ctrl;
        this.path = config.path;
        this.redirect_to = config.redirect_to;
    }
    public get is_top() {
        return this.parent ? false : true;
    }
    public get abs_path() {
        if (!this.path) {
            return;
        }
        if (this.parent.is_top) {
            return '/' + this.path;
        }
        return this.parent.abs_path + '/' + this.path;
    }
    public async enter() {
        if (this.is_top) {
            return;
        }
        if (this.entered) {
            return;
        }
        const { ctrl_creator, outset_ctrl } = this;
        const ctrl = new ctrl_creator() as SceneCtrl;
        outset_ctrl.addChild(ctrl);
        this.instance_ctrl = ctrl;
        if (!ctrl.enter) {
            logErr(`${ctrl.name} has no enter function`);
            return;
        }
        this.entered = true;
        await ctrl.enter();
    }
    public async leave() {
        if (!this.entered) {
            return;
        }
        const { instance_ctrl, outset_ctrl } = this;
        outset_ctrl.removeChild(instance_ctrl);
        if (!instance_ctrl.leave) {
            logErr(`${instance_ctrl.name} has no leave function`);
            return;
        }
        await instance_ctrl.leave();
        this.instance_ctrl = undefined;
        this.entered = false;
    }
    public getAbsNode(): RouterConfigNode[] {
        if (!this.parent) {
            return [];
        }
        return this.parent.getAbsNode().concat([this]);
    }
    /** 找到当前  */
    public get redirect_node(): RouterConfigNode {
        if (!this.redirect_to) {
            return;
        }
        if (!this.parent) {
            return;
        }
        const path_arr = splitPath(this.redirect_to);
        let wrap_node = this.parent;
        while (true) {
            if (path_arr[0] === '..') {
                path_arr.shift();
                if (wrap_node.parent) {
                    logErr(`${wrap_node.abs_path} has not parent!`);
                    return;
                }
                wrap_node = wrap_node.parent;
                continue;
            }
            break;
        }
        return wrap_node.findNodeByPath(path_arr);
    }
    public findNodeByPath(path_map: string[]): RouterConfigNode {
        const cur_path = path_map.shift();
        if (this.path !== cur_path) {
            return;
        }
        if (!path_map.length) {
            return this;
        }
        const { children } = this;
        for (const child of children) {
            const path = child.findNodeByPath(path_map.concat([]));
            if (path) {
                return path;
            }
        }
        return this;
    }
    /** 由下向上遍历leave */
    public async leaveFlow(next_node: RouterConfigNode): Promise<LeaveType> {
        const { children } = this;
        const leave_children = [];
        for (const child of children) {
            if (!child.entered) {
                continue;
            }
            leave_children.push(child.leaveFlow.call(child, next_node));
        }

        /** 如果子级中有不需要leave的自己就不leave */
        const need_break = await Promise.all(leave_children).then(values => {
            if (values.indexOf('need_break') !== -1) {
                return true;
            }
            return false;
        });
        if (need_break) {
            return 'need_break';
        }
        if (isClosest(next_node, this)) {
            return 'need_break';
        }
        await this.leave();
        return 'continue';
    }
    /** 由上到下的enter.. */
    public async enterBackTrack(): Promise<void> {
        const { parent } = this;
        if (!parent) {
            return;
        }
        await parent.enterBackTrack();
        await this.enter();
    }
    public createChildByConfig(
        configs: RouterConfig,
        outset_ctrl: RouterOutsetCtrl,
    ) {
        for (const config_item of configs) {
            const config_node = new RouterConfigNode({
                ctrl_creator: config_item.ctrl_creator,
                outset_ctrl,
                path: config_item.path,
                redirect_to: config_item.redirect_to,
            });

            this.addChild(config_node);
        }
    }
    /**  添加childNode  */
    public addChild(childNode: RouterConfigNode) {
        const childs_list = this.children;
        childs_list.push(childNode);
        childNode.parent = this;
    }
    /**  删除childNode  */
    public removeChild(childNode: RouterConfigNode) {
        const child_index = this.children.indexOf(childNode);
        if (child_index === -1) {
            return;
        }
        this.children.splice(child_index, 1);
    }
    public removeChildren() {
        for (let len = this.children.length, i = len - 1; i >= 0; i--) {
            this.children[i].destroy();
        }
        this.children = [];
    }
    public destroy() {
        // 删除所有的子类
        this.removeChildren();
        if (this.parent) {
            this.parent.removeChild(this);
            this.parent = null;
        }
    }
}
