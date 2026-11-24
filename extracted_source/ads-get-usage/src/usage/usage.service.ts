import { Logger, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, Like } from 'typeorm';
import * as Promise from 'bluebird';
import * as moment from 'moment';
import { lastValueFrom } from 'rxjs';

import {
  SelectOption,
  SelectOptionDocument,
} from './schemas/select-options.schema';
import { RadAcct } from './entities/radacct.entity';
import { ReportUsage, ReportUsageDocument } from './schemas/report.schema';
import { ConfigService } from '@nestjs/config';
import { QueryListDTO } from './usage.dto';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);
  constructor(
    @InjectModel(SelectOption.name)
    private optionsModel: Model<SelectOptionDocument>,
    @InjectModel(ReportUsage.name)
    private reportModel: Model<ReportUsageDocument>,
    @InjectRepository(RadAcct)
    private radsRepository: Repository<RadAcct>,
    private httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private session_unifi = {};
  private base_url_unifi = {};

  async onModuleInit() {
    this.calculateRadius();
    this.calculateUnifi();
    this.analyticReport({
      query: {
        createdAt: { $gte: 1647277200000, $lte: 1649869199999 },
        campaign: { $in: ['61e5a1b34723da43f72f3e10'] },
      },
      skip: 0,
      limit: 100,
    });
  }

  async calculateRadius() {
    this.logger.warn('calculate Radius');
    const onlineSession = await this.reportModel.find({
      unifiSiteId: { $exists: false },
      end: { $exists: false },
    });
    await Promise.each(onlineSession, async (item) => {
      try {
        if (!item.device) {
          // call ads get info
          const getInfo = await lastValueFrom(
            this.httpService.get(
              `${this.configService.get('ADS_HOST')}/api/Devices/${
                item.mac
              }/infoMac`,
            ),
          );
          if (getInfo.data) {
            await this.reportModel.findByIdAndUpdate(item._id, {
              $set: {
                device: getInfo.data.audience,
                name: getInfo.data.name || '',
                phone: getInfo.data.phone || '',
                email: getInfo.data.email || '',
              },
            });
          } else {
            if (item.duration === 2) {
              await this.reportModel.findByIdAndDelete(item._id);
            } else {
              await this.reportModel.findByIdAndUpdate(item._id, {
                $inc: {
                  duration: 1,
                },
              });
            }
            return;
          }
        }
        const updateObj: any = {};
        if (item.trackingId) {
          const getTrackRecord = await this.radsRepository.find({
            where: {
              radacctid: item.trackingId,
            },
          });
          if (getTrackRecord[0]) {
            console.log('getTrackRecord', getTrackRecord[0]);
            if (getTrackRecord[0].acctterminatecause) {
              updateObj.end = moment(getTrackRecord[0].acctstoptime).valueOf();
            }
            updateObj.trackingId = getTrackRecord[0].radacctid;
            updateObj.start = moment(getTrackRecord[0].acctstarttime).valueOf();
            updateObj.duration = getTrackRecord[0].acctsessiontime;
          }
        } else {
          const getLastRecord = await this.radsRepository.find({
            where: {
              callingstationid: Like(convertMacRadius(item.mac)),
            },
            order: {
              radacctid: 'DESC',
            },
            take: 1,
          });
          if (getLastRecord[0]) {
            console.log('getLastRecord', getLastRecord[0]);
            if (getLastRecord[0].acctterminatecause) {
              updateObj.end = moment(getLastRecord[0].acctstoptime).valueOf();
            }
            updateObj.trackingId = getLastRecord[0].radacctid;
            updateObj.start = moment(getLastRecord[0].acctstarttime).valueOf();
            updateObj.duration = getLastRecord[0].acctsessiontime;
          } else {
            const getLastRecordOrg = await this.radsRepository.find({
              where: {
                callingstationid: Like(item.mac),
              },
              order: {
                radacctid: 'DESC',
              },
              take: 1,
            });
            if (getLastRecordOrg[0]) {
              console.log('getLastRecordOrg', getLastRecordOrg[0]);
              if (getLastRecordOrg[0].acctterminatecause) {
                updateObj.end = moment(
                  getLastRecordOrg[0].acctstoptime,
                ).valueOf();
              }
              updateObj.trackingId = getLastRecordOrg[0].radacctid;
              updateObj.start = moment(
                getLastRecordOrg[0].acctstarttime,
              ).valueOf();
              updateObj.duration = getLastRecordOrg[0].acctsessiontime;
            } else {
              console.log('not found record', item.mac);
            }
          }
        }
        await this.reportModel.findByIdAndUpdate(item._id, { $set: updateObj });
      } catch (error) {}
    });
    await timeout(60000);
    this.calculateRadius();
  }

  async calculateUnifi() {
    this.logger.warn('calculate UNIFI');
    const options = await this.optionsModel.find({
      'options.isTrackUsage': true,
      'options.hotspotType': 'unifi',
    });
    await Promise.each(options, async (item) => {
      if (item.options.hotspotType === 'unifi') {
        this.base_url_unifi[item._id] = `${item.unifi.baseUrl}${
          item.unifi.isUnifiOs ? '/proxy/network' : ''
        }`;
        await this.checkLoginUnifi(item._id, item.unifi);
      }
    });
    await this.scanSessionUnifi();
    await timeout(60000);
    console.log('last Session', this.session_unifi);
    await this.calculateUnifi();
  }

  async checkLoginUnifi(_id: string, data: any) {
    try {
      if (!this.session_unifi[_id]) {
        const postLogin = await lastValueFrom(
          this.httpService.post(
            `${data.baseUrl}${
              data.isUnifiOs ? '/api/auth/login' : '/api/login'
            }`,
            { username: data.username, password: data.password },
          ),
        );
        const setcookie = postLogin.headers['set-cookie'];
        const headerData = {
          Cookie: setcookie.join('; '),
        };
        if (data.isUnifiOs) {
          headerData['x-csrf-token'] = postLogin.headers['x-csrf-token'];
        }
        this.session_unifi[_id] = headerData;
      }
    } catch (error) {
      this.session_unifi[_id] = null;
      console.log('reportUnifi login error', error?.response?.data);
    }
  }

  async scanSessionUnifi() {
    const onlineSession = await this.reportModel.find({
      unifiSiteId: { $exists: true },
      end: { $exists: false },
    });
    await Promise.each(onlineSession, async (item) => {
      if (!this.session_unifi[item.trackingId]) return;
      try {
        if (!item.device) {
          // call ads get info
          const getInfo = await lastValueFrom(
            this.httpService.get(
              `${this.configService.get('ADS_HOST')}/api/Devices/${
                item.mac
              }/infoMac`,
            ),
          );
          if (getInfo.data) {
            await this.reportModel.findByIdAndUpdate(item._id, {
              $set: {
                device: getInfo.data.audience,
                name: getInfo.data.name || '',
                phone: getInfo.data.phone || '',
                email: getInfo.data.email || '',
              },
            });
          } else {
            if (item.duration === 2) {
              await this.reportModel.findByIdAndDelete(item._id);
            } else {
              await this.reportModel.findByIdAndUpdate(item._id, {
                $inc: {
                  duration: 1,
                },
              });
            }
            return;
          }
        }
        const getReport = await lastValueFrom(
          this.httpService.get(
            `${this.base_url_unifi[item.trackingId]}/api/s/${
              item.unifiSiteId
            }/stat/user/${item.mac}`,
            { headers: this.session_unifi[item.trackingId] },
          ),
        );
        if (getReport.data) {
          if (getReport.data.data) {
            if (getReport.data.data[0]) {
              const session = getReport.data.data[0];
              if (session.assoc_time) {
                await this.reportModel.findByIdAndUpdate(item._id, {
                  $set: {
                    start: session.assoc_time * 1000,
                    duration: session.uptime,
                  },
                });
              } else {
                await this.reportModel.findByIdAndUpdate(item._id, {
                  $set: {
                    end:
                      (session.disconnect_timestamp || session.last_seen || 0) *
                      1000,
                  },
                });
              }
            }
          }
        }
      } catch (error) {
        console.log(
          'call unifi',
          item.trackingId,
          this.base_url_unifi[item.trackingId],
          this.session_unifi[item.trackingId],
        );
        // this.session_unifi[item.trackingId] = null;
        if (error.response) {
          console.log('scanSessionUnifi error', error.response.data);
          if (error.response.status === 401) {
            this.session_unifi[item.trackingId] = null;
          }
        } else {
          console.log('scanSessionUnifi other error', error);
        }
      }
    });
  }

  async insertTracking(data: ReportUsage) {
    const closeSession = await this.reportModel.findOne({
      mac: data.mac,
      end: { $exists: false },
    });
    if (closeSession && Date.now() - closeSession.createdAt < 10000) {
      closeSession.createdAt = Date.now();
      return closeSession.save();
    }
    return this.reportModel.create({
      ...data,
      createdAt: Date.now(),
      start: Date.now(),
      duration: 0,
    });
  }

  async queryUsage({ query = {}, skip = 0, limit = 10 }: QueryListDTO) {
    const results = await this.reportModel
      .find(query)
      .sort('-createdAt')
      .limit(limit)
      .skip(skip);
    const total = await this.reportModel.countDocuments(query);
    return {
      data: results.map((item) => item.toJSON()),
      total,
    };
  }

  async exportUsage({ query = {} }: QueryListDTO) {
    return this.reportModel.find(query).sort('-createdAt');
  }

  async analyticReport({ query = {} }: QueryListDTO) {
    const rangeFrom = query.createdAt?.$gte;
    const rangeTo = query.createdAt?.$lte;

    const weeks = {};
    const locations = {};
    for (
      let idx = moment(rangeFrom).isoWeek();
      idx <= moment(rangeTo).isoWeek();
      idx++
    ) {
      weeks[idx] = { locations: {} };
      if (moment().isoWeek(idx).startOf('isoWeek').valueOf() >= rangeFrom) {
        weeks[idx].start = moment().isoWeek(idx).startOf('isoWeek').valueOf();
      } else {
        weeks[idx].start = rangeFrom;
      }
      if (moment().isoWeek(idx).endOf('isoWeek').valueOf() <= rangeTo) {
        weeks[idx].end = moment().isoWeek(idx).endOf('isoWeek').valueOf();
      } else {
        weeks[idx].end = rangeTo;
      }
    }
    await Promise.each(Object.keys(weeks), async (idx) => {
      const [summary, overTop] = await Promise.all([
        this.reportModel.aggregate([
          {
            $match: {
              createdAt: { $gte: weeks[idx].start, $lte: weeks[idx].end },
              duration: { $gt: 0 },
            },
          },
          {
            $group: {
              _id: '$location',
              timeAvg: { $avg: '$duration' },
              maxTime: { $max: '$duration' },
              totalSession: { $sum: 1 },
            },
          },
        ]),
        this.reportModel.aggregate([
          {
            $match: {
              createdAt: { $gte: weeks[idx].start, $lte: weeks[idx].end },
              duration: { $gt: 10800 },
            },
          },
          {
            $group: {
              _id: '$location',
              totalSession: { $sum: 1 },
            },
          },
        ]),
      ]);
      if (summary.length) {
        const devicesAmount = await Promise.all(
          summary.map((item) =>
            this.reportModel.aggregate([
              {
                $match: {
                  createdAt: { $gte: weeks[idx].start, $lte: weeks[idx].end },
                  location: item._id,
                },
              },
              { $count: 'mac' },
            ]),
          ),
        );
        const maxDays = await Promise.all(
          summary.map((item) =>
            this.reportModel
              .find({
                createdAt: { $gte: weeks[idx].start, $lte: weeks[idx].end },
                duration: item.maxTime,
              })
              .select('start'),
          ),
        );
        for (let iSum = 0; iSum < summary.length; iSum++) {
          const summaryEle = summary[iSum];
          const overTopEle = overTop[iSum];
          const devicesAmountEle = devicesAmount[iSum];
          const maxDaysEle = maxDays[iSum];
          if (!weeks[idx].locations[summaryEle._id]) {
            weeks[idx].locations[summaryEle._id] = {};
          }
          if (overTopEle) {
            if (!weeks[idx].locations[overTopEle._id]) {
              weeks[idx].locations[overTopEle._id] = {};
            }
            weeks[idx].locations[overTopEle._id].overTime =
              overTopEle.totalSession;
          }
          weeks[idx].locations[summaryEle._id].avgTime = summaryEle.timeAvg;
          weeks[idx].locations[summaryEle._id].totalSession =
            summaryEle.totalSession;
          weeks[idx].locations[summaryEle._id].maxDays = [];
          weeks[idx].locations[summaryEle._id].maxDuration = summaryEle.maxTime;
          weeks[idx].locations[summaryEle._id].totalDevice = 0;
          if (devicesAmountEle && devicesAmountEle.length) {
            weeks[idx].locations[summaryEle._id].totalDevice =
              devicesAmountEle[0].mac;
          }
          if (maxDaysEle && maxDaysEle.length) {
            weeks[idx].locations[summaryEle._id].maxDays = maxDaysEle.map(
              (item) => moment(item.start).day(),
            ); // Sunday as 0 and Saturday as 6
          }
        }
      }
    });

    const reportTotal = await this.reportModel.aggregate([
      {
        $match: {
          createdAt: query.createdAt,
          duration: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$location',
          timeAvg: { $avg: '$duration' },
          maxTime: { $max: '$duration' },
        },
      },
    ]);
    const reportTotalMaxDay = await Promise.all(
      reportTotal.map((item) =>
        this.reportModel
          .find({
            createdAt: query.createdAt,
            duration: item.maxTime,
          })
          .select('start'),
      ),
    );

    for (let iTotal = 0; iTotal < reportTotal.length; iTotal++) {
      const totalEle = reportTotal[iTotal];
      const totalMaxDaysEle = reportTotalMaxDay[iTotal];
      if (!locations[totalEle._id]) {
        locations[totalEle._id] = {};
      }
      locations[totalEle._id].avgTime = totalEle.timeAvg;
      locations[totalEle._id].maxDays = [];
      locations[totalEle._id].maxDuration = totalEle.maxTime;
      if (totalMaxDaysEle && totalMaxDaysEle.length) {
        locations[totalEle._id].maxDays = totalMaxDaysEle.map((item) =>
          moment(item.start).date(),
        );
      }
    }

    console.log('report weeks', JSON.stringify(weeks));
    console.log('report locations', JSON.stringify(locations));
    return {
      weeks,
      locations,
    };
  }
}

const convertMacRadius = (mac: string) => mac.replace(/:/g, '-');

const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
