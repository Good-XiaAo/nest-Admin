import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getAuth(): string {
    return `hello, this is the auth Authroute`;
  }
}
