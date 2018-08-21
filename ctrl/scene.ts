import { log } from '../utils/zutil';
import { NodeCtrl } from './node';

export class SceneCtrl extends NodeCtrl {
    constructor(view) {
        super(view);
    }
    public enter(): Promise<void> {
        return new Promise((resolve, reject) => {
            log('enter');
            resolve();
        });
    }
    public leave() {
        return new Promise((resolve, reject) => {
            this.destroy();
            resolve();
        });
    }
}
