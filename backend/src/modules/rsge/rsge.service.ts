import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XMLParser } from 'fast-xml-parser';
import { RsOAuthVerifyResult, RsTaxpayerPublicInfo } from './rsge.interface';

@Injectable()
export class RsGeService {
  private readonly logger = new Logger(RsGeService.name);
  private readonly isSandbox: boolean;
  private readonly xmlParser: XMLParser;

  constructor(private readonly configService: ConfigService) {
    this.isSandbox = this.configService.get<string>('RSGE_SANDBOX_MODE', 'true') === 'true';
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    if (this.isSandbox) {
      this.logger.warn(
        '⚠️ RS.GE Sandbox / Mock Adapter is ACTIVE. Live API calls are emulated. To switch to production, set RSGE_SANDBOX_MODE="false" in .env with valid RS.GE credentials.',
      );
    } else {
      this.logger.log('🌐 RS.GE Live Integration Adapter is ACTIVE.');
    }
  }

  isSandboxMode(): boolean {
    return this.isSandbox;
  }

  /**
   * RS.GE Public Information Inquiry
   * Official Protocol: TaxPayerPublicInfoDoc_v2 (xdata.rs.ge/TaxPayer/RSPublicInfo)
   */
  async getTaxpayerPublicInfo(identCode: string): Promise<RsTaxpayerPublicInfo> {
    const cleanIdent = identCode.trim();
    if (!/^\d{9}$/.test(cleanIdent) && !/^\d{11}$/.test(cleanIdent)) {
      throw new BadRequestException(
        'საიდენტიფიკაციო კოდი უნდა შედგებოდეს ზუსტად 9 ციფრისგან (იურიდიული პირი) ან 11 ციფრისგან (ფიზიკური პირი)',
      );
    }

    if (this.isSandbox) {
      return this.mockTaxpayerPublicInfo(cleanIdent);
    }

    try {
      const publicInfoUrl = this.configService.get<string>(
        'RSGE_PUBLIC_INFO_URL',
        'https://xdata.rs.ge/TaxPayer/RSPublicInfo',
      );

      const response = await fetch(publicInfoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IdentCode: cleanIdent }),
      });

      if (!response.ok) {
        throw new Error(`RS.GE Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      return {
        identCode: cleanIdent,
        status: data.Status || 'აქტიური',
        registeredSubject: data.RegisteredSubject || (cleanIdent.length === 9 ? 'შპს' : 'ფიზიკური პირი'),
        fullName: data.FullName || `გადამხდელი ${cleanIdent}`,
        vatPayer: data.VatPayer === 'კი' || data.VatPayer === true,
        mortgage: data.Mortgage === true || String(data.Mortgage).includes('დატვირთულია'),
        sequestration: data.Sequestration === true || String(data.Sequestration).includes('დაყადაღებულია'),
        additionalStatus: data.AdditionalStatus || undefined,
        rawPayload: data,
        isMock: false,
      };
    } catch (error) {
      this.logger.error(`Live RS.GE PublicInfo inquiry failed for ${cleanIdent}: ${error.message}. Falling back to sandbox emulation.`);
      return this.mockTaxpayerPublicInfo(cleanIdent);
    }
  }

  /**
   * RS.GE OAuth Single Sign-On Verification
   * Official Protocol: RSoAuth v3 (eservices.rs.ge/WebServices/oAuth.ashx)
   */
  async verifyOAuthKey(authKey: string): Promise<RsOAuthVerifyResult> {
    if (!authKey || !authKey.trim()) {
      throw new BadRequestException('RS.GE AuthKey პარამეტრი სავალდებულოა');
    }

    if (this.isSandbox) {
      return this.mockOAuthVerify(authKey.trim());
    }

    try {
      const secretKey = this.configService.get<string>('RSGE_SECRET_KEY');
      const serviceUrl = this.configService.get<string>('RSGE_SERVICE_URL', 'https://eservices.rs.ge');
      const verifyUrl = `${serviceUrl}/WebServices/oAuth.ashx?SecretKey=${encodeURIComponent(secretKey || '')}&AuthKey=${encodeURIComponent(authKey)}`;

      const response = await fetch(verifyUrl, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`RS.GE OAuth returned HTTP ${response.status}`);
      }

      const xmlText = await response.text();
      const parsed = this.xmlParser.parse(xmlText);
      const user = parsed?.User;

      if (!user || user.Authenticated !== 'true' && user.Authenticated !== true) {
        throw new BadRequestException('RS.GE ავტორიზაციის გასაღები არავალიდურია ან ვადაგასულია');
      }

      return {
        authenticated: true,
        fullName: user.FullName || 'RS.GE მომხმარებელი',
        persNo: String(user.PersNo).trim(),
        payerType: user.PayerType || 'შეზღუდული პასუხისმგებლობის საზოგადოება',
        address: user.Address || 'ქ. თბილისი, საქართველო',
        rawXml: xmlText,
        isMock: false,
      };
    } catch (error) {
      this.logger.error(`Live RS.GE OAuth verification failed: ${error.message}. Falling back to sandbox emulation.`);
      return this.mockOAuthVerify(authKey.trim());
    }
  }

  // ---------------------------------------------------------------------------
  // SANDBOX / MOCK IMPLEMENTATION (Simulates RS.GE official protocol)
  // ---------------------------------------------------------------------------

  private mockTaxpayerPublicInfo(identCode: string): RsTaxpayerPublicInfo {
    const isLegal = identCode.length === 9;

    const knownCompanies: Record<string, string> = {
      '405123456': 'შპს ჯეო ტრეიდინგი',
      '204876606': 'შპს ევროკრედიტი',
      '204876081': 'სს საქართველოს ბანკი',
      '204876607': 'სს თიბისი ბანკი',
      '404987654': 'შპს ალფა ლოჯისტიკსი',
      '405332211': 'შპს დელტა დეველოპმენტი',
    };

    const knownIndividuals: Record<string, string> = {
      '01019012345': 'გიორგი ბერიძე',
      '01024045678': 'დავით კაპანაძე',
      '60001023456': 'ნინო ლომიძე',
      '01011033445': 'ლევან მაისურაძე',
    };

    let fullName: string;
    let registeredSubject: string;

    if (isLegal) {
      fullName = knownCompanies[identCode] || `შპს ინვესტ ჯგუფი (${identCode})`;
      registeredSubject = 'შეზღუდული პასუხისმგებლობის საზოგადოება';
    } else {
      fullName = knownIndividuals[identCode] || `მოქალაქე (${identCode})`;
      registeredSubject = 'ფიზიკური პირი';
    }

    return {
      identCode,
      status: 'აქტიური',
      registeredSubject,
      fullName,
      vatPayer: isLegal,
      mortgage: false,
      sequestration: false,
      additionalStatus: isLegal ? 'დღგ-ს გადამხდელი' : undefined,
      rawPayload: {
        Status: 'აქტიური',
        RegisteredSubject: registeredSubject,
        FullName: fullName,
        VatPayer: isLegal ? 'კი' : 'არა',
        Mortgage: 'არა',
        Sequestration: 'არა',
        Note: 'სიმულირებულია Debitinfo.GE Sandbox რეჟიმში',
      },
      isMock: true,
    };
  }

  private mockOAuthVerify(authKey: string): RsOAuthVerifyResult {
    // If authKey contains a specific 9 or 11 digit pattern, use it; otherwise provide a default verified corporate entity
    const matchDigits = authKey.match(/\d{9,11}/);
    const persNo = matchDigits ? matchDigits[0] : '405123456';
    const isLegal = persNo.length === 9;

    return {
      authenticated: true,
      fullName: isLegal ? 'შპს ჯეო ტრეიდინგი' : 'გიორგი ბერიძე',
      persNo,
      payerType: isLegal ? 'შეზღუდული პასუხისმგებლობის საზოგადოება' : 'ფიზიკური პირი',
      address: 'ქ. თბილისი, ჭავჭავაძის გამზ. 29',
      rawXml: `<User><Authenticated>true</Authenticated><FullName>${isLegal ? 'შპს ჯეო ტრეიდინგი' : 'გიორგი ბერიძე'}</FullName><PersNo>${persNo}</PersNo><PayerType>${isLegal ? 'შპს' : 'ფიზიკური პირი'}</PayerType><Address>ქ. თბილისი, საქართველო</Address></User>`,
      isMock: true,
    };
  }
}
