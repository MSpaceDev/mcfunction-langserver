import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as cache from "../../data/cache_management";
import { GlobalData } from "../../data/types";
import { } from "../logging_setup";
const cacheFolder = path.join(__dirname, "..", "..", "data", "cache");
const testData: GlobalData = {
    commands: {
        children: {
            hello: {
                type: "literal",
            },
        },
        type: "root",
    },
};
describe("Cache Management", () => {
    describe("cacheData", () => {
        it("should cache the data in the folder", async () => {
            await cache.cacheData(testData);
            const files = await promisify(fs.readdir)
                (cacheFolder);
            assert.deepEqual(files, ["commands.json"]);
        });
    });
    describe("readCache", () => {
        it("should be consistent with cacheData", async () => {
            await cache.cacheData(testData);
            const data = await cache.readCache();
            assert.deepEqual(data, testData);
        });
    });
});