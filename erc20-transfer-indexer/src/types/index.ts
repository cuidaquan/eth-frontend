export interface Transfer {
  id: string;
  tokenContract: string;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  blockHash: string;
  fromAddress: string;
  toAddress: string;
  valueRaw: string;
  valueDecimal?: string;
  timestamp: Date;
  createdAt: Date;
}

export interface IndexState {
  tokenContract: string;
  lastIndexedBlock: number;
  updatedAt: Date;
}

export interface TransferResponse {
  data: TransferData[];
  nextCursor?: string;
}

export interface TransferData {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  valueRaw: string;
  value: string;
  tokenContract: string;
}

export interface TransferQueryParams {
  address: string;
  direction?: 'sent' | 'received' | 'all';
  limit?: number;
  cursor?: string;
}
