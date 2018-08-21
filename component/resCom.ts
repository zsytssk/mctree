import { load_util, ResStatus } from '../utils/assetsManager';

class ResCom {
    private res_name: string;
    constructor(res_name) {
        this.res_name = res_name;
    }
    /** 添加资源 */
    protected loadRes(callback: Function) {
        return load_util.load(this.res_name);
    }
    /** 获得节点对应资源的状态 */
    get resource_status() {
        const { res_name } = this;
        let result = null;
        for (let i = 0; i < RESMAP.length; i++) {
            if (RESMAP[i].name == res_name) {
                return RESMAP[i].resource_status as ResStatus;
            }
        }
        return result;
    }
    /** 设置节点对应资源的状态 */
    set resource_status(status: ResStatus) {
        const { res_name } = this;
        for (let i = 0; i < RESMAP.length; i++) {
            if (RESMAP[i].name == res_name) {
                RESMAP[i].resource_status = status;
            }
        }
    }
}
