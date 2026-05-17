import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class CustomParseIntPipe implements PipeTransform<string, number> {
  private message = 'id 必须是有效的数字';

  transform(value: string): number {
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) {
      throw new BadRequestException(this.message);
    }
    return num;
  }
}
