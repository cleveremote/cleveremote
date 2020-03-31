import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { getCustomRepository } from 'typeorm';
import { UserExt } from '../repositories/user.ext';
import { mergeMap, map } from 'rxjs/operators';
import { Observable, from, of } from 'rxjs';
import { sign } from 'jsonwebtoken';
import { ProviderService } from './provider.service';
import { AccountService } from './account.service';
import { ProviderEntity } from '../entities/provider.entity';
import { v1 } from 'uuid';

//import * as jwt from 'jsonwebtoken';

export enum Provider {
  GOOGLE = 'google'
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly providerService: ProviderService,
    private readonly accountService: AccountService
  ) { }

  public validateUser(username: string, pass: string): Observable<any> {
    const userRepo = getCustomRepository(UserExt);

    return userRepo.getUserByEmail(username)
      .pipe(mergeMap(user =>
        this.passwordsAreEqual(user.password, pass).pipe(map((result) => user))
      ));

    // const user = await this.usersService.findOne(username);
    // console.log(user);
    // if (user && (await this.passwordsAreEqual(user.password, pass))) {
    //   const { password, ...result } = user;
    //   return result;
    // }
    // return null;
  }

  login(user: any) {
    const token = sign({
      data: user,
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { success: true, user, token, expiresIn: 3600 };
    // return {
    //   access_token: this.jwtService.sign(payload)
    // };
  }

  public passwordsAreEqual(hashedPassword: string, plainPassword: string
  ): Observable<any> {
    return from(bcrypt.compare(plainPassword, hashedPassword));
  }

  async validateOAuthLogin(thirdPartyId: any, provider: Provider, link = false): Promise<any> {
    try {
      const provider = await this.createProvide(thirdPartyId).toPromise();
      const data = provider.user;
      data.sessionId = v1();
      const token = sign({
        data: data
      }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return { success: true, data, token, expiresIn: 3600 };
    } catch (err) {
      throw new InternalServerErrorException('validateOAuthLogin', err.message);
    }
  }


  public createProvide(profile: any): Observable<any> {
    const userRepo = getCustomRepository(UserExt);
    return this.providerService.get(profile.id)
      .pipe(mergeMap((provider: ProviderEntity) => {
        if (!provider) {
          const dataJson = `{
                    "id": "server_1",
                    "name": "compte boitier ferme123",
                    "description": "le compte correspondant au boitier de la ferme",
                    "users": [
                        {
                            "id": "providerTest",
                            
                            "accountId": "server_1",
                            "email": "nadime.yahyaoui@gmail.com",
                            "phone": "06827375051",
                            "password": "$2a$08$GvDZDoL..cHoc8n8HFUp6en6PiH5I2cqYvj4xDsbomC25WPc/6Iwb",
                            "providers": [
                                {
                                    "providerId": "provider_1",
                                    "userId": "server_1",
                                    "provider": "google",
                                    "providerUid": "uid"
                                }
                            ]
                        }
                    ]
                }`;
          const data = JSON.parse(dataJson);
          data.accountId = 'server_1';
          data.name = v1();
          data.users[0].id = profile.id;
          data.users[0].firstName = v1();
          data.users[0].lastName = v1();
          data.users[0].email = v1();
          data.users[0].phone = v1();
          data.users[0].password = v1();
          data.users[0].accountId = 'server_1';
          data.users[0].providers[0].providerId = profile.id;
          data.users[0].providers[0].providerUid = profile.id;
          return this.accountService.add(data).pipe(map((result) => {
            return userRepo.getUserByEmail(result.users[0].email);
          }));
        }
        return of(provider);
      }));
  }

}
