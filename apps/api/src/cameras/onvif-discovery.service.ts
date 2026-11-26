import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Onvif } from 'onvif';
import type { Profile } from 'onvif/interfaces/onvif';
import { OnvifDiscoverDto } from './dto/onvif-discover.dto';
import {
  classifyOnvifError,
  pickSuggestedProfileToken,
  profileVideoWidth,
  type OnvifProfileSummary,
} from './onvif-discovery.util';

export type OnvifDiscoverResult = {
  device: {
    manufacturer?: string;
    model?: string;
    firmwareVersion?: string;
    serialNumber?: string;
    hardwareId?: string;
  };
  profiles: OnvifProfileSummary[];
  suggestedProfileToken?: string;
  suggestedRtspUrl?: string;
};

@Injectable()
export class OnvifDiscoveryService {
  private readonly logger = new Logger(OnvifDiscoveryService.name);

  async discover(dto: OnvifDiscoverDto): Promise<OnvifDiscoverResult> {
    const onvif = this.createClient(dto);
    try {
      await onvif.connect();
      const info = await onvif.device.getDeviceInformation();
      const profiles = await this.resolveStreamProfiles(onvif, dto.host);
      if (!profiles.length) {
        throw new BadRequestException(
          'ONVIF device connected but returned no media profiles.',
        );
      }
      const suggestedProfileToken = pickSuggestedProfileToken(profiles);
      const suggested = profiles.find((p) => p.token === suggestedProfileToken);
      return {
        device: {
          manufacturer: info.manufacturer,
          model: info.model,
          firmwareVersion: info.firmwareVersion,
          serialNumber: info.serialNumber,
          hardwareId: info.hardwareId,
        },
        profiles,
        suggestedProfileToken,
        suggestedRtspUrl: suggested?.rtspUrl ?? undefined,
      };
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof UnauthorizedException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      throw this.toHttpException(err);
    } finally {
      await onvif.close().catch(() => undefined);
    }
  }

  async rtspUrlForProfile(
    dto: OnvifDiscoverDto,
    profileToken: string,
  ): Promise<string> {
    const onvif = this.createClient(dto);
    try {
      await onvif.connect();
      const url = await this.fetchStreamUri(onvif, profileToken);
      if (!url) {
        throw new BadRequestException(
          `Could not get RTSP URL for profile ${profileToken}`,
        );
      }
      return url;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw this.toHttpException(err);
    } finally {
      await onvif.close().catch(() => undefined);
    }
  }

  private createClient(dto: OnvifDiscoverDto): Onvif {
    return new Onvif({
      hostname: dto.host.trim(),
      port: dto.port ?? (dto.useSecure ? 443 : 80),
      username: dto.username,
      password: dto.password,
      useSecure: dto.useSecure ?? false,
      path: dto.path,
      preserveAddress: true,
      timeout: Number(process.env.ONVIF_TIMEOUT_MS ?? 15_000),
    });
  }

  private async resolveStreamProfiles(
    onvif: Onvif,
    host: string,
  ): Promise<OnvifProfileSummary[]> {
    const raw = onvif.profiles ?? [];
    const out: OnvifProfileSummary[] = [];
    for (const profile of raw) {
      let rtspUrl: string | null = null;
      try {
        rtspUrl = await this.fetchStreamUri(onvif, profile.token, profile);
      } catch (err) {
        this.logger.debug(
          `No RTSP for profile ${profile.token}: ${String(err)}`,
        );
      }
      if (rtspUrl) {
        rtspUrl = this.rewriteRtspHost(onvif, rtspUrl, host);
      }
      out.push({
        token: profile.token,
        name: profile.name,
        rtspUrl,
        videoWidth: profileVideoWidth(profile),
        fixed: profile.fixed,
      });
    }
    return out;
  }

  private async fetchStreamUri(
    onvif: Onvif,
    profileToken: string,
    profile?: Profile,
  ): Promise<string | null> {
    if (onvif.media) {
      try {
        await onvif.setActiveMediaProfile(profileToken);
        const stream = await onvif.media.getStreamUri({
          profileToken,
          protocol: 'RTSP',
        });
        const uri = stream?.uri;
        if (uri) return uri;
      } catch (err) {
        this.logger.debug(`Media1 getStreamUri failed: ${String(err)}`);
      }
    }
    if (onvif.media2) {
      try {
        const uri = await onvif.media2.getStreamUri({
          profileToken,
          protocol: 'RtspUnicast',
        });
        if (typeof uri === 'string' && uri) return uri;
      } catch (err) {
        this.logger.debug(`Media2 getStreamUri failed: ${String(err)}`);
      }
    }
    if (!profile && onvif.profiles?.length) {
      const p = onvif.profiles.find((x) => x.token === profileToken);
      if (p) return this.fetchStreamUri(onvif, profileToken, p);
    }
    return null;
  }

  private rewriteRtspHost(onvif: Onvif, rtspUrl: string, host: string): string {
    try {
      return onvif.rewriteUri(rtspUrl, { host });
    } catch {
      return rtspUrl;
    }
  }

  private toHttpException(err: unknown): never {
    const { code, message } = classifyOnvifError(err);
    if (code === 'AUTH_FAILED') {
      throw new UnauthorizedException(message);
    }
    if (code === 'UNREACHABLE' || code === 'NOT_ONVIF') {
      throw new ServiceUnavailableException(message);
    }
    throw new BadRequestException(message);
  }
}