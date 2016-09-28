/**
 * Created by rtholmes on 2016-09-03.
 */

import Log from "../Util";
import JSZip = require('jszip');
import fs = require('fs')
/**
 * In memory representation of all datasets.
 */
export interface Datasets {
    [id: string]: {};

}

export default class DatasetController {

    private datasets: Datasets = {};

    constructor() {
        Log.trace('DatasetController::init()');
    }

    /**
     * Returns the referenced dataset. If the dataset is not in memory, it should be
     * loaded from disk and put in memory. If it is not in disk, then it should return
     * null.
     *
     * @param id
     * @returns {{}}
     */
    public getDataset(id: string): any {
        // TODO: this should check if the dataset is on disk in ./data if it is not already in memory.

        if (this.datasets.hasOwnProperty(id)) {
            return this.datasets[id];
        }
        else (fs.readdir("./data", function (err: any, files: any) {
            if (err) {
                console.error("Could not Find Directory", err);
            }
           if (files.getLength() != 0) {
               files.forEach(function (file: any) {
                   if (file.name == id + ".json"){
                       this.dataset[id]= file;
                   }
               })
           }
           else{
               return null;
           }
            }));
        // because it does not exist in ./data or memory
        console.log("Does not exist in disk or memory");
        return null;
    }


public getDatasets(): Datasets {
        // TODO: if datasets is empty, load all dataset files in ./data from disk
        if (Object.keys(this.datasets).length == 0){
            fs.readdir("./data", function (err: any, files: any) {
                if (err) {
                    console.error("Unable to load from disk; could not find directory", err);
                }
                for(var file in files){
                var content = fs.readFile(file);
                this.dataset[file] = content.toString();
                }
            })
        }
        return this.datasets;
    }


    /**
     * Process the dataset; save it to disk when complete.
     *
     * @param id
     * @param data base64 representation of a zip file
     * @returns {Promise<boolean>} returns true if successful; false if the dataset was invalid (for whatever reason)
     */
    public process(id: string, data: any): Promise<boolean> {

        Log.trace('DatasetController::process( ' + id + '... )');

        let that = this;
       // var dataDir = fs.root.getDirectory("./data", {create: true});
        return new Promise(function (fulfill, reject) {
            try {
                let myZip = new JSZip();
                myZip.loadAsync(data, {base64: true}).then(function (zip: JSZip) {
                    Log.trace('DatasetController::process(..) - unzipped');

                    var processedDataset: any = [];
                    var courses: any = [];
                    // TODO: iterate through files in zip (zip.files)
                    // The contents of the file will depend on the id provided. e.g.,
                    // some zips will contain .html files, some will contain .json files.
                    // You can depend on 'id' to differentiate how the zip should be handled,
                    // although you should still be tolerant to errors.
                    if (id == "setA") {
                         zip.forEach(function (relativePath: string, file: JSZipObject) {
                             if (!file.dir) {
                                 zip.file(relativePath).async("string").then(function (data) {
                                     var obj_set = JSON.parse(data);
                                     for (var i = 0; i < obj_set.result.length; i++) {
                                         // create a new data structure
                                         var obj = obj_set.result[i];
                                         var course = {
                                             "courses_dept" : obj.Subject,
                                             "courses_id" : obj.id,
                                             "courses_avg" : obj.Avg,
                                             "courses_instructor": obj.Professor,
                                             "courses_title": obj.Title,
                                             "courses_pass" : obj.Pass,
                                             "courses_fail" : obj.Fail,
                                             "courses_audit" : obj.Audit
                                         }
                                         courses.push(course);
                                         //console.log(course);
                                     }
                                 })
                             }
                         })
                        processedDataset = courses;

                       // console.log("Processed Dataset: " + course);
                        Log.trace('204:DatasetController::process(..) - New Files Added');
                        that.save(id, processedDataset);
                   }
                   else {
                            Log.trace('201:DatasetController::process(..) - Files Already Exist')
                               }
                            fulfill(true);
                        //}
                    }).catch(function (err) {
                    Log.trace('DatasetController::process(..) - unzip ERROR: ' + err.message);
                    reject(err);
                });
            } catch (err) {
                Log.trace('DatasetController::process(..) - ERROR: ' + err);
                reject(err);
            }
        });
    }

    /**
     * Writes the processed dataset to disk as 'id.json'. The function should overwrite
     * any existing dataset with the same name.
     *
     * @param id
     * @param processedDataset
     */
    private save(id: string, processedDataset: any) {
        // TODO: actually write to disk in the ./data directory
        var dir = './data';

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        var path = "./data/"+ id +".json";
        fs.writeFile(path,processedDataset, function (err){
            if (err) return console.log(err);
            console.log("File saved.")
        });

    }
}
