import { NodeCtrl } from '../ctrl/node';
import { queryClosestClass } from '../utils/zutil';
import { RouterConfig } from './configNode';
import { RouterCtrl } from './router';

type RouterOutsetConfig = {
    router_ctrl: RouterCtrl;
    path: string;
    is_top?: boolean;
    config: RouterConfig;
};

/**  获得本ctrl在目录树中绝对地址  */
function getRouterOutsetPath(item: RouterOutsetCtrl, path?: string) {
    if (!path) {
        path = '';
    }
    if (item.is_top_router) {
        return item.path + path;
    }
    path = item.path + '/' + path;
    const parent = queryClosestClass(item, RouterOutsetCtrl);
    return getRouterOutsetPath(parent, path + '/');
}

/**
 * router的包裹ctrl
 */
export class RouterOutsetCtrl extends NodeCtrl {
    public name = 'router_outset';
    public router_ctrl: RouterCtrl;
    public config: RouterConfig;
    public path: string;
    public is_top_router = false;
    /** 销毁在config_node上的的配置节点... */
    private destroy_config: FuncVoid;
    constructor(view: Laya.Sprite, config: RouterOutsetConfig) {
        super(view);
        this.path = config.path;
        this.is_top_router = config.is_top;
        this.config = config.config;
        this.router_ctrl = config.router_ctrl;
    }
    public init() {
        this.initRouter();
        this.initEvent();
    }
    private initRouter() {
        const { config, router_ctrl } = this;
        const router_configs = [] as RouterConfig;
        for (const item of config) {
            router_configs.push({
                ...item,
            });
        }
        this.destroy_config = router_ctrl.addConfig(
            router_configs,
            this,
            this.absPath(),
        );
    }
    private absPath() {
        return getRouterOutsetPath(this);
    }
    protected initEvent() {
        // this.on(CMD.global_resize, () => {
        //     this.setSize();
        // });
    }
    public setSize() {
        //
    }
    public destroy() {
        if (this.destroy_config) {
            this.destroy_config();
        }
        super.destroy();
    }
}
