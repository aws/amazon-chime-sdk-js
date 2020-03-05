const awsPath: string = '/Prod';
const rootPath: string = window.location.href.includes(awsPath) ? `${awsPath}/` : '/';

const routes: any = {
  CONTROLLER: `${rootPath}controller`,
  MEETING: `${rootPath}meeting`,
  ROOT: `${rootPath}`,
};

export default routes;
