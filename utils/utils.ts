export function callFunc(func: FuncVoid) {
    if (!isFunc(func)) {
        return;
    }
    func();
}

export function isFunc(func: FuncVoid): boolean {
    return func && typeof func === 'function';
}
