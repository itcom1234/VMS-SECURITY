import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class WorkerKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-worker-key'];
    const expected = process.env.WORKER_API_KEY ?? 'dev-worker-key-change-me';
    if (key !== expected) {
      throw new UnauthorizedException('Invalid worker key');
    }
    return true;
  }
}