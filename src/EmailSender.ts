import * as nodemailer from 'nodemailer';
import { INodemailerConfig } from './ConfigWrapper';

const sendEmail = (nodemailerConfig: INodemailerConfig, mailOptions: Object) => {
  const transporter = nodemailer.createTransport(nodemailerConfig);
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    }
    console.log(`Message sent: ${info.response}`);
  });
};
export default {
  sendEmail,
};
