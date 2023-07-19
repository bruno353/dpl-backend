import remessa_cobranca_bradesco from './remessaCobranca/bradesco';
import remessa_cobranca from './remessaCobranca/schema';

export default {
  remessa_cobranca: {
    schema: remessa_cobranca,
    bradesco: remessa_cobranca_bradesco,
  },
};
