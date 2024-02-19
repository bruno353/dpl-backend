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
  namespace: 'openmesh',
  args: '--set image.repository=gdafund/collector --set image.tag=20230406.7',
  command: 'helm upgrade --install',
  helmChartNameSuffix: '-connector',
  helmRepoName: 'openmesh-network',
  helmRepoUrl: 'https://raw.githubusercontent.com/Openmesh-Network/gda-helm-repo/main/',
  ingress: {
    enabled: false,
    hostname: null,
  },
};

export const defaultWSPayload = {
  namespace: 'openmesh',
  args: '--set image.repository=gdafund/l3_atom --set image.tag=0.1.0',
  command: 'helm upgrade --install',
  helmChartNameSuffix: '-app',
  helmRepoName: 'openmesh-network',
  helmRepoUrl: 'https://raw.githubusercontent.com/Openmesh-Network/gda-helm-repo/main/',
  ingress: {
    enabled: true,
    hostname: 'ws',
  },
  workloads: ['websocketserver'],
};

export const defaultStreamProcessorPayload = {
  namespace: 'openmesh',
  args: '--set image.repository=gdafund/l3_atom --set image.tag=0.1.0',
  command: 'helm upgrade --install',
  helmChartNameSuffix: '-app',
  helmRepoName: 'openmesh-network',
  helmRepoUrl: 'https://raw.githubusercontent.com/Openmesh-Network/gda-helm-repo/main/',
  ingress: {
    enabled: false,
    hostname: null,
  },
  workloads: ['streamprocessor'],
};
