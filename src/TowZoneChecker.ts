import * as soda from 'soda-js';
import * as _ from 'lodash';
import * as moment from 'moment';

import { IAddressConfig } from './ConfigWrapper';

interface ISFGovTowZone {
  address: string;
  sideofstreet: string;
  startdate: string;
  enddate: string;
  starttime: string;
  endtime: string;
  notes: string;
}

export interface ITowZone {
  addressRange: string;
  timeRange: string;
}

const parseRow = (row: ISFGovTowZone) => {
  const startDate = moment(row.startdate, 'MM/DD/YYYY').format('dddd, MMMM Do YYYY');
  const endDate = moment(row.enddate, 'MM/DD/YYYY').format('dddd, MMMM Do YYYY');
  const timeRange = `${startDate} ${row.starttime} - ${endDate} ${row.endtime}`;

  return {
    addressRange: row.address,
    timeRange,
  } as ITowZone;
};

const checker = (address: IAddressConfig) => (onSuccess: Function, onError: Function) => {
  const consumer = new soda.Consumer('data.sfgov.org');
  const nowStr = moment().format('MM/DD/YYYY');
  const streetNumber = parseInt(address.streetNumber, 10);

  // https://data.sfgov.org/Transportation/SFMTA-Enforced-Temporary-Tow-Zones/9dsr-3f97
  consumer.query()
    .withDataset('89jz-v4ye')
    .where(soda.expr.gte('EndDate', nowStr))
    .where(`address like '%${address.streetName}%'`)
    .getRows()
    .on('success', (rows: Array<ISFGovTowZone>) => {
      // street number ranges are part of address in the api, so they can't be properly
      // queried on.
      const processRow = (memo: Array<Object>, row: ISFGovTowZone) => {
        // this parsing is super fragile but the data is in the format '10 - 50 Main St'
        const addressPieces = row.address.split(' - ');
        const fromAddress = parseInt(addressPieces[0], 10);
        const toAddress = parseInt(addressPieces[1].split(' ')[0], 10);

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
