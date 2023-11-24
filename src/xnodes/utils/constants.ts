export const marks = [
  {
    value: 1,
    label: '1',
  },
  {
    value: 2,
    label: '2',
  },
  {
    value: 3,
    label: '3',
  },
  {
    value: 4,
    label: '4',
  },
  {
    value: 5,
    label: '5',
  },
  {
    value: 6,
    label: '6',
  },
];

export const sourceList = [
  {
    category: 'Off Chain',
    sources: [
      'apollox',
      'binance',
      'binancefutures',
      'bitfinex',
      'bybit',
      'coinbase',
      'deribit',
      'dydx',
      'gemini',
      'kraken',
      'krakenfutures',
      'phemex',
    ],
  },
  {
    category: 'On Chain',
    sources: ['ethereum'],
  },
];

export const defaultSourcePayload = {
  name: 'connectors',
  namespace: 'openmesh',
  args: '--set image.repository=gdafund/collector --set image.tag=20230406.7',
  command: 'helm upgrade --install',
  helmChartName: 'l3a-connector',
  helmRepoName: 'L3A-Protocol',
  helmRepoUrl:
    'https://raw.githubusercontent.com/L3A-Protocol/gda-helm-repo/main/',
  ingress: {
    enabled: false,
    hostname: null,
  },
  helmValuesRepo: 'github.com/L3A-Protocol/gda-helm-charts.git',
  pathToChart: 'charts',
};

export const defaultWSPayload = {
  name: 'websocket_server',
  namespace: 'openmesh',
  args: '--set image.repository=gdafund/l3_atom --set image.tag=0.1.0',
  command: 'helm upgrade --install',
  helmChartName: 'l3a-app',
  helmRepoName: 'L3A-Protocol',
  helmRepoUrl:
    'https://raw.githubusercontent.com/L3A-Protocol/gda-helm-repo/main/',
  helmValuesRepo: 'github.com/L3A-Protocol/gda-helm-charts.git',
  ingress: {
    enabled: true,
    hostname: 'ws',
  },
  pathToChart: 'charts',
  workloads: ['websocketserver'],
};

export const defaultStreamProcessorPayload = {
  name: 'stream_processor',
  namespace: 'openmesh',
  args: '--set image.repository=gdafund/l3_atom --set image.tag=0.1.0',

  command: 'helm upgrade --install',
  repositoryName: 'L3A-Protocol',
  repository:
    'https://raw.githubusercontent.com/L3A-Protocol/gda-helm-repo/main/',
  helmChartName: 'l3a-app',
  helmRepoName: 'L3A-Protocol',
  helmRepoUrl:
    'https://raw.githubusercontent.com/L3A-Protocol/gda-helm-repo/main/',
  helmValuesRepo: 'github.com/L3A-Protocol/gda-helm-charts.git',
  ingress: {
    enabled: false,
    hostname: null,
  },
  pathToChart: 'charts',
  workloads: ['streamprocessor'],
};
