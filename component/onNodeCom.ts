import { log } from '../utils/zutil';
import { Component } from './component';

type HookFunItem = {
    /* *绑定的node */
    node: Laya.Node;
    /** 清除绑定事件 */
    off: FuncVoid;
    /** 事件名称 */
    event: string;
};
type HookFuns = HookFunItem[];

export class OnNode implements Component {
    private hook_funs = [] as HookFuns;
    /** 统一在节点上绑定事件, destroy时候统一清除 */
    public onNode(
        node: Laya.Node,
        event: string,
        listener: FuncVoid,
        once: boolean = false,
    ) {
        if (!node || !(node instanceof Laya.Node)) {
            log('bind node not exist!');
            return;
        }
        if (!event) {
            log('bind event not exist!');
            return;
        }
        if (!listener || typeof listener !== 'function') {
            log('bind function not exist!');
            return;
        }
        if (once) {
            node.once(event, this, listener);
        } else {
            node.on(event, this, listener);
        }
        const off = () => {
            node.off(event, this, listener);
        };
        this.hook_funs.push({
            event,
            node,
            off,
        });
    }
    /**
     * 清除所有在node上绑定事件
     * @param node 要清除在node上绑定的事件
     */
    public off(off_node: Laya.Node) {
        if (!off_node) {
            return;
        }

        const hook_funs = this.hook_funs;
        for (let len = hook_funs.length, i = len - 1; i >= 0; i--) {
            const hook_item = hook_funs[i];
            const { node, off } = hook_item;

            if (node !== off_node) {
                continue;
            }

            off();
            hook_funs.splice(i, 1);
        }
    }
    /** 清除在所有node上绑定事件 */
    public offAll() {
        const hook_funs = this.hook_funs;
        for (let len = hook_funs.length, i = len - 1; i >= 0; i--) {
            const hook_item = hook_funs[i];
            hook_item.off();
            hook_funs.splice(i, 1);
        }
        this.hook_funs = [];
    }
}
