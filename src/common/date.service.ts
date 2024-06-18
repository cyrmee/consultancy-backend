import { Injectable } from '@nestjs/common';

@Injectable()
export class DateService {
  getCurrentDate() {
    return new Date();
  }

  extractUTCDate(date: Date): string {
    if (!date) {
      throw new Error('Invalid date');
    }

    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${day}-${month}-${year}`;
  }
}
