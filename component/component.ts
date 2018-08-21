import { isFunc } from '../utils/utils';

export type Component = {
    // setManager?: (manager: ComponentManager) => void;
    // destroy?: () => void;
};

type Comps = Component[];

export class ComponentManager {
    private components = [] as Comps;
    constructor(comps?: Component[]) {
        if (comps) {
            this.addComs(comps);
        }
    }
    public getComponent<T extends Component>(creator: ClassOf<T>): T {
        const components = this.components;
        for (const item of components) {
            if (item instanceof creator) {
                return item;
            }
        }
    }
    public addCom(comp) {
        const { components } = this;
        if (isFunc(comp.setManager)) {
            comp.setManager(this);
        }
        components.push(comp);
    }
    public addComs(comps: Component[]) {
        for (const comp of comps) {
            this.addCom(comp);
        }
    }
    public removeComp(comp: Component) {
        const { components } = this;
        for (let i = 0; i < components.length; i++) {
            const com = components[i];
            if (com === comp) {
                if (isFunc(com.destroy)) {
                    com.destroy();
                }
                components.splice(i, 1);
            }
        }
    }
    public removeComps() {
        const { components } = this;
        for (const com of components.reverse()) {
            this.removeComp(com);
        }
        this.components = [];
    }
    public destroy() {
        const { components } = this;
        for (const com of components.reverse()) {
            this.removeComp(com);
        }
        this.components = [];
    }
}
