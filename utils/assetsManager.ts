import { log, logErr } from "./zutil";

export type ResStatus = "loaded" | "unload" | "loading";
export type ResMap = Array<{
  name: string;
  res: any[];
  res_dependencies?: any[]; // 依赖资源
  resource_status: ResStatus;
  res_relatives?: string[];
  order?: number;
}>;

/** 加载队列 */
type LoadItem = {
  res?: any[];
  /** 所属的ctrl名称 */
  res_name?: string;
  type: "dependency" | "relative";
  status?: ResStatus;
  resolve?: FuncVoid;
  reject?: FuncVoid;
  loading_fun?: FunLoading;
  order: number;
};

type FunLoading = (process: number) => void;

/** loading的状态 空闲 正在加载 */
type Status = "stop" | "loading";
export class AssetsManager {
  private load_queue: LoadItem[] = [];
  private status: Status = "stop";
  /** 正在加载的资源 */
  private loading_item: LoadItem;
  private res_map: ResMap;
  /** 设置资源列表 */
  constructor(res_map: ResMap) {
    this.res_map = res_map;
  }
  /**
   * 加载资源之后执行返回函数
   * @param ctrl 需要加载资源的控制器
   * @param callback 返回函数
   */
  public load(res_name: string, loading_fun?: FunLoading) {
    // zutil.log('load_ctrl::load', ctrl.name);

    /**  将资源添加到load_que中  */
    const promise = this.addCtrlToQueue(res_name, loading_fun);
    /** 如果load没有正在加载的资源, 启动记载 */
    if (this.status === "stop") {
      this.status = "loading";
      this.loadingQueue();
    }
    return promise;
  }
  /**
   * 加依赖资源
   */
  private loadingQueue() {
    const load_queue = this.load_queue;
    if (load_queue.length === 0) {
      this.status = "stop";
      log("load_queue is empty, all res is loaded");
      return;
    }

    this.loading_item = load_queue.shift();
    const { res, loading_fun, status, resolve } = this.loading_item;

    const loading_item = this.loading_item;
    const new_resolve = () => {
      /**loader.clearUnLoaded 有时并不能停止正在加载的资源
       * 导致多个加载队列同时进行, 会导致我的load过程中黑屏bug
       * 如果当前加载结束的元素和正在加载的元素和不一样,
       * 说明在插入加载资源的时候stopLoadQue并没有停止,
       * 所以这里的所有操作并不需要去进行
       */
      if (this.loading_item !== loading_item) {
        return;
      }
      this.loading_item = null;
      if (typeof resolve === "function") {
        resolve();
      }
      this.loadingQueue();
    };

    /** 如果资源已经加载 | 没有资源 | 资源为空 直接调用callback */
    if (!res || res.length === 0 || status === "loaded") {
      new_resolve();
      return;
    }

    this.loadItem(res, loading_fun).then(new_resolve);
  }
  /**
   * 加载单个item资源
   * @param res 加载的资源
   * @param loading_fun 加载中更新进度条函数
   */
  private async loadItem(res: any[], loading_fun: FunLoading) {
    /** 空的资源列表 直接执行返回函数  */
    if (!res.length) {
      return;
    }
    /** 如果是单个资源对象, 直接执行返回函数  */
    if (res[0] && res[0].url) {
      await new Promise((resolve, reject) => {
        Laya.loader.load(
          res,
          new Laya.Handler(this, resolve),
          new Laya.Handler(this, loading_fun)
        );
      });
      return;
    }
    /** 传入的资源不是res[]格式  */
    if (!res[0].length || !res[0][0] || !res[0][0].url) {
      logErr("load:> res is not a res array");
      return;
    }

    const len = res.length;
    let loading_progress_fun;
    if (loading_fun) {
      loading_progress_fun = progress => {
        loading_fun((loaded_num + progress) / len);
      };
    }

    let loaded_num = 0;
    for (const item of res.reverse()) {
      await this.loadItem(item, loading_progress_fun).then(() => {
        loaded_num++;
        if (loading_fun) {
          loading_fun(loaded_num / len);
        }
      });
    }
  }
  /**  停止正在队列加载  */
  private stopLoadQue() {
    const loader = Laya.loader;
    const loading_item = this.loading_item;
    // /** 如果正在加载的是load, 不停止, load具有最高的优先级  */
    // if (this.life_status != 'inited') {
    //     return;
    // }
    if (this.status !== "loading") {
      return;
    }
    this.status = "stop";
    /** 停止正在加载的资源 */

    loader.clearUnLoaded();
    // zutil.log('load_ctrl::clearUnLoaded::end', this.life_status, this.status); //debug
    if (!loading_item) {
      return;
    }
    /** 将正在加载的资源重新放到加载队列的前面 */
    this.load_queue.unshift(loading_item);
  }
  /** 添加ctrl资源进入加载队列 */
  private addCtrlToQueue(res_name: string, loading_fun?: FunLoading) {
    return new Promise((resolve, reject) => {
      const res_info = this.getResInfo(res_name);

      /** 加载资源完成后设置resource_status= loaded, 将这个包裹在资源加载完成的执行函数中 */
      const end_resolve = () => {
        this.setResStatus(res_name, "loaded");
        resolve();
      };

      /**如果没有资源 也没有依赖资源 直接执行,
       * 这么做是防止 alert tip 弹层被初始化被延迟执行了
       * 这显然没有必要
       */
      if (
        !res_info.res &&
        !(res_info.res_dependencies && res_info.res_dependencies.length)
      ) {
        logErr(`cant find res for name=${res_name}`);
        end_resolve();
        return;
      }

      /** 加载顺序 relative --> 自己 --> dep, loadqueue 是从前到后加载所有加载的顺序是 这样的 */
      /*relative res*/
      if (res_info.res_relatives && res_info.res_relatives.length) {
        /**  数组里面的按顺序加载比较合理, 为了保证这一步, 后面的要先加进去--load的逻辑是后加的先加载  */
        const len = res_info.res_relatives.length;
        for (let i = len - 1; i >= 0; i--) {
          this.addResToQueue({
            order: 0,
            res: res_info.res_relatives[i],
            res_name,
            type: "relative"
          });
        }
      }

      let res: any[] = [];
      if (res_info.res && res_info.res.length) {
        res = res.concat(res_info.res);
      } else {
        res.push(res_info.res);
      }
      if (res_info.res_dependencies && res_info.res_dependencies.length) {
        res = res.concat(res_info.res_dependencies);
      }

      /*自己 res*/
      this.addResToQueue({
        loading_fun,
        order: res_info.order || 0,
        reject,
        res,
        res_name,
        resolve: end_resolve,
        status: res_info.status,
        type: "dependency"
      });
    });
  }
  /**
   * 有需要加载资源的NodeCtrl, 通过name在resMap定位相应的资源,
   * 先加载资源再初始化ui,
   */
  private getResInfo(res_name: string) {
    let res: any[];
    let order: number;
    let name: string;
    let status: ResStatus;
    let res_dependencies: any[];
    let res_relatives: any[];

    for (const item of this.res_map) {
      if (item.name === res_name) {
        res = item.res;
        name = item.name;
        order = item.order;
        status = item.resource_status as ResStatus;
        res_relatives = item.res_relatives;
        res_dependencies = item.res_dependencies;
      }
    }
    /** 场景的优先级 大于没有order的 小于所有小鱼order的  */
    return {
      order: order || 0,
      /** 本身资源 */
      res,
      /** 依赖资源--必须提前加载 */
      res_dependencies,
      /** 关联资源--后续加载 */
      res_relatives,
      status
    };
  }
  private addResToQueue(res_info: LoadItem) {
    const load_queue = this.load_queue;

    /** 如果正在加载的元素的优先级小于等于 要加载元素优先级, 停止正在加载的队列 */
    const loading_item = this.loading_item;
    if (loading_item) {
      if (loading_item.order <= res_info.order) {
        this.stopLoadQue();
      }
    }

    /** 将要加载的元素按照他的order排列 */
    for (let i = 0; i < load_queue.length; i++) {
      if (load_queue[i].order <= res_info.order) {
        load_queue.splice(i, 0, res_info);
        return;
      }
    }
    /** 如果为空直接push进去 */
    load_queue.push(res_info);
  }
  /**
   * 设置resMap中资源的状态
   */
  private setResStatus(res_name: string, status: ResStatus) {
    for (const item of this.res_map) {
      if (item.name === res_name) {
        item.resource_status = status;
      }
    }
  }
}
