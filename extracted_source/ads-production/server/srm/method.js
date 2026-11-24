import StockCountRepair from '../../imports/deamon/stockCountRepair';
import RestoreStock from '../../imports/deamon/restoreStock';
let stockModels = {};
function GetModelHash() {
    let modelHash = {};
    StockModels.find({}, {fields: {stockType: 0, history: 0}}).forEach(function(model) {
        modelHash[model._id] = model;
    });
    return modelHash;
}
function GetStockModelHash(stockModelIds) {
    let modelHash = {};
    StockModels.find({_id: {$in: stockModelIds}}).forEach(function(model) {
        modelHash[model._id] = model;
    });
    return modelHash;
}
Meteor.methods({
    SRM_returnProvider_verify(documentId, note) {
        let document = Documents.findOne({_id: documentId});
        let transactions = STransactions.find({'document._id': documentId, state: 0});
        let permission = StorePermissions.findOne({userId: Meteor.userId(), objectId: document.srcObject._id});
        let stockModel;

        if (permission && permission.canManage) {
            transactions.forEach((transaction) => {
                stockModel = StockModels.findOne(transaction.stockModel._id);
                STransactions.update({_id: transaction._id}, {$set: {state: 1}}, function (err, success) {
                    if (err) {
                        throw new Meteor.Error(500, "Don't update transaction");
                    } else {
                        if (document.detail.stocks[transaction.stockId]) {
                            let f = 1, quantityString = '', count = 0;
                            document.detail.stocks[transaction.stockId].detail.quantity.forEach(function (quantity, idx) {
                                document.detail.stocks[transaction.stockId].detail.quantity[idx] = quantity + transaction.detail.quantity[idx];
                            });
                            __.forEach(document.detail.stocks[transaction.stockId].detail.quantity, function(quantity, idx) {
                                f *= stockModel.detail.factor[idx];
                                if (quantity) {
                                    quantityString += quantity + ' ' + stockModel.detail.unit[idx] + ' ';
                                    if(stockModel.detail.factor[idx]) {
                                        count += (stockModel.detail.sumFactor / f);
                                    }
                                }
                            });
                            document.detail.stocks[transaction.stockId].count = count;
                            document.detail.stocks[transaction.stockId].quantityString = quantityString;
                            Documents.update({_id: document._id}, {$set: {detail: document.detail}}, function (err, success) {
                                if (err) {
                                    throw new Meteor.Error(500, "Don't update document");
                                }
                            });
                        } else {
                            document.detail.stocks[transaction.stockId] = {
                                code: transaction.code,
                                tags: transaction.tags,
                                providers: transaction.providers,
                                description: transaction.description,
                                stockModel: transaction.stockModel,
                                stockType: transaction.stockType,
                                quantityString: transaction.quantityString,
                                count: transaction.count,
                                detail: transaction.detail,
                                expiration: transaction.expiration,
                                dateOfManufacture: transaction.dateOfManufacture,
                                accountingObject: document.srcObject
                            };
                            Documents.update({_id: document._id}, {$set: {detail: document.detail}}, function (err, success) {
                                if (err) {
                                    throw new Meteor.Error(500, "Don't update document");
                                }
                            });
                        }
                    }
                });
            });
            // Update status document
            document.note = note;
            document.status = 99;
            document.verifiedBy = {
                id: Meteor.user()._id,
                username: Meteor.user().username
            };
            document.verifiedAt = moment().valueOf();
            document.detail.update.push({
                time: moment().valueOf(),
                userId: Meteor.user()._id,
                user: Meteor.user().username,
                reason: 'Duyệt biên bản'
            });
            delete document._id;
            Documents.update({_id: documentId}, {$set: document}, function (err, success) {
                if (err) {
                    throw new Meteor.Error(500, "Don't update document");
                } else {
                    return;
                }
            });
        } else {
            throw new Meteor.Error(500, "Don't have permission");
        }
    },
    // ChangeSaleQuantity SimPOS
    ChangeSaleQuantity(stockB, countBuy, saleDoc) {
      // doi saleQuantity
      let future = new Future();
      let k, id = moment().valueOf().toString() + Math.floor(Math.random()*1000).toString(), saleQuantity = [0,0,0,0,0,0,0],
          saleQuantityString = '', oldTran = STransactions.findOne(stockB.transactionId), object,
          stock = Stocks.findOne(stockB._id), stockModel = StockModels.findOne(stockB.stockModel._id);
      // remove stock
      if (oldTran.state) {
          STransactions.update({_id: stockB.transactionId},{$set:{show:0}}, function(err,success) {
              if (success) {
                  oldTran._id = id;
                  oldTran.state = 1;
                  oldTran.show = 0;
                  oldTran.srcObject = saleDoc.desObject;
                  oldTran.desObject = saleDoc.srcObject;
                  STransactions.insert(oldTran, function(err,success){
                      if(success){
                          Stocks.update({_id: stockB._id},{$inc:{count: stockB.count}}, function(err,success){
                              if(success){
                                var stockId = stockB._id.toString();
                                delete saleDoc.detail.stocks[stockId];
                                Documents.update({_id:saleDoc._id},{
                                    $set:{'detail.stocks':saleDoc.detail.stocks},
                                    $push:{"detail.update":{
                                        time: moment().valueOf(),
                                        userId: Meteor.userId(),
                                        user: Meteor.user().username,
                                        reason: "Xoá "+ stockB.saleQuantityString + ' ' + stockB.code
                                }}}, function(err,res){
                                    if(!err){
                                      saleDoc.detail.sum = saleDoc.detail.order;
                                      saleDoc.cart.total = 0;
                                      saleDoc.cart.totalDiscount = 0;
                                      __.forEach(saleDoc.detail.stocks, function(stock){
                                          if(stock._id){
                                              if(stock.percentFix==="1"){//tinh phan tram
                                                  saleDoc.detail.sum += Math.floor(stock.sumPrices - stock.sumPrices * stock.valueFix / 100);
                                                  saleDoc.cart.totalDiscount += Math.floor(stock.sumPrices * stock.valueFix / 100);
                                              } else {//tinh so tien
                                                  that.saleDoc.detail.sum += stock.sumPrices - stock.valueFix;
                                                  that.saleDoc.cart.totalDiscount += stock.valueFix;
                                              }
                                          }
                                      });
                                      if(saleDoc.detail.discountPercentType){//tinh %
                                          saleDoc.cart.total = saleDoc.detail.sum - saleDoc.detail.discountValue * saleDoc.detail.sum/100;
                                      } else {//tinh so tien
                                          saleDoc.cart.total = saleDoc.detail.sum - saleDoc.detail.discountValue;
                                      }

                                      __.forEach(saleDoc.detail.services, function(fee){
                                          if(fee.valueType){//so tien
                                              saleDoc.cart.total += fee.value;
                                          } else {//phan tram
                                              saleDoc.cart.total += Math.floor(saleDoc.detail.sum * fee.value/100);
                                          }
                                      });
                                      saleDoc.cart.credit = saleDoc.cart.total - saleDoc.detail.deposit;
                                      Documents.update({_id: saleDoc._id},{$set:{
                                          cart: saleDoc.cart,
                                          "detail.sum":  saleDoc.detail.sum,
                                          "detail.discountPercentType": saleDoc.detail.discountPercentType,
                                          "detail.discountValue": saleDoc.detail.discountValue,
                                          "detail.services": saleDoc.detail.services
                                      }}, function(err){
                                        if(!err){
                                          object = {'stock': stock, 'stockModel': stockModel};
                                          future.return( object );
                                        }
                                      });
                                    }
                                });
                              }else{
                                console.log(err);
                                future.return( err );
                              }
                          });
                      } else{
                        console.log(err);
                        future.return( err );
                      }
                  });
              } else {
                console.log(err);
                future.return( err );
              }
          });
          //console.log('stock');
      }
      //return stock;
      return future.wait();
    },
    // store management
    LoadStockTransportByStore(storeId, isDeliveried) {
        return Stocks.find({'accountingObject._id': storeId, isDeliveried: isDeliveried}).fetch();
    },
    // rebuild srmReport
    Setting_removeReportFromDate(shopId, start) {
        if (!start) {
            start = moment().valueOf();
        }
        let id = [];
        // bao cao ton dau ki dau tien.
        // var first = srmReports.findOne({"accountingObject._id": shopId}, {sort: {createdAt: 1}});
        // khong duoc xoa bao cao ton dau ki dau tien
        srmReports.find({$and:[
            {"accountingObject._id": shopId},
            {createdAt: {$gte: moment(start).startOf('day').valueOf()}},
            {createdAt: {$lte: moment().valueOf()}}
        ]}).forEach((report) => {
            //if(first._id !== report._id){
                id.push(report._id);
            //}
        });
        srmReports.remove({_id: {$in: id}});
        return;
    },
    Setting_rebuildStockReport(shopId, dateStart) {
        //tìm báo cáo gần nhất.
        let that = this;
        let report = srmReports.findOne({"accountingObject._id": shopId},{sort: {createdAt: -1}}),
            store = AccountingObjects.findOne({_id: shopId}),
            setting = Settings.findOne({_id: Meteor.settings.env}),
            start, end, index;
        if (report && report._id) {
            Meteor.call('setting_rebuildstockReportWhile', report, function(err){
                if(err){
                    console.log(err);
                }
            });
        }else{
            console.log('không có báo cáo nào gần nhất.');
            srmReports.insert({
                stock: [],
                ei: {},
                accountingObject: store,
                createdAt: moment(dateStart).set({'hour': 0,'minute': 20, 'second': 0,'millisecond': 0 }).valueOf(),
                createdDate: moment(dateStart).set({'hour': 0,'minute': 20, 'second': 0,'millisecond': 0 }).format('DD/MM/YYYY HH:mm')
            }, (err, id)=> {
              report = {
                  _id: id,
                  stock: [],
                  ei: {},
                  accountingObject: store,
                  createdAt: moment(dateStart).set({'hour': 0,'minute': 20, 'second': 0,'millisecond': 0 }).valueOf(),
                  createdDate: moment(dateStart).set({'hour': 0,'minute': 20, 'second': 0,'millisecond': 0 }).format('DD/MM/YYYY HH:mm')
              };

              Meteor.call('setting_rebuildstockReportWhile', report, function(err){
                  if(err){
                      console.log(err);
                  }
              });
            });
        }
    },
    setting_rebuildstockReportWhile(report){
        var start = moment(report.createdAt).set({'hour': 0,'minute': 20, 'second': 0,'millisecond': 0 }).valueOf(),
            end, index, srmReportLastId;
        const modelHash = GetModelHash();
        while (start < moment().startOf('day').valueOf()) {
            console.log(moment(start).format());
            end = moment(start).add(1, 'day').valueOf();
            report.ei = {};
            STransactions.find({
                $and:[
                    {createdAt: {$gte: start}},
                    {createdAt: {$lte: end}}
                ],
                $or: [
                    {'srcObject._id': report.accountingObject._id},
                    {'desObject._id': report.accountingObject._id}
                ],
                haveReport: true
            }).forEach((tran) => {
                if (tran.srcObject && tran.srcObject._id == report.accountingObject._id) {
                    if (__.findIndex(report.stock, {code: tran.code}) >= 0) {
                        index = __.findIndex(report.stock, {code: tran.code});
                        report.stock[index].count = report.stock[index].count - tran.count;
                    } else {
                        report.stock.push({
                            code: tran.code,
                            stockModel: tran.stockModel,
                            count: -tran.count
                        });
                    }
                    //xuất
                    if(!report.ei[tran.stockModel._id]){
                        report.ei[tran.stockModel._id] = {
                            _id: tran.stockModel._id,
                            code: tran.stockModel.code,
                            name: tran.stockModel.name,
                            export: 0,
                            import: 0,
                            exportCost: 0,
                            importCost: 0,
                            stocks:{}
                        };
                    }
                    report.ei[tran.stockModel._id].export += tran.count;
                    if(tran.detail.saleQuantity){
                        report.ei[tran.stockModel._id].exportCost += tran.detail.sumPrices?tran.detail.sumPrices:0;
                    }else{
                        report.ei[tran.stockModel._id].exportCost += tran.cost?tran.cost:0;
                    }
                    if(report.ei[tran.stockModel._id].exportQuantity){
                      if(tran.detail.saleQuantity){
                          __.forEach(tran.detail.saleQuantity, function(quantity, id){
                            if(quantity){
                              report.ei[tran.stockModel._id].exportQuantity[id] += quantity;
                            }
                          });
                      }else{
                          __.forEach(tran.detail.quantity, function(quantity, id){
                            if(quantity){
                              report.ei[tran.stockModel._id].exportQuantity[id] += quantity;
                            }
                          });
                      }
                    }else{
                          if(tran.detail.saleQuantity){
                              report.ei[tran.stockModel._id].exportQuantity = tran.detail.saleQuantity;
                          }else{
                              report.ei[tran.stockModel._id].exportQuantity = tran.detail.quantity;
                          }
                    }
                }else if(tran.desObject && tran.desObject._id == report.accountingObject._id){
                    if (__.findIndex(report.stock, {code: tran.code}) >= 0) {
                        index = __.findIndex(report.stock, {code: tran.code});
                        report.stock[index].count = report.stock[index].count + tran.count;
                    } else {
                        report.stock.push({
                            code: tran.code,
                            stockModel: tran.stockModel,
                            count: tran.count
                        });
                    }
                    //nhập
                    if(!report.ei[tran.stockModel._id]){
                        report.ei[tran.stockModel._id] = {
                            _id: tran.stockModel._id,
                            code: tran.stockModel.code,
                            name: tran.stockModel.name,
                            export: 0,
                            import: 0,
                            exportCost: 0,
                            importCost: 0,
                            stocks:{}
                        };
                    }
                    report.ei[tran.stockModel._id].import += tran.count;
                    if(tran.detail.saleQuantity){
                        report.ei[tran.stockModel._id].importCost += tran.detail.sumPrices?tran.detail.sumPrices:0;
                    }else{
                        report.ei[tran.stockModel._id].importCost += tran.cost?tran.cost:0;
                    }
                    if(report.ei[tran.stockModel._id].importQuantity){
                      if(tran.detail.saleQuantity){
                          __.forEach(tran.detail.saleQuantity, function(quantity, id){
                            if(quantity){
                              report.ei[tran.stockModel._id].importQuantity[id] += quantity;
                            }
                          });
                      }else{
                          __.forEach(tran.detail.quantity, function(quantity, id){
                            if(quantity){
                              report.ei[tran.stockModel._id].importQuantity[id] += quantity;
                            }
                          });
                      }
                    }else{
                          if(tran.detail.saleQuantity){
                              report.ei[tran.stockModel._id].importQuantity = tran.detail.saleQuantity;
                          }else{
                              report.ei[tran.stockModel._id].importQuantity = tran.detail.quantity;
                          }
                    }
                }
            });
            let k = 0, stockModel, count;
            __.forEach(report.stock, function(stock, id) {
                if (stock) {
                    if (stock.count === 0) {
                        //lặp lại report.stock kiểm count = 0 để xóa,
                        report.stock.splice(id, 1);
                    } else {
                        stock.cost = 0;
                        stockModel = modelHash[stock.stockModel._id];
                        if(stockModel.detail.averagePrice){
                            stock.cost = stockModel.detail.averagePrice.price * stock.count;
                        }
                        if (!stock.quantity) {
                            stock.quantity = [0,0,0,0,0,0,0];
                        }
                        count = stock.count;
                        for (k = 0; k < 7; k++) {
                            if (stockModel.detail.realFactor[k]){
                                if (k > 0) {
                                    count = count % stockModel.detail.realFactor[k-1];
                                }
                                stock.quantity[k] = Math.floor(count / stockModel.detail.realFactor[k]);
                            }
                        }
                    }
                }
            });
            eiReport = __.cloneDeep(report.ei);
            srmReportLastId = srmReports.findOne({
              $and:[
                  {createdAt: {$gte: moment(start).startOf('day').valueOf()}},
                  {createdAt: {$lte: moment(start).endOf('day').valueOf()}}
              ],
              'accountingObject._id': report.accountingObject._id
            });
            if(srmReportLastId && srmReportLastId._id){
                srmReports.update({_id: srmReportLastId._id}, {$set: {ei: eiReport}});
            }
            //tạo srmReport
            console.log('tạo srmReport', moment(end).format('DD/MM/YYYY HH:mm'));
            srmReports.insert({
                stock: report.stock,
                ei: {},
                accountingObject: report.accountingObject,
                createdAt: moment(end).valueOf(),
                createdDate: moment(end).format('DD/MM/YYYY HH:mm')
            });
            start = moment(start).add(1, 'day').valueOf();
        }
    },
    Setting_stockCountRepair(){
        StockCountRepair();
    },
    Setting_restoreStock(){
        RestoreStock();
    },
    // VS Diamond
    VSDiamond_storeImport_addStock(process) {
        var id = moment().valueOf().toString() + Math.floor(Math.random()*1000).toString(),
            data = STransactions.findOne({
                "document._id": process.document._id,
                code: process.code,
                state: 0
            }),
            setting = Settings.findOne(Meteor.settings.public),
            document = Documents.findOne({
                _id: process.document._id
            });
        if(!data){
            STransactions.insert({
                _id: id.toString(),
                code: process.code,
                type: process.type,
                detail: process.detail,
                count: process.count,
                shape: process.shape,
                lab: process.lab,
                carat: process.carat,
                price: process.price,
                color: process.color,
                clarity: process.clarity,
                cut: process.cut,
                polish: process.polish,
                symmetry: process.symmetry,
                stockModel: {
                    _id: process.stockModel._id,
                    code: process.stockModel.code,
                    name: process.stockModel.name
                },
                stockType: {
                    _id: process.stockType._id,
                    name: process.stockType.name,
                    code: process.stockType.code
                },
                provider: process.provider,
                providers: process.providers,
                document: {
                    _id: document._id,
                    code: document.code
                },
                process: {
                    _id: process.document.type,
                    name: 'storeImport'
                },
                createdBy: {
                    _id: Meteor.user()._id,
                    username: Meteor.user().username
                },
                createdAt: moment().valueOf(),
                srcObject: process.srcObject,
                desObject: process.desObject,
                state: 0,
                haveReport: false
            }, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }else{
            if(setting.storeManagement.increment){
                data.count += process.count;
                STransactions.update({_id: data._id}, {$set: {count: data.count}});
            }else{
                throw new Meteor.Error(500, "Hàng " + process.code + " đã nhập trong biên bản này");
            }
        }

        document.detail.update.push({
            time: moment().valueOf(),
            userId: Meteor.user()._id,
            user: Meteor.user().username,
            reason: 'Thêm 1 ' + process.code
        });
        Documents.update({_id: document._id}, {$set: {detail: document.detail }});
        return document._id;
    },
    VSDiamond_storeImport_verify(documentId, note) {
        let document = Documents.findOne({_id: documentId}), provider = [],
            transactions = STransactions.find({"document._id": documentId, state: 0}),
            permission = StorePermissions.findOne({userId: Meteor.userId(), objectId: document.desObject._id});
        if (permission && permission.canManage) {
            if (transactions.count()) {
                transactions.forEach((transaction) => {
                    let stock = Stocks.findOne({'accountingObject._id': document.desObject._id, code: transaction.code});
                    if (stock) {
                        // tồn tại stock , cộng dồn
                        let id = stock._id;
                        stock.accountingObject = document.desObject;
                        stock.count += transaction.count;
                        delete stock._id;
                        Stocks.update({_id: id}, {$set: stock}, function (err, success) {
                            if (err) {
                                throw new Meteor.Error(500, "Don't update stock");
                            } else {
                                STransactions.update({_id: transaction._id}, {$set: {state: 1, haveReport: true, stockId: id}}, function (err, success) {
                                    if (err) {
                                        throw new Meteor.Error(500, "Don't update transaction");
                                    }
                                });
                            }
                        });
                    } else {
                        // tạo mới stock
                        Stocks.insert({
                            code: transaction.code,
                            stockModel: transaction.stockModel,
                            stockType: transaction.stockType,
                            count: transaction.count,
                            providers: transaction.providers,
                            detail: transaction.detail,
                            accountingObject: transaction.desObject,
                            shape: transaction.shape,
                            lab: transaction.lab,
                            carat: transaction.carat,
                            price: transaction.price,
                            color: transaction.color,
                            clarity: transaction.clarity,
                            cut: transaction.cut,
                            polish: transaction.polish,
                            symmetry: transaction.symmetry
                        }, function (err, stockId) {
                            if (err) {
                                throw new Meteor.Error(500, "Don't create stock");
                            } else {
                                STransactions.update({_id: transaction._id}, {$set: {state: 1, haveReport: true, stockId: stockId}}, function (err, success) {
                                    if (err) {
                                        throw new Meteor.Error(500, "Don't update transaction");
                                    }
                                });
                            }
                        });
                    }
                });

                // Update status document
                STransactions.find({
                    'document._id': documentId,
                    haveReport: true
                }).forEach((trans) => {
                    // if (trans.srcObject._id !== document.srcObject._id) {
                    //     trans.count = -trans.count;
                    //     trans.quantityString = '- ' + trans.quantityString;
                    // }
                    document.detail.stocks[trans.stockId] = {
                        code: trans.code,
                        providers: trans.providers,
                        stockModel: trans.stockModel,
                        stockType: trans.stockType,
                        count: trans.count,
                        detail: trans.detail,
                        accountingObject: trans.desObject,
                        shape: trans.shape,
                        lab: trans.lab,
                        carat: trans.carat,
                        price: trans.price,
                        color: trans.color,
                        clarity: trans.clarity,
                        cut: trans.cut,
                        polish: trans.polish,
                        symmetry: trans.symmetry
                    };
                });
                document.note = note;
                document.status = 99;
                document.verifiedBy = {
                    id: Meteor.user()._id,
                    username: Meteor.user().username
                };
                document.verifiedAt = moment().valueOf();
                document.detail.update.push({
                    time: moment().valueOf(),
                    userId: Meteor.user()._id,
                    user: Meteor.user().username,
                    reason: 'Duyệt biên bản'
                });
                delete document._id;
                Documents.update({_id: documentId}, {$set: document}, function (err, success) {
                    if (err) {
                        throw new Meteor.Error(500, "Don't update document");
                    }
                });
            }
        } else {
            throw new Meteor.Error(500, "Don't have permission");
        }
    },
    VSDiamond_LoadStockByStore(storeId) {
        var stocks = Stocks.find({'accountingObject._id': storeId}).fetch();
        stocks.forEach(function(item) {
            item.tagName = item.tags ? item.tags.toString() : '';
            item.cost = item.count * item.price;
        });
        return stocks;
    },
    SRM_document_transaction_verify(documentId){
        let setting = Settings.findOne({_id: Meteor.settings.env});
        let documentForm = Documents.findOne(documentId),
            transactions = STransactions.find({
              'process._id': setting.config.documentType.import,
              'document._id': documentId
            }).fetch();

        return {documentForm: documentForm, transactions: transactions};
    },
    getDataToPrintExport(docId) {
      let result = {doc: {}, sTrans: []};
      let doc = Documents.findOne({_id: docId});
      result.doc = Documents.findOne({_id: {$in: doc.documentExports}});
      let query = {
        'document._id': result.doc._id,
        'srcObject._id': result.doc.srcObject._id
      };
      if (result.doc.status == 99) {
        query.state = 1;
        query.haveReport = true;
      } else {
        query.state = 0;
      }
      result.sTrans = STransactions.find(query).fetch();
      stockModels = GetStockModelHash(__.map(result.sTrans, (sTran) => {return sTran.stockModel._id;}));
      __.forEach(result.sTrans, (sTran) => {
        sTran.stockModel = stockModels[sTran.stockModel._id];
      });
      return result;
    },
    shopHistory_unverifiedDocument(docId){
        let doc = Documents.findOne({_id: docId});
        Documents.update({
          _id: docId
        },{
          $set: {
              status: 0,
              'cart.credit': doc.cart.total,
              'detail.deposit': 0
          }
        });
        let tran = Transactions.findOne({
          'document._id': docId,
          'srcObject._id': doc.desObject._id,
          type: '101'
        });

        if(tran && tran._id){
            Transactions.update({
              _id: tran._id
            },{
              $set: {
                  credit: tran.vnd
              }
            });
            MTransactions.remove({'document._id': docId});
            TranMTrans.remove({'tranId': tran._id});
        }
    },
    Pharmacy_queryDataStockModel(specificName, registerNumber, caseProto){
      let future = new Future();
      //local
      // HTTP.call('GET', "https://drug.s2corp.vn/api/stockModels/_search?registerNumber="+registerNumber+"&specificName="+specificName+"&caseProto="+caseProto,
      // server
      HTTP.call('GET', "http://192.168.13.20:7999/api/stockModels/_search?registerNumber="+registerNumber+"&specificName="+specificName+"&caseProto="+caseProto,
      {headers: {'Token_Verify': 'StockModel_API'}}, (err, res)=>{
        if(err){
          future.throw(err);
        }
        else {
          future.return(res);
        }
      });
      return future.wait();
    }
});
