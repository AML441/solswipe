import { Organization } from "./organization";
import { Wallet } from "./wallet";

export interface User{
    gmail: string,
    name: string,
    wallets: Wallet[],
    saved: Organization[]
}