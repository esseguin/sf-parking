import * as soda from 'soda-js';
import * as _ from 'lodash';
import * as moment from 'moment';

import { IAddressConfig } from './ConfigWrapper';

interface ISFGovTowZone {
  toaddress: string;
  fromaddress: string;
  streetname: string;
  starting_date: string; // eslint-disable-line
  ending_date: string; // eslint-disable-line
  starttime: string;
  endtime: string;
}

export interface ITowZone {
  addressRange: string;
  timeRange: string;
}

const parseRow = (row: ISFGovTowZone) => {
  const addressRange = `${row.fromaddress} - ${row.toaddress} ${row.streetname}`;
  const startDate = moment(row.starting_date).format('dddd, MMMM Do YYYY');
  const endDate = moment(row.ending_date).format('dddd, MMMM Do YYYY');
  const timeRange = `${startDate} ${row.starttime} - ${endDate} ${row.endtime}`;

  return {
    addressRange,
    timeRange,
  } as ITowZone;
};

const checker = (address: IAddressConfig) => (onSuccess: Function, onError: Function) => {
  const consumer = new soda.Consumer('data.sfgov.org');
  const nowStr = moment().format('YYYY-MM-DDTHH:mm:ss');
  const streetNumber = parseInt(address.streetNumber, 10);

  consumer.query()
    .withDataset('cqn5-muyy')
    .where(soda.expr.gte('ending_date', nowStr))
    .where({
      streetname: address.streetName,
    })
    // .order('namelast')
    .getRows()
    .on('success', (rows: Array<ISFGovTowZone>) => {
      // street number ranges are strings from the api, so they can't be properly
      // queried on.
      const processRow = (memo: Array<Object>, row: ISFGovTowZone) => {
        const toAddress = parseInt(row.toaddress, 10);
        const fromAddress = parseInt(row.fromaddress, 10);
        if (fromAddress <= (streetNumber + 50) && toAddress >= (streetNumber - 50)) {
          memo.push(parseRow(row));
        }
        return memo;
      };

      const newRows = _.reduce(rows, processRow, []);
      onSuccess(newRows);
    })
    .on('error', onError);
};

export default checker;
