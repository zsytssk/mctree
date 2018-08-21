import { BaseCtrl } from './base';

type DisplayType = '' | 'in_box' | 'on_box';

/** 所有页面节点ctrl的基础类 */
export class NodeCtrl extends BaseCtrl {
    /** 两种方式:
     * show_progress:>显示loading页面, 进度条变化;
     * in_background:>在后台加载
     */
    protected display_type: DisplayType = 'in_box';
    protected view_creator: typeof Laya.Sprite;
    public view: Laya.Sprite;
    /** 所有页面节点ctrl的基础类
     * @param view_creator 是构造函数将其保存到view_class中
     */
    constructor(view_creator: Laya.Sprite | typeof Laya.Sprite) {
        super();
        if (typeof view_creator === 'function') {
            // 构造函数
            this.view_creator = view_creator;
        } else {
            // 普通节点
            this.view = view_creator;
        }
    }
    protected initView(): void {
        // 如果this.view未定义, 用view_class创建ui
        const { view, view_creator } = this;
        if (view || !view_creator) {
            return;
        }
        this.view = new view_creator();
        if (this.parent && this.parent instanceof NodeCtrl) {
            this.parent.addChildView(this);
        }
    }
    /** 显示view */
    public show() {
        const { parent, view, display_type } = this;
        if (display_type === 'in_box') {
            (view as Laya.Sprite).visible = true;
            return;
        }
        if (parent instanceof NodeCtrl) {
            parent.addChildView(this);
        }
    }
    /** 隐藏View */
    public hide() {
        const { parent, view, display_type } = this;
        if (display_type === 'in_box') {
            view.visible = false;
            return;
        }
        if (parent instanceof NodeCtrl) {
            parent.removeChildView(this);
        }
    }
    /** 添加childCtrl */
    public addChild(child: BaseCtrl) {
        super.addChild(child);

        if (child instanceof NodeCtrl) {
            this.addChildView(child);
        }
    }
    /** 删除childCtrl */
    public removeChild(child: NodeCtrl) {
        // 将他的view从父类的view中去除
        if (child instanceof NodeCtrl) {
            this.removeChildView(child);
        }
        super.removeChild(child);
    }
    /** 在自己的view中 添加子类的view */
    private addChildView(child: NodeCtrl) {
        // child 不是this的子Ctrl下面不做处理
        const index = this.children.indexOf(child);

        if (index === -1) {
            return;
        }
        if (!child.view) {
            return;
        }
        // view已经添加进去, 不用处理
        if (child.view.parent === this.view) {
            return;
        }
        this.view.addChild(child.view);
    }
    /** 在自己的view中 移除子类的view */
    private removeChildView(child: NodeCtrl) {
        this.view.removeChild(child.view);
    }
    /** 删除View, 从父类Ctrl中删除自己 删除model 删除link */
    public destroy() {
        super.destroy();
        const { view } = this;
        if (view) {
            view.destroy(true);
            this.view = undefined;
        }
    }
}
