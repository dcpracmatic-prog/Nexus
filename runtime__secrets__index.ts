export interface SecretReference { id:string; envKey:string; provider:string; createdAt:string; active:boolean; }
export function resolveSecretReference(ref:SecretReference){const value=process.env[ref.envKey];return {present:!!value,envKey:ref.envKey,masked:value?`${value.slice(0,3)}•••${value.slice(-2)}`:"NOT_SET"};}
