/* global Promise */
// const _ = require('underscore');
import * as _ from 'lodash';
import * as colors from 'colors';
import * as swig from 'swig';
import * as parseArgs from 'minimist';
import * as Table from 'cli-table';

import ConfigWrapper from './ConfigWrapper';
import TowZoneChecker, { ITowZone } from './TowZoneChecker';
import EmailSender from './EmailSender';

const templateDir = `${process.cwd()}/templates/`;
const args = parseArgs(process.argv.slice(2), {
  alias: {
    out: ['o'],
  },
  default: {
    out: 'print',
  },
});

const car   = ConfigWrapper.getCar();
const email = ConfigWrapper.getEmail();

const {
  license,
  address,
} = car;
const formattedLocation = `${address.streetNumber} ${address.streetName}`;

// const promised = fn => new Promise((resolve, reject) => fn(resolve, reject));
// const p1 = promised(_.partial(TowZoneChecker.check, location));

const p1 = new Promise(TowZoneChecker(address));

const handlePromise = (results: Array<any>) => {
  const towZoneInfo: Array<ITowZone> = results[0];
  switch (args.out) {
    case 'email': {
      const nodemailerConfig = email.config;
      const from = `Parking Report < ${nodemailerConfig.auth.user} >`;
      const template = swig.compileFile(`${templateDir}email.html`);
      const html = template({
        license,
        address: formattedLocation,
        towZones: towZoneInfo,
      });
      const mailOptions = {
        from,
        html,
        to: email.to,
        subject: 'Parking Report',
      };
      EmailSender.sendEmail(nodemailerConfig, mailOptions);
      break;
    }
    case 'print': {
      const table = new Table({
        head: ['Location', 'Times Enforced'],
      });
      _.each(towZoneInfo, row => table.push([row.addressRange, row.timeRange]));

      console.log('===================================================================');
      console.log('Parking Report');
      console.log('===================================================================');
      console.log(`License: ${colors.green(license)}, Location: ${colors.green(formattedLocation)}`);
      console.log('\nUpcoming tow zones:');
      console.log(table.toString());
      break;
    }
    default:
      break;
  }
};

Promise.all([p1]).then(handlePromise).catch(err => console.log(err));
