import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class AlertsStreamService {
  private readonly subject = new Subject<unknown>();

  emit(alert: unknown) {
    this.subject.next(alert);
  }

  asObservable() {
    return this.subject.asObservable();
  }
}