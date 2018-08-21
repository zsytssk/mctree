import { Observable } from 'rxjs';
import axios from 'axios';
import qs from 'qs';

import { log } from '../utils/zutil';

const request_arr = [];
/**
 * 包裹Networkhttp请求
 */
export function sendRequest({ path = '', method = 'GET', data }) {
    log('http:> send:> ', data.st, {
        data,
        method,
        path,
    });

    return new Promise((resolve, reject) => {
        const request = rxAxios({
            data,
            method,
            path,
        })
            .retry(3) // 重试3次
            .subscribe({
                complete: () => {
                    clearRequest(request);
                },
                error: error => {
                    reject(`error:>${error}`);
                },
                next: response_data => {
                    resolve(response_data);
                },
            });
        request_arr.push(request);
    });
}

/** 用rxjs包裹axios请求数据 */
function rxAxios({ path = '', method = 'GET', data }) {
    return new Observable(observer => {
        axios({
            data: qs.stringify(data),
            method,
            timeout: 5000,
            url: path,
        })
            .then(response => {
                observer.next(response.data);
                observer.complete();
            })
            .catch(error => {
                observer.error(error);
            });
    });
}

function clearRequest(request) {
    for (let len = request_arr.length, i = len - 1; i >= 0; i--) {
        const item = request_arr[i];
        if (item === request) {
            request_arr.splice(i, 1);
        }
    }
}
export function abortAllRequest() {
    for (let len = request_arr.length, i = len - 1; i >= 0; i--) {
        const item = request_arr[i];
        item.complete();
        request_arr.splice(i, 1);
    }
}
