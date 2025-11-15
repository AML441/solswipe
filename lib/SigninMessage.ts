import nacl from "tweetnacl";
import bs58 from "bs58";

export class SigninMessage {
  domain: string;
  publicKey: string;
  nonce: string;
  statement: string;

  constructor({ domain, publicKey, nonce, statement }: any) {
    this.domain = domain;
    this.publicKey = publicKey;
    this.nonce = nonce;
    this.statement = statement;
  }

  prepare() {
    return `${this.domain} wants you to sign in with your Solana wallet:\n${this.publicKey}\n\n${this.statement}\n\nNonce: ${this.nonce}`;
  }

  validate(signature: string) {
    const messageBytes = new TextEncoder().encode(this.prepare());
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(this.publicKey);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  }
}