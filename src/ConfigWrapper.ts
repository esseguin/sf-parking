import * as config from 'config';

export interface IAddressConfig {
    streetNumber: string,
    streetName: string,
}

export interface ICarConfig {
  license: string;
  address: IAddressConfig;
}

export interface INodemailerConfig {
  service: string,
  auth: {
    user: string,
    pass: string
  }
}

export interface IEmailConfig {
  to: string,
  config: INodemailerConfig
}

const getCar = () => config.get('car') as ICarConfig;
const getEmail = () => config.get('email') as IEmailConfig;

export default {
  getCar,
  getEmail,
};
