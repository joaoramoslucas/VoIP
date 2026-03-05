export type SipTransport = 'tcp' | 'udp' | 'tls';

export type SipRegistrationMappedState =
    | 'none'
    | 'progress'
    | 'ok'
    | 'failed';

export type SipCallMappedState =
    | 'idle'
    | 'incoming'
    | 'outgoing'
    | 'connected'
    | 'updating'
    | 'ended'
    | 'error';

export type SipAccountCredentials = {
    sipDomain: string;
    username: string;
    password: string;
    transport: SipTransport;
};

export type SipRegistrationSnapshot = {
    message: string;
    lastUpdatedAtMs: number;
    state: SipRegistrationMappedState;
};

export type SipCallSnapshot = {
    message: string;
    lastUpdatedAtMs: number;
    remoteUri: string | null;
    state: SipCallMappedState;
    direction: 'Incoming' | 'Outgoing' | null;
};