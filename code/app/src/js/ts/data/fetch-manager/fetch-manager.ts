"use strict"

import CacheManager from '../cache-manager/cache-manager.js';
import Server from '../server-manager/server.js';

/* Fetch manager */

export default class FetchManager {
    private static _instance: FetchManager = null;

    private requestTimeout = 1000 * 15; // 15 secondes
    private retryDelay = 1000 * 2; // 2 secondes

    public static getInstance(): FetchManager {
        if(!FetchManager._instance) FetchManager._instance = new FetchManager();
        return FetchManager._instance;
    };

    constructor() {};

    public async fetch(url: string, server: string) {
        let result = await CacheManager.getInstance().checkCache(url, true);
        if(result) return result;

        return new Promise(async (resolve) => {
            let result = false;
            let i = 0;

            while(!result && i < 3) {
                if(i != 0) {
                    result = await new Promise((bottomResolve) => {
                        setTimeout(async () => {
                            bottomResolve(await this.get(url, server));
                        }, this.retryDelay);
                    })
                } else result = await this.get(url, server);
    
                i ++;
            }

            resolve(result);
        });
    };

    private async get(url: string, server: string): Promise<any> {
        return new Promise(async (resolve) => {
            await fetch(Server.getInstance()[server] + url).then((data) => {
                return data.json();
            }).then((data) => {
                CacheManager.getInstance().cacheData(url, data);
                resolve(data);
            }).catch(() => {
                resolve(false);
            });

            setTimeout(() => {
                resolve(false);
            }, this.requestTimeout);
        });
    };
}