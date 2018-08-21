export function clearPath(path) {
    return path.toString().replace(/\/{2,}/g, '/');
}
export function splitPath(path) {
    if (!path) {
        path = '';
    }
    path = clearPath(path);
    let arr = path.split('/');
    arr = arr.filter(item => {
        return item;
    });
    arr.unshift('/');
    return arr;
}

export function urlToObj(test_str) {
    test_str = test_str.replace('#', '');
    const param = analysisParam(test_str);
    const outset = getOutset(test_str);
    const path = getPath(test_str);

    const router = {
        outset,
        param,
        path,
    };

    return router;
}
function getOutset(path) {
    const match_rex = /\(([^\)].+)\)/g;
    const match = match_rex.exec(path);
    if (match) {
        return queryStr(match[1]);
    }
    return;
}
function getPath(path) {
    const match_rex = /^([^;\(\)])+/g;
    let match = path.match(match_rex);
    match = match ? match[0] : undefined;
    return match;
}
function analysisParam(test_str) {
    const match_rex = /;([^\(\)]+)/g;
    const match = match_rex.exec(test_str);
    if (match) {
        const match_str = match[1];
        return queryStr(match_str);
    }
    return;
}
function queryStr(test_str) {
    const param_arr = test_str.split(';');
    const param = {};
    for (const item of param_arr) {
        if (!item) {
            continue;
        }
        const pair = item.split('=');
        if (typeof param[pair[0]] === 'undefined') {
            param[pair[0]] = decodeURIComponent(pair[1]);
        } else if (typeof param[pair[0]] === 'string') {
            const arr = [param[pair[0]], decodeURIComponent(pair[1])];
            param[pair[0]] = arr;
        } else {
            param[pair[0]].push(decodeURIComponent(pair[1]));
        }
    }
    return param;
}
export function routerObjToUrl(router_info) {
    const path_str = router_info.path;
    let outset_str = '';
    const outset = router_info.outset;
    for (const key in outset) {
        if (!outset.hasOwnProperty(key)) {
            continue;
        }
        outset_str += key + '=' + outset[key] + ';';
    }
    if (outset_str) {
        outset_str = `(${outset_str})`;
    }

    let param_str = '';
    const param = router_info.param;
    for (const key in param) {
        if (!param.hasOwnProperty(key)) {
            continue;
        }
        param_str += ';' + key + '=' + param[key];
    }

    return path_str + outset_str + param_str;
}
export type ChangeItem = {
    key: string;
    type: 'delete' | 'add' | 'modified';
    ori_val?: any;
    end_val?: any;
};
type Change_Arr = ChangeItem[];
/**
 * 对比两个对象, 最后变成这个形式
 * {key: "outset:popup", type: "modified", ori_val: "alert/tip", end_val: "alertq/tip"}
 * {key: "param:foo", type: "delete", ori_val: "1"}
 * {key: "param:boo", type: "delete", ori_val: "2"}
 * {key: "param:fod", type: "add", end_value: "2"}
 * @param ori_obj 原始对象
 * @param com_obj 对比对象
 * @param parent_key 递归比较时两个的递归的key p1_key:p2_key:..
 */
export function compareObj(ori_obj, com_obj, parent_key?): Change_Arr {
    let change_arr = [] as Change_Arr;
    ori_obj = ori_obj || {};
    com_obj = com_obj || {};
    for (const o_key in ori_obj) {
        if (!ori_obj.hasOwnProperty(o_key)) {
            continue;
        }
        const ori_item = ori_obj[o_key];
        const com_item = com_obj[o_key];

        const o_p_key = parent_key ? parent_key + ':' + o_key : o_key;
        if (!com_obj.hasOwnProperty(o_key)) {
            change_arr.push({
                key: o_p_key,
                ori_val: ori_item,
                type: 'delete',
            });
            continue;
        }

        /** 基本类型直接对比 */
        if (isPrim(ori_obj[o_key]) && isPrim(com_obj[o_key])) {
            if (!ori_obj.hasOwnProperty(o_key)) {
                continue;
            }
            if (ori_item !== com_item) {
                change_arr.push({
                    end_val: com_item,
                    key: o_p_key,
                    ori_val: ori_item,
                    type: 'modified',
                });
                continue;
            }
            if (ori_item === com_item) {
                continue;
            }
        }

        /** 复杂类型 递归对比 */
        const change_item_arr = compareObj(ori_item, com_item, o_p_key);
        change_arr = change_arr.concat(change_item_arr);
    }

    /** 查找增加的  */
    for (const c_key in com_obj) {
        if (!com_obj.hasOwnProperty(c_key)) {
            continue;
        }
        const o_p_key = parent_key ? parent_key + ':' + c_key : c_key;
        if (!ori_obj.hasOwnProperty(c_key) && com_obj[c_key] !== undefined) {
            change_arr.push({
                end_val: com_obj[c_key],
                key: o_p_key,
                type: 'add',
            });
            continue;
        }
    }
    return change_arr;
}
/** 比较两个对象是否相等 */
export function isEqualObj(ori_obj, com_obj) {
    ori_obj = ori_obj || {};
    com_obj = com_obj || {};
    for (const o_key in ori_obj) {
        if (!ori_obj.hasOwnProperty(o_key)) {
            continue;
        }
        const ori_item = ori_obj[o_key];
        const com_item = com_obj[o_key];

        if (!com_obj.hasOwnProperty(o_key)) {
            return false;
        }

        /** 基本类型直接对比 */
        if (isPrim(ori_obj[o_key])) {
            if (ori_item !== com_item) {
                return false;
            }
            if (ori_item === com_item) {
                continue;
            }
        }

        /** 复杂类型 递归对比 */
        const item_equal = isEqualObj(ori_item, com_item);
        if (!item_equal) {
            return false;
        }
    }

    /** 查找增加的 */
    for (const c_key in com_obj) {
        if (!ori_obj.hasOwnProperty(c_key)) {
            return false;
        }
    }
    return true;
}
/** 原始类型, null 没有做处理 */
function isPrim(value) {
    const value_type = typeof value;
    return value_type !== 'function' && value_type !== 'object';
}
