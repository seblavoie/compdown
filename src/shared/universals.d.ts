/**
 * Event types for ExtendScript <-> CEP panel communication
 */
export type EventTS = {
  compdownProgress: {
    step: string;
    current: number;
    total: number;
  };
  compdownError: {
    message: string;
    step: string;
  };
};
