import { NodeCtrl } from '../ctrl/node';

type DisplayStyle = '' | 'in_box' | 'on_box';
export class OrderNodeCom {
    protected display_style: DisplayStyle = 'in_box';
    public view: Laya.Sprite;
    constructor(private belong_ctrl: NodeCtrl) {}
}
